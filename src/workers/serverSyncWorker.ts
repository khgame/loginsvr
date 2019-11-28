import {Service} from "typedi";
import {DiscoverConsulDriver, http, IServiceNode, IWorker, turtle, Worker, WorkerRunningState} from "@khgame/turtle";
import {forMs} from "kht/lib";
import {GameHelper, IGameDoc} from "../services/model/game";
import {IServerStatus} from "../constants/rpcMessages";
import {IServerNode, IServerNodes, Services} from "../constants/IServer";
import * as HashRing from "hashring";
import {ILoginRule} from "../constants/iRule";

@Service()
export class ServerSyncWorker extends Worker implements IWorker {

    cachedServices: Services = {};

    constructor() {
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
                await this.refreshServerForGames();
            } catch (e) {
                this.log.error(`⊙ proc of worker ${this.name} error: ${e}, ${e.stack} `);
                throw e;
            } finally {
                this.processRunning -= 1;
            }

            this.log.info(`⊙ worker ${this.name} round ${round++} finished`);
        }
    }

    public async refreshServiceForGame(game: IGameDoc): Promise<IServerNodes | null> {
        const serviceName = game.service_name;

        // generate cache node
        let cacheService = this.cachedServices[serviceName] = this.cachedServices[serviceName] || {
            hash: game.hash,
            admin_dgid: game.admin_dgid,
            rings: {},
            servers: {}
        };

        /** get all services form the register center */
        let gameNodes: IServiceNode[] = [];
        try {
            gameNodes = await DiscoverConsulDriver.inst.serviceNodes(serviceName);
        } catch (e) {
            this.log.error(`get serviceNodes failed, error: ${e.message} stack: ${e.stack}`);
        }

        if (gameNodes.length === 0) {
            this.log.info(`cannot find instance of service ${serviceName}`);
            return null;
        }

        let servers: IServerNodes = {};

        // for all game nodes
        for (let iNode = 0; iNode < gameNodes.length; iNode++) {
            let gameNode = gameNodes[iNode];

            // requests the status of the game node
            let result: IServerStatus = await http()
                .get(`http://${gameNode.address}:${gameNode.port}/api/v1/game/server_stats`).then(rsp => {
                    return rsp.data.result;
                }).catch(err => {
                    this.log.warn(`get server_stats of server ${serviceName}:${gameNode.id} failed, error: ${err.message} stack: ${err.stack}`);
                });

            // if the game are not healthy, skip it
            if (result == null) {
                continue;
            }

            // get server of the gameNode
            let serverId: string = result.server_id.toString(); // todo: support multiple server
            let server = servers[serverId] || (servers[serverId] = {});

            let {server_tag: tag, ip_public, online_count} = result;

            let serverNode: IServerNode = {
                ...gameNode, // service_node info of the game
                tag,
                ip_public,
                online_count,
                cache_at: Date.now()
            };

            let host = turtle.rules<ILoginRule>().use_public_ip ? serverNode.ip_public : serverNode.address;
            let port = serverNode.port;

            server[`${host}:${port}`] = serverNode;
        }

        let oldServers = cacheService.servers;

        // end the ring of which the server are not exist anymore.
        for (let serverId in oldServers) {
            let ring = cacheService.rings[serverId];
            if (!(serverId in servers)) {
                ring.end();
            }
        }

        // for all servers exist
        for (let serverId in servers) {

            // obtain or create ring of the server
            let ring = cacheService.rings[serverId] || (cacheService.rings[serverId] = new HashRing([]));
            let oldServer = oldServers[serverId] || {};
            let server = servers[serverId];

            // removes host, which are not exist in the new server list, from the ring
            for (let host in oldServer) {
                if (!(host in server)) {
                    ring.remove(host);
                }
            }

            // adds host, which are not exist in the old server list, to the ring
            for (let host in server) {
                if (!(host in oldServer)) {
                    ring.add(host);
                }
            }
        }

        // set new servers
        return cacheService.servers = servers;
    }

    public async refreshServerForGames() {
        let games: IGameDoc[] = await GameHelper.list();
        if (!games) {
            this.log.warn("refresh cache aborted: no service are found");
            return;
        }
        this.log.debug(`start refresh cache of ${games}`);
        for (let i = 0; i < games.length; i++) {
            const game = games[i];
            let servers = await this.refreshServiceForGame(game);
            if (servers) {
                this.log.debug(`finish refresh cache, servers of game ${game._id}:${game.service_name} => ${JSON.stringify(servers)}`);
            } else {
                this.log.debug(`finish refresh cache, cannot found servers of game ${game._id}:${game.service_name}`);
            }
        }

    }
}
