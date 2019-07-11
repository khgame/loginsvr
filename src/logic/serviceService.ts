import { Service } from "typedi";
import { DiscoverConsulDriver, genAssert, http } from "@khgame/turtle";
import { LoginService } from "./loginService";

const deltaTime = 30000;

@Service()
export class ServiceService {
    assert = genAssert('s:service');
    constructor(
        private loginService: LoginService
    ) { }

    users: {
        [uid: string]: {
            serviceName: string,
            id: string
        }
    } = {};

    service: {
        [serviceName: string]: {
            [id: string]: {
                address: string,
                port: number,
                userCount: number,
                lastSyncTime: number,
                id: string
            }
        }
    } = {};

    public async heartbeat(serviceName: string, id: string, userCount: number) {

        const serviceNodes = await DiscoverConsulDriver.inst.serviceNodes(serviceName);
        if (serviceNodes.length === 0) {
            return;
        }
        const node: any = {
            exist: false
        };
        for (let i = 0; i < serviceNodes.length; i++) {
            const cnode = serviceNodes[i];
            if (cnode.id === `${serviceName}:${id}`) {
                node.exist = true;
                node.address = cnode.address;
                node.port = cnode.port;
                break;
            }
        }
        if (!node.exist) {
            return;
        }
        if (!this.service[serviceName]) {
            this.service[serviceName] = {};
        }
        this.service[serviceName][id] = {
            address: node.address,
            port: node.port,
            userCount: userCount,
            lastSyncTime: Date.now(),
            id
        };

    }
    public async chooseService(token: string, serviceName: string) {
        const uid = await this.loginService.getOnlineUIDByToken(token);

        const nodes = this.service[serviceName];
        this.assert.ok(nodes && Object.keys(nodes).length > 0, `no service ${serviceName}`);
        let node: any = null;
        const now = Date.now();
        for (const id in nodes) {
            const n = nodes[id];
            if (!n || n.lastSyncTime < now - deltaTime) {
                continue;
            }
            if (!node || node.userCount < n.userCount) {
                node = n;
            }
        }
        this.assert.ok(node, `no service ${serviceName}`);
        this.users[uid] = {
            serviceName: serviceName,
            id: node.id
        };
        // todo post create sessionToken to game
        const rsp = await $http.post<any>(`http://${node.address}:${node.port}/api/v1/login/create_session`, {
            uid
        });
        this.assert.ok(rsp && rsp.data && rsp.data.result, "server is error");
        return {
            address: node.address,
            port: node.port,
            token: rsp.data.result
        };
    }
    // public async validateToken(token: string, serviceName: string, id: string) {
    //     this.assert.ok(this.service[serviceName] && this.service[serviceName][id], `process is not exist. ${serviceName} ${id}`);
    //     const lastSyncTime = this.service[serviceName][id].lastSyncTime;
    //     this.assert.ok(lastSyncTime > Date.now() - deltaTime, `process has no heartbeat. ${serviceName} ${id}`);
    //     const uid = await this.loginService.getOnlineUIDByToken(token);
    //     const user = this.users[uid];
    //     this.assert.ok(user && user.serviceName === serviceName && user.id === id, `user has not choose this service. ${uid}`);
    //     return uid;
    // }
}

import axios, { AxiosInstance } from "axios";

const $http = axios.create({
  baseURL: "",
  // headers: { 'X-Requested-With': 'XMLHttpRequest' },
  // withCredentials: true,
  responseType: "json", // default
  timeout: 30000,
});

$http.interceptors.request.use((config) => {
  return config;
}, (error) => {
  return Promise.reject(error);
});