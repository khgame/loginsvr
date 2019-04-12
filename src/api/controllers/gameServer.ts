import { API, Body, Get, Post } from "../decorators";
import { Authorized, JsonController, CurrentUser } from "routing-controllers";
import { Global } from "../../global";
import { getRedisKey, redis } from "../../logic/service/redis";
import { GameServerService } from "../../logic/gameServer";
import { SessionService } from "../../logic/session";
import { UserInfoModel } from "../../model/userInfo";

@API("/game_svr")
export class GameServerController {

    constructor(
        public serverService: GameServerService,
        public sessionService: SessionService
    ) {
    }


    @Get("/list")
    public async list(@CurrentUser() sessionId: string) {
        let serverInfo: any[] = Global.conf.serverInfo;
        const rsp = [];
        const uid = await this.sessionService.getUserId(sessionId);
        const userInfo = await UserInfoModel.findById(uid);
        const myServer: any = {};
        if (userInfo && userInfo.serverInfo) {
            for (let i = 0; i < userInfo.serverInfo.length; i++) {
                const s = userInfo.serverInfo[i];
                myServer[s.server_identity] = 1;
            }
        }
        for (let i = 0; i < serverInfo.length; i++) {
            const identity = serverInfo[i].identity;
            const curServer = await this.serverService.getServerInfo(identity);
            const curRsp: any = {};
            curRsp.identity = identity;
            curRsp.name = curServer.config.name;
            if (!curServer.status) {
                curRsp.Online = false;
                curRsp.State = false;
            } else {
                curRsp.online = curServer.status.expire_time > Date.now();
                curRsp.state = curServer.status.state;
                curRsp.version = curServer.status.version;
                curRsp.person_num = curServer.status.user_count;
                curRsp.is_active = myServer[identity] ? true : false;
            }
            rsp.push(curRsp);
        }
        return rsp;
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
        const data = {
            expire_time: Date.now() + 60000,
            state: body.server_state,
            user_count: body.server_user_count
        }
        await redis().hset(getRedisKey("server", "status"), body.server_identity, JSON.stringify(data));
        return data;
    }

}
