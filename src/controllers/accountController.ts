import {API, Post, Body} from "./decorators";
import {genAssert, genLogger, turtle} from "@khgame/turtle/lib";
import {LoginService} from "../services/loginService";
import {IAccountDocument, IAccountRegInfo} from "../services/model/account";
import {Ctx, Get, Param} from "routing-controllers";
import {ERROR_CODE} from "../constants/errorCode";

@API("/account")
export class AccountController {

    log = genLogger('api:account');
    assert = genAssert('api:account');

    constructor(public readonly loginService: LoginService
    ) {
    }

    @Post("/change_pwd")
    public async changePwd(@Body() body: {
        email?: string,
        passport?: string,
        old_pwd: string, // passport, email, phone
        pwd: string
    }) {
        const {email, passport, old_pwd, pwd} = body;
        if (email) {
            return await this.loginService.changePwdOfEmail(email, old_pwd, pwd);
        } else if (passport) {
            return await this.loginService.changePwdOfPassport(passport, old_pwd, pwd);
        }
        this.assert.cThrow(ERROR_CODE.PARAM_ERROR, "identity error");
    }


    @Post("/change_phone")
    public async changePhone(@Body() body: {
        old_phone: string
        new_phone: string, // passport, email, phone
        pwd: string
    }) {
    }

    @Post("/reset_pwd")
    public async resetPwd(@Body() body: {
        token: string, pwd: string
    }) {
        const {token, pwd} = body;
        return await this.loginService.resetPwd(token, pwd);
    }

    @Get("/online_account/:token")
    public async online(@Param("token") token: string): Promise<IAccountDocument> {
        return await this.loginService.getOnlineAccountInfo(token);
    }

    @Post("/find_pwd")
    public async findPwd(@Body() body: { email: string }) {
        return await this.loginService.findPassword(body.email);
    }

    @Post("/change_email")
    public async changeEMail(@Body() body: {
        old_email: string
        new_email: string, // passport, email, phone
        pwd: string
    }) {
    }

    @Post("/re_login")
    public async reLogin(@Body() body: {
        token: string
    }) {
    }

}
