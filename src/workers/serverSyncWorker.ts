
import {Service} from "typedi";
import {DiscoverConsulDriver, http, IServiceNode, IWorker, Worker, WorkerRunningState} from "@khgame/turtle";
import {forMs} from "kht/lib";
import {GameHelper} from "../services/model/game";
import {IServerStatus} from "../constants/rpcMessages";
import {IServerNode, Services} from "../constants/IServer";

@Service()
export class ServerSyncWorker extends Worker implements IWorker {

    cachedServices: Services = {};

    constructor( ) {
        super("serverSync");
        this.runningState = WorkerRunningState.PREPARED;
    }

    async onStart(): Promise<boolean> {

        this.discoverServers().then((ret => {
            this.log.warn(`⊙ discoverServers proc of ${this.name} exited !`);
        })).catch(e => {
            this.log.error(`⊙  discoverServers proc of ${this.name} are failed ! message:${e.message} stack:${e.stack}`);
        });

        return true;
    }

    public list(service_name: string) {
        this.assert.cNotNullAndUndefined(this.cachedServices[service_name], 404, () => `game of name ${service_name} are not exist`);
        return this.cachedServices[service_name].servers;
    }

    public get serverStatus() {
        return this.cachedServices;
    }

    async discoverServers() {
        this.log.info("⊙ proc refresh market cache started");
        let round = 0;
        while (true) {
            await forMs(5000); // cache server list every 5 sec
            this.processRunning += 1;
            try {
                await this.refreshCache();
            } catch (e) {
                this.log.error(`⊙ proc of worker ${this.name} error: ${e}, ${e.stack} `);
                throw e;
            } finally {
                this.processRunning -= 1;
            }

            this.log.info(`⊙ worker ${this.name} round ${round++} finished`);
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
                let result: IServerStatus = await http().get(`http://${serviceNode.address}:${serviceNode.port}/api/v1/game/server_stats`).then(rsp => {
                    return rsp.data.result;
                }).catch(err => {
                    this.log.warn(`get server_stats of server ${serviceName}:${serviceNode.id} failed, error: ${err.message} stack: ${err.stack}`);
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
}
