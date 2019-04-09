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

    @Post("/heartbeat")
    public async heartbeat(){

    }

}
