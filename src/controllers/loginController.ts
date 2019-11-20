import {API, Post, Body} from "./decorators";
import {genAssert, genLogger, turtle} from "@khgame/turtle/lib";
import {LoginService} from "../services/loginService";
import {IAccountDocument, IAccountLoginInfo, IAccountRegInfo} from "../services/model/account";
import {Ctx, Get, Param} from "routing-controllers";
import {Context} from "koa";
import {ILoginRule} from "../constants/iRule";

@API("/login")
export class LoginController {

    log = genLogger('api:login');
    assert = genAssert('api:login');

    constructor(public readonly loginService: LoginService
    ) {
    }

    @Post("/by_passport")
    public async loginByPassport(@Body() body: {
        identity: string,
        pwd: string,
        login_info?: IAccountLoginInfo
    }) {
        const {login_info, identity, pwd} = body;
        return await this.loginService.loginByPassport(identity, pwd, login_info);
    }

    @Post("/by_email")
    public async loginByEMail(@Body() body: {
        identity: string,
        pwd: string,
        login_info?: IAccountLoginInfo
    }) {
        const {login_info, identity, pwd} = body;
        return await this.loginService.loginByEmail(identity, pwd, login_info);
    }

    @Post("/by_phone")
    public async loginByPhone(@Body() body: {
        identity: string,
        pwd: string // password
    }) {
    }

}
