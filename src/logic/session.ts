import { getRedisKey, redis,validate } from "./service";
import { Service } from "typedi";
import * as crypto from "crypto";
import { Global } from "../global";
import { log } from "./service/logger";
import { UserInfoModel } from "./model/userInfo";
import {http} from "./service/rpc";

@Service()
export class SessionService {

    static inst: SessionService;

    static getSessionRedisKey(sessionId: string) {
        return getRedisKey('sessionId', sessionId);
    }

    constructor() {
        SessionService.inst = this;
        console.log("Service: instance created ", SessionService.inst);
    }

    static getIdentityString(validatorIdentity: string, userIdentity: string) {
        return `${validatorIdentity}::${userIdentity}`;
    }
    static getIdentityByString(combineIdentity: string) {
        if (!combineIdentity) { throw new Error(`combineIdentity :${combineIdentity} Error`); }
        const str = combineIdentity.split("::");
        if (str.length !== 2) { throw new Error(`combineIdentity :${combineIdentity} Error`); }
        return {
            validatorIdentity: str[0],
            userIdentity: str[1]
        };
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
        redis().hgetall(tokenKey, function (err: any, reply: any) {
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
            return { result: false };
        }

        const md5 = crypto.createHash('md5');
        const sessionId = md5.update(combineIdentity + Math.random()).digest('hex');
        const isFirstLogin = await this.setUserLastLoginTime(combineIdentity);
        if (isFirstLogin) {
            await this.getUserBriefInfo(combineIdentity);
        }
        await this.renewalSession(sessionId, combineIdentity);
        return {
            sessionId: sessionId
        };
    }

    async getUserId(sessionId: string) {
        const redisKey = SessionService.getSessionRedisKey(sessionId);
        const uid = await redis().get(redisKey);
        if (!uid) {
            throw new Error(`getUserId failed: sessionId<${sessionId}> dose not exsit`);
        }
        return uid;
    }

    async getOnlineList() {
        const redisPattern = getRedisKey("sessionId");
        const keys = await redis().keys(redisPattern + "*");
        const redis_get_promise = redis().pipeline();
        keys.map((k: any) => {
            redis_get_promise.get(k);
        });
        const rsp = await redis_get_promise.exec();
        return rsp.length === 0 ? [] : rsp.map((e: any) => e[1]);
    }

    async renewalSession(sessionId: string, uid: string, time: number = Global.conf.rules.renewal_time_span) {
        const redisKeySession = getRedisKey('sessionId', sessionId);
        log.info(`renewalSession ${redisKeySession} => ${uid}`);
        return await redis().set(redisKeySession, uid, "EX", time);
    }

    async refreshUserInfo(sessionId:string,identity:string){
        const uid = await this.getUserId(sessionId);
        let serverInfo: any[] = Global.conf.serverInfo;
        for (let i = 0; i < serverInfo.length; i++) {
            const curIdentity = serverInfo[i].identity;
            if(curIdentity!== identity) continue;
            const userInfo = await UserInfoModel.findById(uid);
            if(!userInfo) return;
            //判断是否存在该玩家
            for(let i = 0;i<userInfo.serverInfo.length;i++){
                const s = userInfo.serverInfo[i];
                if(s.server_identity === identity) return;
            }
            const url = serverInfo[i].url;
            try {
                let rsp = await http.get<any>(`${url}getUserBriefInfo/${uid}`);
                const data = rsp.data.result;
                console.log(rsp)
                if(data){
                    await UserInfoModel.findOneAndUpdate({_id:uid},{$push:{serverInfo:{server_identity:identity}}});
                }
            } catch (e) {
                console.log(e);
            }
            return;
        }
    }

    async setUserLastLoginTime(uid: string) {
        const user = await UserInfoModel.findOneAndUpdate({ _id: uid }, { $set: { login_time: new Date() } });
        if (user) { return false; }
        try {
            await UserInfoModel.create({ _id: uid, login_time: new Date() });
            return true;
        } catch (e) {
            await UserInfoModel.findOneAndUpdate({ _id: uid }, { $set: { login_time: new Date() } });
        }
        return false;
    }

    async getUserBriefInfo(uid: string) {
        let serverInfo: any[] = Global.conf.serverInfo;
        let userServerInfo = [];
        for (let i = 0; i < serverInfo.length; i++) {
            const identity = serverInfo[i].identity;
            const url = serverInfo[i].url;
            try {
                let rsp = await http.get<any>(`${url}getUserBriefInfo/${uid}`);
                const data = rsp.data.result;
                console.log(rsp)
                if (data) {
                    userServerInfo.push({
                        server_identity: identity,
                    });
                }
            } catch (e) {
                console.log(e);
            }
        }
        await UserInfoModel.updateOne({_id:uid},{$set:{serverInfo:userServerInfo}})
    }
    async refreshUserServerInfo(uid: string, identity: string) {

    }
}
