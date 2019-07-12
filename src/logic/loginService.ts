import { Service } from "typedi";
import * as crypto from "crypto";
import { AccountHelper, AccountModel, IAccountDocument, IAccountLoginInfo, IAccountRegInfo } from "./model/account";
import { genAssert, genLogger, getRedisKey, RedisDriver, turtle, DiscoverConsulDriver } from "@khgame/turtle/lib";
import { mail } from "@khgame/turtle/lib/utils/sendMail";
import { ILoginRule } from "../constant/iLoginRule";

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
        this.assert.ok(email, () => `sign in by email failed, the email cannot be empty.`);
        this.assert.ok(pwd, () => `sign in by email ${email} failed, the pwd cannot be empty.`);
        this.assert.ok(typeof pwd === "string", () => `sign in by email ${email} failed, the pwd should be a string.`);

        const emailOrg = await AccountModel.findOne({ email });
        this.assert.ok(!emailOrg, () => `sign in by email ${email} failed, this email is already exist.`);


        let md5 = crypto.createHash('md5');
        const password = md5.update(pwd).digest('hex');
        // this.log.info(`create webToken ${email} `);

        md5 = crypto.createHash('md5');
        const webToken = md5.update(`${email}:${Math.random()}`).digest('hex');

        const redisKey = getRedisKey("email_sign", webToken);

        // const self = await DiscoverConsulDriver.inst.getSelf();
        // this.assert.ok(self, "self is not exist");
        const address = turtle.runtime.ip;
        const port = turtle.runtime.port;

        const url = `${address}:${port}/api/v1/login/validate_email/${redisKey}`;
        this.log.info(`create webToken ${email} ${url}`);

        try {
            await this.sendMail(email, "Validate Email", url);
        } catch (e) {
            this.log.error(`sign in by email ${email} failed, send email error: ${e.message}, stack: ${e.stack}`);
            throw e;
        }
        await RedisDriver.inst.set(redisKey, JSON.stringify({ email, password }), "EX", 300);
        return { token: url };
    }

    async signInByPhone(phone: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        return { token: "" };
    }

    async signInBySign(sign: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        return { token: "" };
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

    async loginByEmail(passport: string, pwd: string, loginInfo: IAccountLoginInfo = {}) {
        const account = await AccountHelper.getByEmail(passport);
        this.assert.ok(account, () => `login by email ${passport} failed, this pass port does not exist.`);

        let md5 = crypto.createHash('md5');
        const password = md5.update(pwd).digest('hex');

        this.assert.sEqual(account!.password, password, () => `login by email ${passport} failed, password not match.`);

        md5 = crypto.createHash('md5');
        const webToken = md5.update(`${account!._id}:${Math.random()}`).digest('hex');

        await this.renewalWebToken(webToken, account!._id.toString());
        return {
            token: webToken,
            account: account,
            login_info: loginInfo
        };
    }

    async getOnlineUIDByToken(webToken: string): Promise<string> {
        const rkWebToken = LoginService.getRKWebToken(webToken);
        const l2id = await RedisDriver.inst.get(rkWebToken);
        this.assert.ok(l2id, () => `get l2id by webToken <${webToken}> failed: cannot find this token`);
        return l2id!;
    }

    async getOnlineAccountInfo(webToken: string): Promise<IAccountDocument> {
        const l2id = await this.getOnlineUIDByToken(webToken);
        const account = await AccountHelper.getByUID(parseInt(l2id));
        this.assert.ok(account, () => `get account by webToken <${webToken}> failed: this account does not exist.`);
        return account!;
    }

    async sendMail(toEmail: string, subject: string, content: string) {
        const email = turtle.rules<ILoginRule>().mail_option.auth.user;
        const indAt = email.indexOf("@") + 1;
        this.assert.ok(indAt >= 0, `send mail failed, email ${email} format error`);
        await mail.sendMail(
            email.substr(indAt),
            email,
            toEmail,
            subject,
            content,
            turtle.rules<ILoginRule>().mail_option
        );
    }

    async validateEmail(token: string) {
        const data = await RedisDriver.inst.get(token);
        this.assert.ok(data, `${token} is invalid`);

        const { email, password } = JSON.parse(data!);
        this.assert.ok(email && password, `${token} is invalid`);

        const account = new AccountModel({
            email: email,
            password: password,
        });
        await account.save();
    }
}
