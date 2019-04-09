import {API, Get, Post} from "../decorators";
import {SessionService} from "../../logic/session";
import {Body} from "routing-controllers";

@API("/session")
export class SessionController {
    constructor(public readonly session : SessionService) {
    }

    @Post("/get_login_token")
    public async get_login_token(@Body() body: {channel: string, userIdentity: string}) {
        console.log(body);
        return { token: await this.session.createLoginToken(body.channel, body.userIdentity) };
    }

    @Post("/login")
    public async login(@Body() body: {channel: string, userIdentity: string, loginToken: string}) {
        return {
            mock: "login",
            data: await this.session.login(
                body.channel,
                body.userIdentity,
                body.loginToken,
                "c",
                "d"
            )
        };
    }

    @Get("/heartbeat")
    public async heartbeat() {
        return {
            mock: "heartbeat"
        };
    }

}
