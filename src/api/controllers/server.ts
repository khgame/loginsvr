import {API, Get, Post} from "../decorators";

@API("/server")
export class ServerController {
    constructor() {
    }

    @Get("/list")
    public async list() {
        return {
            mock: "list"
        };
    }

    @Get("/choose_server")
    public async chooseServer() {
        return {
            mock: "choose_server"
        };
    }

    @Post("/heartbeat")
    public async heartbeat(){

    }

}
