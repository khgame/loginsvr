import {API, Get} from "../decorators/index";

@API("/session")
export class SessionController {
    constructor() {
    }

    @Get("/login")
    public async login() {
        return {
            mock: "login"
        };
    }

    @Get("/heartbeat")
    public async heartbeat() {
        return {
            mock: "heartbeat"
        };
    }

}
