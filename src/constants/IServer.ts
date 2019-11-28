import {IServiceNode} from "@khgame/turtle";
import {DGID} from "dgip-ts";
import * as HashRing from "hashring";

export interface IServerNode extends IServiceNode {
    tag?: string;
    online_count?: number;
    ip_public?: string;
    cache_at: number;
}

export interface IServerNodes {
    [server_id: string]: {
        [strHostPort: string]: IServerNode
    };
}

export interface IService {
    hash: string;
    admin_dgid: DGID;
    rings: { [server_id: string]: HashRing };
    servers: IServerNodes;
}

export type Services = {
    [serviceName: string]: IService
};