import { Service } from "typedi";
import { Global } from "../global";
import { redis, getRedisKey } from "./service/redis";


@Service()
export class GameServerService {
    static inst: GameServerService;

    constructor() {
        GameServerService.inst = this;
        console.log("Service: instance created ", GameServerService.inst);
    }

    async getServerInfo(identity: string) {
        let serverInfo: any[] = Global.conf.serverInfo;
        let s = null;
        for (let i = 0; i < serverInfo.length; i++) {
            if (serverInfo[i].identity === identity) {
                s = serverInfo[i];
                continue;
            }
        }
        if (!s) { throw new Error(`serverIdentity: ${identity} is not exsit`); }

        const server_value = await redis().hget(getRedisKey("server", "status"), identity);
        if (!server_value) {
            return {
                config: s
            };
        }
        const serverStatus = JSON.parse(server_value);
        return {
            config: s,
            status: serverStatus
        };
    }
}
