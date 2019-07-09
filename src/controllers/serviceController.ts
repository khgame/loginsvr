import { API, Post, Body } from "./decorators";
import { genAssert, genLogger } from "@khgame/turtle/lib";
import { LoginService } from "../logic/loginService";
import { ServiceService } from "../logic/serviceService";

@API("/service")
export class ServiceController {

    log = genLogger('api:server');
    assert = genAssert('api:server');

    constructor(
        public readonly serviceServ: ServiceService
    ) {
    }

    @Post("/heartbeat")
    public async heartbeat(@Body() body: {
        serviceName: string, id: string, userCount: number
    }) {
        const { serviceName, id, userCount } = body;
        return await this.serviceServ.heartbeat(serviceName, id, userCount);
    }
    @Post("/choose_service")
    public async chooseService(@Body() body: {
        token: string,
        serviceName: string
    }) {
        const { token, serviceName } = body;
        return await this.serviceServ.chooseService(token, serviceName);
    }
    @Post("/validate_token")
    public async validateToken(@Body() body: {
        token: string, serviceName: string, id: string
    }) {
        const { token, serviceName, id } = body;
        return await this.serviceServ.validateToken(token, serviceName, id);
    }

}
