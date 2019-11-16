import {IServiceNode} from "@khgame/turtle";
import {DGID} from "dgip-ts";

export interface IServerNode extends IServiceNode {
    tag?: string;
    online_count?: number;
    ip_public?: string;
    cache_at: number;
}

export interface IService {
    hash: string;
    admin_dgid: DGID;
    servers: {
        [server_id: string]: IServerNode[]
    };
}

export type Services = {
    [serviceName: string]: IService
};