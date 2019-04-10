import { API, Get, Post, Body, Param } from "../decorators";
import { SessionService } from "../../logic/session";
import { Authorized, CurrentUser, HeaderParam } from "routing-controllers";
import { log } from "../../logger";
import { redis, getRedisKey } from "../../logic/service/redis";
import { Global } from "../../global";

@API("/session")
export class SessionController {
    constructor(public readonly session: SessionService) {
    }

    @Post("/get_login_token")
    public async get_login_token(@Body() body: { validatorIdentity: string, userIdentity: string }) {
        log.info(`SessionController|get_login_token  ${JSON.stringify(body)}`);
        return { token: await this.session.createLoginToken(body.validatorIdentity, body.userIdentity) };
    }

    @Post("/login")
    public async login(@Body() body: {
        validatorIdentity: string,
        userIdentity: string,
        loginToken: string,
        secret: string,
        algorithm: string
    }) {
        return await this.session.login(
            body.validatorIdentity,
            body.userIdentity,
            body.loginToken,
            body.secret,
            body.algorithm
        );
    }

    @Post("/choose_server")
    public async chooseServer(@CurrentUser() sessionID: string, @Body() body: { serverIdentity: string }) {
        const redisKey = getRedisKey("sessionId", sessionID);
        const value = await redis().get(redisKey);
        if (!value) {
            throw new Error(`sessionId: ${sessionID} is not exsit`);
        }
        let serverInfo : any[] = Global.conf.serverInfo;
        let s = null;
        for (let i = 0; i < serverInfo.length; i++){
            if (serverInfo[i].identity === body.serverIdentity){
                s = serverInfo[i];
                continue;
            }
        }
        if (!s) { throw new Error(`serverIdentity: ${body.serverIdentity} is not exsit`); }
        const server_value = await redis().hget("server", body.serverIdentity);
        if (!server_value) { throw new Error(`server cannot be used`); }
        const server_data = JSON.parse(server_value);
        
        if ((server_data.expireTime < Date.now()) || !server_data.State){
            throw new Error(`server cannot be used`);
        }
        await redis().expire(redisKey, 10 * 60);
        return {
            url: s.url,
            code: s.code
        };
    }

    @Post("/heartbeat")
    public async heartbeat(@CurrentUser() sessionID: string) {
        const redisKey = getRedisKey("sessionId", sessionID);
        const value = await redis().get(redisKey);
        if (!value) {
            throw new Error(`sessionId: ${sessionID} is not exsit`);
        }

        await redis().expire(redisKey, 10 * 60);

        return {
            sessionID,
        };
    }

    @Get("/online_list")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineList() {
        const redisPattern = getRedisKey("sessionId");
        const keys = await redis().keys(redisPattern + "*");
        const redis_get_promise = redis().pipeline();
        keys.map(k => {
            redis_get_promise.get(k);
        });
        const rsp = await redis_get_promise.exec();
        return rsp.length === 0 ? [] : rsp.map((e: any) => e[1]);
    }

    @Get("/online_state/:sessionId")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineState(@Param("sessionId") sessionId: string) {
        const redisKey = getRedisKey("sessionId", sessionId);
        log.info(redisKey);
        const value = await redis().get(redisKey);
        if (!value) {
            return {
                online: false
            };
        }
        console.log(value);
        try{
            const data = SessionService.getIdentityByString(value);
            return {
                online: true,
                validatorIdentity: data.validatorIdentity,
                userIdentity: data.userIdentity,
            };
        }catch (e){
            return {
                online: false
            };
        }
    }

}
