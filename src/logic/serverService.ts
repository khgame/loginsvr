import {Service} from "typedi";
import {DiscoverConsulDriver, genAssert, genLogger, http, IServiceNode, turtle} from "@khgame/turtle";
import {LoginService} from "./loginService";
import {ILoginRule} from "../constant/iLoginRule";
import {forMs} from "kht/lib";

const deltaTime = 30000;

export interface IServer extends IServiceNode {
    lastSyncTime: number;
    userCount?: number;
}

type Services = {
    [serviceName: string]: {
        [id: string]: IServer
    }
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

    users: {
        [uid: string]: {
            serviceName: string,
            id: string
        }
    } = {};

    servers: Services = {};


    public get serverList() {
        return turtle.rules<ILoginRule>().servers;
    }

    public get serverStatus() {
        return this.servers;
    }

    async update() {
        while (true) {
            await forMs(5000);
            await this.refreshCache();
        }
    }

    public async refreshCache() {

        const serverLst = this.serverList;

        this.log.debug(`refresh cache of ${serverLst}`);
        for (let i in serverLst) {
            const serviceName = serverLst[i];
            /** get all servers */
            let serviceNodes: IServiceNode[] = [];
            try {
                serviceNodes = await DiscoverConsulDriver.inst.serviceNodes(serviceName);
            } catch (e) {
                this.log.error(`get serviceNodes failed, error: ${e.message} stack: ${e.stack}`);
            }
            if (serviceNodes.length === 0) {
                this.log.info(`cannot find instance of server ${serviceName}`);
                continue;
            }

            serviceNodes.forEach(sn => {
                this.servers[serviceName] = this.servers[serviceName] || {};
                this.servers[serviceName][sn.id] = {
                    ...sn,
                    lastSyncTime: Date.now(),
                };
                http().get(`http://${sn.address}:${sn.port}/api/v1/login/online_counts`).then(ret => {
                    this.servers[serviceName][sn.id] = ret.data.result;
                }).catch(err => {
                    this.log.warn(`get online_counts of server ${serviceName}:${sn.id} failed, error: ${err.message} stack: ${err.stack}`);
                });
            });
        }
    }

    // public async heartbeat(serviceName: string, id: string, userCount: number) {
    //
    //     const serverLst = this.serverList;
    //
    //     for (let i in serverLst) {
    //         const serviceName = serverLst[i];
    //         /** get all servers */
    //         const serviceNodes = await DiscoverConsulDriver.inst.serviceNodes(serviceName);
    //
    //     }
    //
    //
    //     if (serviceNodes.length === 0) {
    //         return;
    //     }
    //
    //     const node: any = {
    //         exist: false
    //     };
    //
    //     for (let i = 0; i < serviceNodes.length; i++) {
    //         this.servers[serviceName];
    //         const cnode = serviceNodes[i];
    //         if (cnode.id === `${serviceName}:${id}`) {
    //             node.exist = true;
    //             node.address = cnode.address;
    //             node.port = cnode.port;
    //             break;
    //         }
    //     }
    //
    //     if (!node.exist) {
    //         return;
    //     }
    //
    //     if (!this.servers[serviceName]) {
    //         this.servers[serviceName] = {};
    //     }
    //
    //     this.servers[serviceName][id] = {
    //         address: node.address,
    //         port: node.port,
    //         userCount: userCount,
    //         lastSyncTime: Date.now(),
    //         id
    //     };
    // }

    public async chooseServer(webToken: string, serviceName: string) {
        const uid = await this.loginService.getOnlineUIDByToken(webToken);

        const nodes = this.servers[serviceName];
        this.assert.ok(nodes && Object.keys(nodes).length > 0, `no service ${serviceName}`);
        let node: any = null;
        const now = Date.now();
        for (const id in nodes) {
            const n = nodes[id];
            if (!n || n.lastSyncTime < now - deltaTime) {
                continue;
            }
            if (!node || node.userCount < (n.userCount || 0)) {
                node = n;
            }
        }
        this.assert.ok(node, `no service ${serviceName}`);
        this.users[uid] = {
            serviceName: serviceName,
            id: node.id
        };
        // todo post create sessionToken to game
        const rsp = await http().post<any>(`http://${node.address}:${node.port}/api/v1/login/create_session`, {
            uid
        });
        this.assert.ok(rsp && rsp.data && rsp.data.result, "server is error");
        return {
            address: node.address,
            port: node.port,
            token: rsp.data.result
        };
    }
}
