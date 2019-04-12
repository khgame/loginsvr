import { API, Get, Post, Body, Param } from "../decorators";
import { SessionService } from "../../logic/session";
import { Authorized, CurrentUser, HeaderParam } from "routing-controllers";
import { log } from "../../logic/service/logger";
import { redis, getRedisKey } from "../../logic/service/redis";
import { Global } from "../../global";
import { GameServerService } from "../../logic/gameServer";
import {GameServerMock} from "./gameServer";

@API("/session")
export class SessionMock {
    constructor(public readonly session: SessionService,
        public readonly server: GameServerService
        ) {
    }

    @Post("/get_login_token")
    public async get_login_token(@Body() body: { validatorIdentity: string, userIdentity: string }) {
        return { token: "mock-login-token" };
    }

    @Post("/login")
    public async login(@Body() body: {
        validatorIdentity: string,
        userIdentity: string,
        loginToken: string,
        secret: string,
        algorithm: string
    }) {
        return {
            sessionId: "mock-session-id"
        };
    }

    @Post("/choose_server")
    public async chooseServer(@CurrentUser() sessionID: string, @Body() body: { serverIdentity: string }) {
        return {
            config: "mock-server-config"
        };
    }

    @Post("/heartbeat")
    public async heartbeat(@CurrentUser() sessionId: string) {
        return { sessionId: "mock-session-id" };
    }

    @Get("/online_list")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineList() {
        return [ "mock-user-id" ];
    }

    @Get("/online_state/:sessionId")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineState(@Param("sessionId") sessionId: string) {
        return {
            online: true,
            validatorIdentity: "mock-validator",
            userIdentity: "mock-user-login-id",
            uid: "mock-user-id"
        };
    }

}