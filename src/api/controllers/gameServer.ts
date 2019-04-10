import {API, Body, Get, Post} from "../decorators";
import {Authorized, JsonController} from "routing-controllers";
import { Global } from "../../global";
import { getRedisKey, redis } from "../../logic/service/redis";
import { GameServerService } from "../../logic/gameServer";

@API("/game_svr")
export class GameServerController {

    constructor(
        public serverService: GameServerService
    ) {
    }


    @Get("/list")
    public async list() {
        let serverInfo : any[] = Global.conf.serverInfo;
        const rsp = [];
        for (let i = 0; i < serverInfo.length; i++){
            const identity = serverInfo[i].identity;
            const s = await this.serverService.getServerInfo(identity);
            const _s : any = {};
            _s.identity = identity;
            _s.name = s.config.name;
            if (!s.status) {
                _s.Online = false;
                _s.State = false;
            }else{
                _s.Online = s.status.expireTime > Date.now();
                _s.State = s.status.State;
                _s.version = s.status.version;
            }
            rsp.push(_s);
        }
        return rsp;
    }

    @Post("/heartbeat")
    @Authorized("SERVICE")
    public async heartbeat(@Body() body: {
        server_identity: string,
        server_hash: string,
        server_version: string,
        server_state: string
    }){
        return redis().hset(getRedisKey("server", "status"), body.server_identity, JSON.stringify({
            expireTime: Date.now() + 60000,
            version: body.server_version,
            state: body.server_state
        }));
    }

}
