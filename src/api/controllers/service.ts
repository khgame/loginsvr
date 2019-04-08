import {API, Get} from "../decorators/index";

@API("/service")
export class ServiceController {
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

}
