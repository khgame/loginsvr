import {API, Body, Get, Post} from "../decorators";
import {Authorized, JsonController} from "routing-controllers";
import { Global } from "../../global";
import { getRedisKey, redis } from "../../logic/service/redis";
import { GameServerService } from "../../logic/gameServer";

@API("/server")
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
        serverIdentity: string,
        serverVersion: string,
        serverState: string,
        controllerStatus: string,
        schedulerStatus: string
    }){
        return redis().hset(getRedisKey("server", "status"), body.serverIdentity, JSON.stringify({
            expireTime: Date.now() + 60000,
            version: body.serverVersion,
            State: body.serverState
        }));
    }

}
