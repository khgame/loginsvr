import {API, Post, Body} from "./decorators";
import {genAssert, genLogger, turtle} from "@khgame/turtle/lib";
import {LoginService} from "../logic/loginService";
import {IAccountDocument, IAccountRegInfo} from "../logic/model/account";
import {Ctx, Get, Param} from "routing-controllers";
import {Context} from "koa";
import {ILoginRule} from "../constant/iLoginRule";

@API("/login")
export class LoginController {

    log = genLogger('api:login');
    assert = genAssert('api:login');

    constructor(public readonly loginServ: LoginService
    ) {
    }


    @Get("/validate_email/:token")
    public async validateEmail(@Param("token") token: string, @Ctx() ctx: Context) {
        const account = await this.loginServ.validateEmail(token);
        const redirect = turtle.rules<ILoginRule>().validate_redirect;
        if (account && redirect) {
            ctx.redirect(redirect);
        }
    }

    @Post("/reset_pwd")
    public async resetPwd(@Body() body: {
        token: string, pwd: string
    }) {
        const {token, pwd} = body;
        return await this.loginServ.resetPwd(token, pwd);
    }

    @Get("/online_account/:token")
    public async online(@Param("token") token: string): Promise<IAccountDocument> {
        return await this.loginServ.getOnlineAccountInfo(token);
    }

    @Post("/sign_in")
    public async signIn(@Body() body: {
        type: "passport" | "email" | "phone" | "sign"
        identity: string, // passport, email, phone, signed_blob
        pwd: string, // password
        reg_info?: IAccountRegInfo
    }): Promise<{ token: string }> { // return webToken
        const {type, identity, pwd, reg_info} = body;
        switch (type) {
            case "passport":
                return await this.loginServ.signInByPassport(identity, pwd, reg_info);
            case "email":
                return await this.loginServ.signInByEmail(identity, pwd, reg_info);
            case "phone":
                return await this.loginServ.signInByPhone(identity, pwd, reg_info);
            case "sign":
                return await this.loginServ.signInBySign(identity, pwd, reg_info);
            default:
                break;
        }
        throw new Error(`sign in type <${type}> error`);
    }

    @Post("/change_pwd")
    public async changePwd(@Body() body: {
        email: string
        old_pwd: string, // passport, email, phone
        pwd: string
    }) {
        const {email, old_pwd, pwd} = body;
        return await this.loginServ.changePwd(email, old_pwd, pwd);
    }

    @Post("/find_pwd")
    public async findPwd(@Body() body: { email: string }) {
        return await this.loginServ.findPassword(body.email);
    }

    @Post("/change_email")
    public async changeEMail(@Body() body: {
        old_email: string
        new_email: string, // passport, email, phone
        pwd: string
    }) {
    }

    @Post("/change_phone")
    public async changePhone(@Body() body: {
        old_phone: string
        new_phone: string, // passport, email, phone
        pwd: string
    }) {
    }

    @Post("/login_by_passport")
    public async loginByPassport(@Body() body: {
        passport: string,
        pwd: string // password
    }) {
        const {passport, pwd} = body;
        return await this.loginServ.loginByPassport(passport, pwd);
    }

    @Post("/login_by_email")
    public async loginByEMail(@Body() body: {
        passport: string,
        pwd: string // password
    }) {
        const {passport, pwd} = body;
        return await this.loginServ.loginByEmail(passport, pwd);
    }

    @Post("/login_by_phone")
    public async loginByPhone(@Body() body: {
        passport: string,
        pwd: string // password
    }) {
    }

    @Post("/re_login")
    public async reLogin(@Body() body: {
        token: string
    }) {
    }

}
