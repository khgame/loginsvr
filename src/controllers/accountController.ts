import {API, Post, Body} from "./decorators";
import {genAssert, genLogger} from "@khgame/turtle/lib";
import {LoginService} from "../services/loginService";

@API("/account")
export class AccountController {

    log = genLogger('api:account');
    assert = genAssert('api:account');

    constructor(public readonly loginServ: LoginService
    ) {
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

    @Post("/change_phone")
    public async changePhone(@Body() body: {
        old_phone: string
        new_phone: string, // passport, email, phone
        pwd: string
    }) {
    }

    @Post("/change_email")
    public async changeEMail(@Body() body: {
        old_email: string
        new_email: string, // passport, email, phone
        pwd: string
    }) {
    }

    @Post("/find_pwd")
    public async findPwd(@Body() body: { email: string }) {
        return await this.loginServ.findPassword(body.email);
    }


}
