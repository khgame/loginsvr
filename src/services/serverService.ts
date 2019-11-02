import {Service} from "typedi";
import {DiscoverConsulDriver, genAssert, genLogger, http, IServiceNode, turtle, Crypto} from "@khgame/turtle";
import {LoginService} from "./loginService";
import {ILoginRule} from "../iLoginRule";
import {forMs} from "kht/lib";
import {GameHelper} from "./model/game";
import {DGID} from "dgip-ts";

const cacheTTL = 30000;

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

type Services = {
    [serviceName: string]: IService
};

@Service()
export class ServerService {

    log = genLogger('s:choose');
    assert = genAssert('s:choose');

    constructor(
        private loginService: LoginService
    ) {
        this.update().then(() => {
            this.log.error("ServerService.update is interrupted");
        }).catch((err) => {
            this.log.error(`ServerService.update is interrupted, error: ${err.message}, stack: ${err.stack}`);
        });
    }

    usersChooseServerInfoes: {
        [uid: string]: {
            serviceName: string,
            serverId: string,
            id: string
        }
    } = {};

    cachedServices: Services = {};


    public list(service_name: string) {
        this.assert.cNotNullAndUndefined(this.cachedServices[service_name], 404, () => `game of name ${service_name} are not exist`);
        return this.cachedServices[service_name].servers;
    }

    public get serverStatus() {
        return this.cachedServices;
    }

    async update() { // todo: fix instantiate issue
        while (true) {
            try {
                await this.refreshCache();
            } catch (err) {
                this.log.error(`ServerService.update is error: ${err.message}, stack: ${err.stack}`);
            } finally {
                await forMs(5000);
            }
        }
    }

    public async refreshCache() {
        let services = await GameHelper.list();
        if (!services) {
            this.log.warn("refresh cache aborted: no service are found");
            return;
        }
        this.log.debug(`start refresh cache of ${services}`);
        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            const serviceName = service.service_name;

            // generate cache node
            this.cachedServices[serviceName] = this.cachedServices[serviceName] || {
                hash: service.hash,
                admin_dgid: service.admin_dgid,
                servers: {}
            };
            let cacheService = this.cachedServices[serviceName];

                /** get all cachedServices */
            let serviceNodes: IServiceNode[] = [];
            try {
                serviceNodes = await DiscoverConsulDriver.inst.serviceNodes(serviceName);
            } catch (e) {
                this.log.error(`get serviceNodes failed, error: ${e.message} stack: ${e.stack}`);
            }

            if (serviceNodes.length === 0) {
                this.log.info(`cannot find instance of service ${serviceName}`);
                continue;
            }

            let servers: {
                [server_id: string]: IServerNode[]
            } = {};

            for (let iNode = 0; iNode < serviceNodes.length; iNode++) {
                let serviceNode = serviceNodes[iNode];
                let result = await http().get(`http://${serviceNode.address}:${serviceNode.port}/api/v1/game/server_stats`).then(rsp => {
                    return rsp.data.result;
                }).catch(err => {
                    this.log.warn(`get online_counts of server ${serviceName}:${serviceNode.id} failed, error: ${err.message} stack: ${err.stack}`);
                });

                if (result == null) {
                    continue;
                }
                let serverId: string = result.server_id.toString(); // todo: support multiple server
                if (!servers[serverId]) {
                    servers[serverId] = [];
                }
                servers[serverId].push({
                    ...serviceNode,
                    tag: result.server_tag,
                    ip_public: result.ip_public,
                    online_count: result.online_count,
                    cache_at: Date.now()
                });
            }

            cacheService.servers = servers;
        }
        this.log.debug(`finish refresh cache, ${JSON.stringify(this.cachedServices)}`);
    }

    public async chooseServer(webToken: string, serviceName: string, serverId: string) {

        // test the service
        const cachedService = this.cachedServices[serviceName];
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
        this.usersChooseServerInfoes[dgid] = {
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
