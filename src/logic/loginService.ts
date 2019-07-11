import {Service} from "typedi";
import * as crypto from "crypto";
import {AccountHelper, AccountModel, IAccountDocument, IAccountLoginInfo, IAccountRegInfo} from "./model/account";
import {genAssert, genLogger, getRedisKey, RedisDriver, turtle} from "@khgame/turtle/lib";
import {mail} from "@khgame/turtle/lib/utils/sendMail";
import {ILoginRule} from "../constant/iLoginRule";

@Service()
export class LoginService {

    log = genLogger('s:login');
    assert = genAssert('s:login');

    static inst: LoginService;

    static getRKWebToken(token: string) {
        return getRedisKey('web_token', token);
    }

    constructor() {
        LoginService.inst = this;
        this.log.verbose("Service: instance created ");
    }

    async renewalWebToken(webToken: string, l2id: string, time: number = turtle.rules<any>().renewal_time_span) {
        const rkWebToken = LoginService.getRKWebToken(webToken);
        this.log.info(`renewal Session ${rkWebToken} => ${l2id}`);
        return await RedisDriver.inst.set(rkWebToken, l2id, "EX", time);
    }

    async signInByPassport(passport: string, pwd: string, regInfo: IAccountRegInfo = {}) {
        const accountOrg = await AccountHelper.getByPassport(passport);
        this.assert.ok(!accountOrg, () => `sign in by passport ${passport} failed, this pass port is already exist.`);

        let md5 = crypto.createHash('md5');
        const password = md5.update(pwd).digest('hex');
        const account = new AccountModel({
            passport: passport,
            password: password,
            reg_info: regInfo
        });
        await account.save();

        md5 = crypto.createHash('md5');
        const webToken = md5.update(`${account._id}:${Math.random()}`).digest('hex');
        await this.renewalWebToken(webToken, account._id.toString());

        return {
            token: webToken,
            account: account
        };
    }

    async signInByEmail(email: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        return {token: ""};
    }

    async signInByPhone(phone: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        return {token: ""};
    }

    async signInBySign(sign: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        return {token: ""};
    }

    async loginByPassport(passport: string, pwd: string, loginInfo: IAccountLoginInfo = {}) {
        const account = await AccountHelper.getByPassport(passport);
        this.assert.ok(account, () => `login by passport ${passport} failed, this pass port does not exist.`);

        let md5 = crypto.createHash('md5');
        const password = md5.update(pwd).digest('hex');

        this.assert.sEqual(account!.password, password, () => `login by passport ${passport} failed, password not match.`);

        md5 = crypto.createHash('md5');
        const webToken = md5.update(`${account!._id}:${Math.random()}`).digest('hex');

        await this.renewalWebToken(webToken, account!._id.toString());
        return {
            token: webToken,
            account: account,
            login_info: loginInfo
        };
    }

    async getOnlineUIDByToken(webToken: string): Promise<string>  {
        const rkWebToken = LoginService.getRKWebToken(webToken);
        const l2id = await RedisDriver.inst.get(rkWebToken);
        this.assert.ok(l2id, () => `get l2id by webToken <${webToken}> failed: cannot find this token`);
        return l2id!;
    }

    async getOnlineAccountInfo(webToken: string) : Promise<IAccountDocument> {
        const l2id = await this.getOnlineUIDByToken(webToken);
        const account = await AccountHelper.getByUID(parseInt(l2id));
        this.assert.ok(account, () => `get account by webToken <${webToken}> failed: this account does not exist.`);
        return account!;
    }

    async sendValidateMail(toEmail: string, subject: string, content: string){
        await mail.sendMail(
            "tonarts",
            "auto@tonarts.org",
            toEmail,
            subject,
            content,
            turtle.rules<ILoginRule>().mail_option
        );
    }
}
