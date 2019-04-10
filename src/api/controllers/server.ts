import {API, Body, Get, Post} from "../decorators";
import {Authorized, JsonController} from "routing-controllers";
import { Global } from "../../global";
import { getRedisKey, redis } from "../../logic/service/redis";

@API("/server")
export class ServerController {

    constructor() {
    }


    @Get("/list")
    public async list() {
        let serverInfo : any[] = Global.conf.serverInfo;
        const rsp = [];
        for (let i = 0; i < serverInfo.length; i++){
            const s = serverInfo[i];
            const identity = s.identity;
            const _s : any = {};
            rsp.push(_s);
            _s.identity = identity;
            _s.name = s.name;
            const value = await redis().hget("server", identity);
            if (!value) {
                _s.Online = false;
                _s.State = false;
                continue;
            }
            const data = JSON.parse(value);
            _s.Online = data.expireTime > Date.now();
            _s.State = data.State;
            _s.version = data.version;
            
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
        return redis().hset("server", body.serverIdentity, JSON.stringify({
            expireTime: Date.now() + 60000,
            version: body.serverVersion,
            State: body.serverState
        }));
    }

}
