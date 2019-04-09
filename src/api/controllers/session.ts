import {API, Get, Post} from "../decorators";
import {SessionService} from "../../logic/session";
import {Body} from "routing-controllers";

@API("/session")
export class SessionController {
    constructor(public readonly session: SessionService) {
    }

    @Post("/get_login_token")
    public async get_login_token(@Body() body: { validatorIdentity: string, userIdentity: string }) {
        console.log(body);
        return {token: await this.session.createLoginToken(body.validatorIdentity, body.userIdentity)};
    }

    @Post("/login")
    public async login(@Body() body: {
        validatorIdentity: string,
        userIdentity: string,
        loginToken: string,
        secret: string,
        algorithm: string
    }) {
        return await this.session.login(
            body.validatorIdentity,
            body.userIdentity,
            body.loginToken,
            body.secret,
            body.algorithm
        );
    }

    @Post("/choose_server")
    public async chooseServer() {
        return {
            mock: "choose_server"
        };
    }

    @Get("/heartbeat")
    public async heartbeat() {
        return {
            mock: "heartbeat"
        };
    }

}
