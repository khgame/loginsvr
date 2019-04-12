import { API, Get, Post, Body, Param } from "../decorators";
import { SessionService } from "../../logic/session";
import { Authorized, CurrentUser, HeaderParam } from "routing-controllers";
import { log } from "../../logger";
import { redis, getRedisKey } from "../../logic/service/redis";
import { Global } from "../../global";
import { GameServerService } from "../../logic/gameServer";

@API("/session")
export class SessionController {
    constructor(public readonly session: SessionService,
        public readonly server: GameServerService
        ) {
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
        const uid = await this.session.getUserId(sessionID);
        const serverInfo = await this.server.getServerInfo(body.serverIdentity);
        if (!serverInfo || !serverInfo.status){
            throw new Error(`server cannot be used`);
        }

        if ((serverInfo.status.expire_time < Date.now()) || !serverInfo.status.state){
            throw new Error(`server cannot be used`);
        }
        await this.session.renewalSession(sessionID, uid);
        await this.session.refreshUserInfo(sessionID,body.serverIdentity)
        return serverInfo.config;
    }

    @Post("/heartbeat")
    public async heartbeat(@CurrentUser() sessionId: string) {
        const uid = await this.session.getUserId(sessionId);
        await this.session.renewalSession(sessionId, uid);
        return { sessionId };
    }

    @Get("/online_list")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineList() {
        return await this.session.getOnlineList();
    }

    @Get("/online_state/:sessionId")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineState(@Param("sessionId") sessionId: string) {
        const uid = await this.session.getUserId(sessionId);
        if (!uid) {
            return {
                online: false
            };
        }
        console.log(uid);
        try{
            const data = SessionService.getIdentityByString(uid);
            return {
                online: true,
                validatorIdentity: data.validatorIdentity,
                userIdentity: data.userIdentity,
                uid
            };
        }catch (e){
            return {
                online: false
            };
        }
    }

}
