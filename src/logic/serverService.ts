import { Service } from "typedi";
import { DiscoverConsulDriver, genAssert, genLogger, http, IServiceNode, turtle } from "@khgame/turtle";
import { LoginService } from "./loginService";
import { ILoginRule } from "../constant/iLoginRule";
import { forMs } from "kht/lib";

const deltaTime = 30000;

export interface IServer extends IServiceNode {
    lastSyncTime: number;
    userCount?: number;
    ip_public?: string;
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

            serviceNodes.forEach(serviceNode => {
                this.servers[serviceName] = this.servers[serviceName] || {};
                this.servers[serviceName][serviceNode.id] = {
                    ...serviceNode,
                    lastSyncTime: Date.now(),
                };

                http().get(`http://${serviceNode.address}:${serviceNode.port}/api/v1/login/online_counts`).then(ret => {
                    this.servers[serviceName][serviceNode.id].userCount = ret.data.result.count;
                    this.servers[serviceName][serviceNode.id].ip_public = ret.data.result.ip_public;
                }).catch(err => {
                    this.log.warn(`get online_counts of server ${serviceName}:${serviceNode.id} failed, error: ${err.message} stack: ${err.stack}`);
                });
            });
        }
    }

    public async chooseServer(webToken: string, serviceName: string) {
        const nodes = this.servers[serviceName];
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
        this.assert.ok(node, `cannot find available service ${serviceName}`);
        this.assert.ok(nodes && Object.keys(nodes).length >= 0,
            `cannot find service ${serviceName}`);

        try {
            const uid = await this.loginService.getOnlineUIDByToken(webToken);

            this.users[uid] = {
                serviceName: serviceName,
                id: node.id
            };
            // todo: post create sessionToken to game ?
            const rsp = await http().post<any>(`http://${node.address}:${node.port}/api/v1/login/create_session`, {
                uid: Number(uid)
            });
            this.assert.ok(rsp && rsp.data && rsp.data.result, "server is error");
            const use_public_ip = turtle.rules<ILoginRule>().use_public_id;
            return {
                address: use_public_ip ? node.ip_public : node.address,
                port: node.port,
                token: rsp.data.result
            };
        } catch (e) {
            return {
                address: node.address,
                port: node.port,
            };
        }
    }
}
