import {API, Get, Post, Body, Param} from "../decorators";
import {SessionService} from "../../logic/session";
import {Authorized, CurrentUser, HeaderParam} from "routing-controllers";

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
    public async chooseServer(@CurrentUser() sessionID: string) {
        return {
            sessionID,
            mock: "choose_server"
        };
    }

    @Post("/heartbeat")
    public async heartbeat(@CurrentUser() sessionID: string) {
        return {
            sessionID,
            mock: "heartbeat"
        }; // mock, todo:
    }

    @Get("/online_list")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineList() {
        return [
            "eos::kinghand.x"
        ];
    }

    @Get("/online_state/:sessionId")
    @Authorized(["SERVICE", "GM"])
    public async getOnlineState(@Param("sessionId") sessionId: string) {
        return {
            online: true,
            validatorIdentity: "eos",
            userIdentity: "kinghand.x",
        }; // mock, todo:
    }

}
