import {Service} from "typedi";
import {DiscoverConsulDriver, genAssert, genLogger, http, IServiceNode, turtle, Crypto} from "@khgame/turtle";
import {LoginService} from "./loginService";
import {ILoginRule} from "../constants/iRule";
import {forMs} from "kht/lib";
import {GameHelper} from "./model/game";
import {DGID} from "dgip-ts";
import {IServerStatus} from "../constants/rpcMessages";
import {ServerSyncWorker} from "../workers";
import {ERROR_CODE} from "../constants/errorCode";
import {IServerNode, IServerNodes} from "../constants/IServer";
import * as HashRing from "hashring";

const cacheTTL = 30000;


@Service()
export class ServerService {

    log = genLogger('s:choose');
    assert = genAssert('s:choose');

    constructor(
        private loginService: LoginService,
        private serverWorker: ServerSyncWorker
    ) {
    }

    usersChooseServerInfos: {
        [uid: string]: {
            serviceName: string,
            serverId: string,
            id: string
        }
    } = {};


    public async chooseServer(webToken: string, serviceName: string, serverId: string) {

        // test the service
        const cachedService = this.serverWorker.serverStatus[serviceName];
        this.assert.cok(cachedService, ERROR_CODE.SERVICE_NOT_FOUND,
            () => `cannot find available service of name ${serviceName}`);
        const server: { [strHostPort: string]: IServerNode } = cachedService.servers[serverId];
        this.assert.cNotNullAndUndefined(server, ERROR_CODE.SERVER_NOT_FOUND,
            () => `cannot find server ${serverId} of service ${serviceName}`);
        const ring: HashRing = cachedService.rings[serverId];
        this.assert.cNotNullAndUndefined(ring, ERROR_CODE.SERVER_NOT_FOUND,
            () => `cannot find ring ${serverId} of service ${serviceName}`);

        // get and test the user
        const dgid = await this.loginService.getOnlineUIDByToken(webToken);

        // find a node
        let strHostPort: string = ring.get(dgid);
        let node: IServerNode = server[strHostPort];
        this.assert.cok(node, ERROR_CODE.AVAILABLE_NODE_NOT_FOUND, () => `cannot find available node for server ${serverId} of service ${serviceName}`);

        // request game/create_session of the selected node:
        const urlCreateSession = `http://${node.address}:${node.port}/api/v1/game/create_session`;
        let data = {
            uid: Number(dgid),
            is_admin: dgid === cachedService.admin_dgid.toString(),
            server_id: serverId,
            sign: ""
        };
        data.sign = Crypto.dullSign(data, cachedService.hash);
        this.log.info(`try require session : ${urlCreateSession}`);
        const rsp = await http().post<any>(urlCreateSession, data);

        this.assert.cok(rsp && rsp.data && rsp.data.status === 200 && rsp.data.result, ERROR_CODE.SESSION_NOT_FOUND,
            () => `require session of ${serviceName}.${serverId} from node ${node.id} failed, dgid: ${dgid}`);
        const use_public_ip = turtle.rules<ILoginRule>().use_public_ip;

        // record choose server info
        this.usersChooseServerInfos[dgid] = {
            serviceName: serviceName,
            serverId: serverId,
            id: node.id
        };

        const token = rsp.data.result;
        this.log.info(`require session of ${serviceName}.${serverId} from node ${node.id}: ${dgid} => ${token}`);
        return {
            address: use_public_ip ? node.ip_public : node.address,
            port: node.port,
            token
        };

    }

}
