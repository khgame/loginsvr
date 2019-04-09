import {API, Body, Get, Post} from "../decorators";
import {Authorized} from "routing-controllers";

@API("/server")
export class ServerController {

    constructor() {
    }


    @Get("/list")
    @Authorized(["SERVICE", "GM"])
    public async list() {
        return [
            {
                serverIdentity: "game01",
                serverUrl: "https://game01.server.com",
                serverVersion: "1.0",
                serverOnline: true,
                serverState: false,
                controllerStatus: {
                    user: true,
                    activity: true,
                },
                schedulerStatus: {
                    notifier: true,
                    tradeMQ: true,
                }
            },
            {
                serverIdentity: "game02",
                serverUrl: "https://game01.server.com",
                serverVersion: "1.0",
                serverOnline: true,
                controllerStatus: {
                    user: true,
                    activity: false,
                },
                schedulerStatus: {
                    notifier: true,
                    tradeMQ: true,
                }
            }

        ]; // mock todo
    }

    @Post("/heartbeat")
    @Authorized("SERVICE")
    public async heartbeat(@Body() body: {
        serverIdentity: string,
        serverVersion: string,
        serverState: string,
        controllerStatus: string,
        schedulerStatus: string
    }){
        // mock todo
    }

}
