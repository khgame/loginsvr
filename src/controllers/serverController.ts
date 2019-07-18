import { API, Post, Body } from "./decorators";
import { genAssert, genLogger } from "@khgame/turtle/lib";
import { ServerService } from "../logic/serverService";
import {Get} from "routing-controllers";

@API("/servers")
export class ServerController {

    log = genLogger('api:server');
    assert = genAssert('api:server');

    constructor(
        public readonly serverServ: ServerService
    ) {
    }

    @Get("/servers")
    public async servers() {
        return this.serverServ.serverStatus;
    }

    @Post("/choose")
    public async chooseService(@Body() body: {
        token: string,
        serviceName: string
    }) {
        const { token, serviceName } = body;
        return await this.serverServ.chooseServer(token, serviceName);
    }

    // @Post("/validate_token")
    // public async validateToken(@Body() body: {
    //     token: string, serviceName: string, id: string
    // }) {
    //     const { token, serviceName, id } = body;
    //     return await this.serverServ.validateToken(token, serviceName, id);
    // }

}
