import {getRedisKey, redis} from "./service/redis";
import {Service} from "typedi";
import * as crypto from "crypto";
import {validate} from "./service/validator";
import {Global} from "../global";
import { log } from "../logger";


@Service()
export class SessionService {

    static inst: SessionService;

    constructor() {
        SessionService.inst = this;
        console.log("Service: instance created ", SessionService.inst);
    }

    static getIdentityString(validatorIdentity: string, userIdentity: string) {
        return `${validatorIdentity}::${userIdentity}`;
    }
    static getIdentityByString(combineIdentity:string){
        if(!combineIdentity) throw new Error(`combineIdentity :${combineIdentity} Error`);
        const str = combineIdentity.split("::");
        if(str.length!==2) throw new Error(`combineIdentity :${combineIdentity} Error`);
        return {
            validatorIdentity :str[0],
            userIdentity :str[1]
        }
    }

    async createLoginToken(
        validatorIdentity: string,
        userIdentity: string
    ) {
        const combineIdentity = SessionService.getIdentityString(validatorIdentity, userIdentity);
        const tokenKey = getRedisKey('session-login-tokens', combineIdentity);
        const md5 = crypto.createHash('md5');
        const loginToken = md5.update(combineIdentity + Math.random()).digest('hex');
        await redis().hset(tokenKey, loginToken, Date.now() + 1000 * 60 * 10);
        await redis().expire(tokenKey, 10 * 60);
        redis().hgetall(tokenKey, function (err, reply) {
            if (reply) {
                Object.keys(reply).forEach(key => {
                    if (reply[key] && parseInt(reply[key]) < Date.now()) {
                        redis().hdel(tokenKey, key);
                    }
                });
            }
        });
        return loginToken;
    }

    async login(
        validatorIdentity: string,
        userIdentity: string,
        loginToken: string,
        secret: string,
        algorithm: string,
    ) {
        const combineIdentity = SessionService.getIdentityString(validatorIdentity, userIdentity);
        const hashKey = getRedisKey('session-login-tokens', combineIdentity);
        const checkHash = await redis().hget(hashKey, loginToken);
        if (!checkHash) {
            throw new Error("loginToken are not exist in the hash blobs.");
        }

        const validateRsp = await validate(validatorIdentity, userIdentity, loginToken, secret, algorithm);

        if (!validateRsp.result) {
            return {result: false};
        }

        const md5 = crypto.createHash('md5');
        const sessionId = md5.update(combineIdentity + Math.random()).digest('hex');
        const redisKey = getRedisKey('sessionId',sessionId);
        await redis().set(redisKey,combineIdentity);
        log.info(`${redisKey}|${sessionId}`)
        await redis().expire(redisKey, 10 * 60);

        return {
            validator: Global.conf.validator,
            sessionId:sessionId
        };
    }


}
