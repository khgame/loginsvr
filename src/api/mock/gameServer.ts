import { API, Body, Get, Post } from "../decorators";
import { Authorized, JsonController, CurrentUser } from "routing-controllers";
import { Global } from "../../global";
import { getRedisKey, redis } from "../../logic/service/redis";
import { GameServerService } from "../../logic/gameServer";
import { SessionService } from "../../logic/session";
import { UserInfoModel } from "../../model/userInfo";

@API("/game_svr")
export class GameServerMock {

    constructor(
        public serverService: GameServerService,
        public sessionService: SessionService
    ) {
    }


    @Get("/list")
    public async list() {
        return [ {
            identity: "mock-server-identity",
            name: "mock-server-name",
            Online: true,
            State: true,
            version: 'mock-server-version',
            person_num: '100',
            isActive: true
        } ];
    }

    @Post("/heartbeat")
    @Authorized("SERVICE")
    public async heartbeat(@Body() body: {
        server_identity: string,
        server_hash: string,
        server_version: string,
        server_state: string,
        server_user_count: number
    }) {
        return redis().hset(getRedisKey("server", "status"), body.server_identity, JSON.stringify({
            expireTime: Date.now() + 60000,
            state: body.server_state,
            user_count: body.server_user_count
        }));
    }

}
