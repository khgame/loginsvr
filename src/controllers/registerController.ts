import {API, Post, Body} from "./decorators";
import {genAssert, genLogger, turtle} from "@khgame/turtle/lib";
import {LoginService} from "../services/loginService";
import {IAccountDocument, IAccountRegInfo} from "../services/model/account";
import {Ctx, Get, Param} from "routing-controllers";
import {Context} from "koa";
import {ILoginRule} from "../constants/iRule";

@API("/register")
export class RegisterController {

    log = genLogger('api:register');
    assert = genAssert('api:register');

    constructor(public readonly loginService: LoginService
    ) {
    }

    @Post("/by_email")
    public async registerByEmail(@Body() body: {
        identity: string, // passport, email, phone, signed_blob
        pwd: string, // password
        reg_info?: IAccountRegInfo
    }): Promise<{ token: string }> { // return webToken
        const {identity, pwd, reg_info} = body;
        return await this.loginService.registerByEmail(identity, pwd, reg_info);
    }

    @Post("/by_passport")
    public async registerByPassport(@Body() body: {
        identity: string, // passport, email, phone, signed_blob
        pwd: string, // password
        reg_info?: IAccountRegInfo
    }): Promise<{ token: string }> { // return webToken
        const {identity, pwd, reg_info} = body;
        return await this.loginService.registerByPassport(identity, pwd, reg_info);
    }

    @Post("/by_phone")
    public async registerByPhone(@Body() body: {
        identity: string, // passport, email, phone, signed_blob
        pwd: string, // password
        reg_info?: IAccountRegInfo
    }): Promise<{ token: string }> { // return webToken
        const {identity, pwd, reg_info} = body;
        return await this.loginService.registerByPhone(identity, pwd, reg_info);
    }

    @Post("/by_sign")
    public async registerBySign(@Body() body: {
        identity: string, // passport, email, phone, signed_blob
        pwd: string, // password
        reg_info?: IAccountRegInfo
    }): Promise<{ token: string }> { // return webToken
        const {identity, pwd, reg_info} = body;
        return await this.loginService.registerBySign(identity, pwd, reg_info);
    }

    @Get("/validate_email/:token")
    public async validateEmail(@Param("token") token: string, @Ctx() ctx: Context) {
        const account = await this.loginService.validateEmail(token);
        const redirect = turtle.rules<ILoginRule>().validate_redirect;
        if (account && redirect) {
            ctx.redirect(redirect);
        }
    }


}
