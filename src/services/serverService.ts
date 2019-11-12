import {Service} from "typedi";
import {DiscoverConsulDriver, genAssert, genLogger, http, IServiceNode, turtle, Crypto} from "@khgame/turtle";
import {LoginService} from "./loginService";
import {ILoginRule} from "../constants/iRule";
import {forMs} from "kht/lib";
import {GameHelper} from "./model/game";
import {DGID} from "dgip-ts";
import {IServerStatus} from "../constants/rpcMessages";
import {ServerSyncWorker} from "../workers";

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
        this.assert.cok(cachedService, 404, `cannot find available service of name ${serviceName}`);
        const serverNodes = cachedService.servers[serverId];
        this.assert.cok(serverNodes, 404, `cannot find server ${serverId} of service ${serviceName}`);

        // get and test the user
        const dgid = await this.loginService.getOnlineUIDByToken(webToken);

        // find a node
        let node: any = null;
        const now = Date.now();
        for (let i = 0; i < serverNodes.length; i++) { // todo: refine this method for user cache updates with Consistent Hashing algorithm.
            const nodeTemp = serverNodes[i];
            if (!nodeTemp || nodeTemp.cache_at < now - cacheTTL) {
                continue;
            }
            if (!node || node.userCount < (nodeTemp.online_count || 0)) {
                node = nodeTemp;
            }
        }
        this.assert.ok(node, `cannot find available node for server ${serverId} of service ${serviceName}`);

        // request game/create_session of the selected node
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

        this.assert.ok(rsp && rsp.data && rsp.data.status === 200 && rsp.data.result,
            () => `require session of ${serviceName}.${serverId} from node ${node.id} failed, dgid: ${dgid}`);
        const use_public_ip = turtle.rules<ILoginRule>().use_public_id;

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
