import {getRedisKey, redis} from "./service/redis";
import {Service} from "typedi";
import * as crypto from "crypto";
import {validate} from "./service/validator";
import {Global} from "../global";



@Service()
export class SessionService {

    static inst : SessionService;

    constructor() {
        SessionService.inst = this;
        console.log("Service: instance created ", SessionService.inst);
    }

    async createLoginToken(
        validatorIdentity: string,
        userIdentity: string
    ){
        const combineIdentity = validatorIdentity + userIdentity;
        const tokenKey = getRedisKey('session-login-tokens', combineIdentity);
        const md5 = crypto.createHash('md5');
        const loginToken = md5.update(combineIdentity + Math.random()).digest('hex');
        await redis().hset(tokenKey, loginToken, Date.now() + 1000 * 60 * 10);
        await redis().expire(tokenKey, 10 * 60);
        redis().hgetall(tokenKey, function(err, reply) {
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
        const combineIdentity = validatorIdentity + userIdentity;
        const hashKey = getRedisKey('session-login-tokens', combineIdentity);
        const checkHash = await redis().hget(hashKey, loginToken);
        if (!checkHash) {
            throw new Error("loginToken are not exist in the hash blobs.");
        }

        const validateResult = await validate(validatorIdentity, userIdentity, loginToken, secret, algorithm)
        return {
            validator: Global.conf.validator,

        };


    }

}
