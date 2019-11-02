import { API, Post, Body } from "./decorators";
import { genAssert, genLogger } from "@khgame/turtle/lib";
import { ServerService } from "../logic/serverService";
import {Get, Param} from "routing-controllers";

@API("/server")
export class ServerController {

    log = genLogger('api:server');
    assert = genAssert('api:server');

    constructor(
        public readonly serverServ: ServerService
    ) {
    }

    @Get("/list/:service_name")
    public async list(@Param("service_name") service_name: string) {
        return this.serverServ.list(service_name);
    }

    @Get("/status")
    public async status() {
        return this.serverServ.serverStatus;
    }

    @Post("/choose/:service_name")
    public async chooseService(@Param("service_name") service_name: string, @Body() body: {
        token: string,
        server_id: string
    }) {
        const { token, server_id } = body;
        return await this.serverServ.chooseServer(token, service_name, server_id);
    }

    // @Post("/validate_token")
    // public async validateToken(@Body() body: {
    //     token: string, serviceName: string, id: string
    // }) {
    //     const { token, serviceName, id } = body;
    //     return await this.serverServ.validateToken(token, serviceName, id);
    // }

}
