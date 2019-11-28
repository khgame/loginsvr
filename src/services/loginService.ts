import {Service} from "typedi";
import * as crypto from "crypto";
import {AccountHelper, AccountModel, IAccountDocument, IAccountLoginInfo, IAccountRegInfo} from "./model/account";
import {
    genAssert,
    genLogger,
    getRedisKey,
    RedisDriver,
    turtle,
    DiscoverConsulDriver,
    genMemCache
} from "@khgame/turtle/lib";
import {mail} from "@khgame/turtle/lib/utils/sendMail";
import {ILoginRule} from "../constants/iRule";
import {applyTemplate, readTemplate} from "./util/file";
import {ERROR_CODE} from "../constants/errorCode";
import * as fs from "fs-extra";
import * as Path from "path";
import {DGID} from "dgip-ts";

@Service()
export class LoginService {

    log = genLogger('s:login');
    assert = genAssert('s:login');
    tplCache = genMemCache();

    static inst: LoginService;

    static getRKWebToken(token: string) {
        return getRedisKey('web_token', token);
    }

    constructor() {
        LoginService.inst = this;
        this.log.verbose("Service: instance created ");
    }

    async renewalWebToken(webToken: string, dgid: DGID, time: number = turtle.rules<any>().renewal_time_span) {
        const rkWebToken = LoginService.getRKWebToken(webToken);
        this.log.info(`renewal Session ${rkWebToken} => ${dgid}`);
        return await RedisDriver.inst.set(rkWebToken, dgid, "EX", time);
    }

    async registerByPassport(passport: string, pwd: string, regInfo: IAccountRegInfo = {}) {

        const accountOrg = await AccountHelper.getByPassport(passport);
        this.assert.ok(!accountOrg, () => `sign in by passport ${passport} failed, this pass port is already exist.`);

        let md5 = crypto.createHash('md5');
        const password = md5.update(pwd).digest('hex');
        let accountModel = {
            passport: passport,
            password: password,
            reg_info: regInfo
        };
        this.log.info(JSON.stringify(accountModel));
        const account = new AccountModel(accountModel);
        await account.save();


        md5 = crypto.createHash('md5');
        const webToken = md5.update(`${account._id}:${Math.random()}`).digest('hex');

        await this.renewalWebToken(webToken, account._id);

        return {
            token: webToken,
            account: account
        };
    }

    async registerByEmail(email: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        this.assert.cok(email, ERROR_CODE.PARAM_ERROR, () => `sign in by email failed, the email cannot be empty.`);
        this.assert.cok(pwd, ERROR_CODE.PARAM_ERROR, () => `sign in by email ${email} failed, the pwd cannot be empty.`);
        this.assert.cok(typeof pwd === "string", ERROR_CODE.PARAM_ERROR, () => `sign in by email ${email} failed, the pwd should be a string.`);

        const emailOrg = await AccountModel.findOne({email});
        this.assert.cok(!emailOrg, ERROR_CODE.PASSPORT_ALREADY_EXIST, () => `sign in by email ${email} failed, this email is already exist.`);


        let md5 = crypto.createHash('md5');
        const password = md5.update(pwd).digest('hex');
        // this.log.info(`create webToken ${email} `);

        md5 = crypto.createHash('md5');
        const webToken = md5.update(`${email}:${Math.random()}`).digest('hex');

        const redisKey = getRedisKey("email_sign", webToken);

        // const self = await DiscoverConsulDriver.inst.getSelf();
        // this.assert.ok(self, "self is not exist");
        const rule = turtle.rules<ILoginRule>();
        const address = rule.use_public_ip ? turtle.runtime.ip_public : turtle.runtime.ip;
        const port = turtle.runtime.port;

        const url = `${rule.active_host || ("http://" + address + ":" + port + "/api/v1/login/validate_email/")}${redisKey}`;
        this.assert.cok(url, ERROR_CODE.CONFIG_ERROR, () => `sign in by email: cannot create url by ${rule.active_host}`);

        this.log.info(`sign in by email: create web_token address ${url} to ${email}`);

        const pathOfSignInEmailTpl = Path.isAbsolute(rule.sign_in_tpl) ? rule.sign_in_tpl : Path.resolve(process.cwd(), rule.sign_in_tpl);

        const tpl: string = await this.tplCache.getLoosingCache(pathOfSignInEmailTpl, async (key: string) => {
            const exist = fs.existsSync(key);
            this.assert.cok(exist, ERROR_CODE.CONFIG_ERROR, () => `sign in by email failed: template file ${pathOfSignInEmailTpl} are not exist`);
            return fs.readFileSync(pathOfSignInEmailTpl, {encoding: "utf-8"});
        }, 60);

        const html = applyTemplate(tpl, [
            {from: /{url}/, to: url},
            {from: /{redisKey}/, to: redisKey},
        ]);
        this.assert.cok(html, ERROR_CODE.TEMPLATE_LOADING_FAILED,
            () => `sign in by email failed: cannot find the email template.`
        );

        await RedisDriver.inst.set(redisKey, JSON.stringify({email, password}), "EX", 300);
        try {
            await this.sendMailHtml(email, "Validate Email", html!);
        } catch (e) {
            this.log.error(`sign in by email ${email} failed, send email error: ${e.message}, stack: ${e.stack}`);
            throw e;
        }
        return {token: url};
    }

    async registerByPhone(phone: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        return {token: ""};
    }

    async registerBySign(sign: string, pwd: string, accountRegInfo: IAccountRegInfo = {}) {
        return {token: ""};
    }

    async loginByPassport(identity: string, pwd: string, loginInfo: IAccountLoginInfo = {}) {
        const account = await AccountHelper.getByPassport(identity);
        this.assert.cok(account, ERROR_CODE.PASSPORT_DOSE_NOT_EXIST, () => `login by passport ${identity} failed, this passport does not exist.`);

        const password = pwd; // md5.update(pwd).digest('hex');
        this.assert.cStrictEqual(account!.password, password, ERROR_CODE.PASSWORD_NOT_MATCH, () => `login by passport ${identity} failed, password not match.`);

        let md5 = crypto.createHash('md5');
        const webToken = md5.update(`${account!._id}:${Math.random()}`).digest('hex');

        await this.renewalWebToken(webToken, account!._id);
        return {
            token: webToken,
            account: account,
            login_info: loginInfo
        };
    }

    async loginByEmail(identity: string, pwd: string, loginInfo: IAccountLoginInfo = {}) {
        const account = await AccountHelper.getByEmail(identity);
        this.assert.cok(account, ERROR_CODE.PASSPORT_DOSE_NOT_EXIST, () => `login by email ${identity} failed, this pass port does not exist.`);

        const password = pwd; // md5.update(pwd).digest('hex');

        this.assert.cStrictEqual(account!.password, password, ERROR_CODE.PASSWORD_NOT_MATCH, () => `login by email ${identity} failed, password not match.`);

        let md5 = crypto.createHash('md5');
        const webToken = md5.update(`${account!._id}:${Math.random()}`).digest('hex');

        await this.renewalWebToken(webToken, account!._id);
        return {
            token: webToken,
            account: account,
            login_info: loginInfo
        };
    }

    async findPassword(email: string) {
        this.assert.cok(email, ERROR_CODE.PASSPORT_ERROR, () => `sign in by email failed, the email cannot be empty.`);

        const emailOrg = await AccountModel.findOne({email});
        this.assert.cok(emailOrg, ERROR_CODE.PASSPORT_ALREADY_EXIST, () => `sign in by email ${email} failed, this email is already exist.`);

        const md5 = crypto.createHash('md5');
        const webToken = md5.update(`${email}:${Math.random()}`).digest('hex');

        const redisKey = getRedisKey("email_find_pwd", webToken);

        const rule = turtle.rules<ILoginRule>();
        const url = `${rule.frontend_host}/?reset_pwd=${redisKey}`;
        this.assert.cok(url, ERROR_CODE.CONFIG_ERROR, `find password: cannot create url`);

        this.log.info(`sign in by email: create web_token address ${url} to ${email}`);

        this.log.info(`create webToken ${email} ${url}`);

        const pathOfFindPwdEmailTpl = Path.isAbsolute(rule.find_pwd_tpl) ? rule.find_pwd_tpl : Path.resolve(process.cwd(), rule.find_pwd_tpl);

        const tpl: string = await this.tplCache.getLoosingCache(pathOfFindPwdEmailTpl, async (key: string) => {
            const exist = fs.existsSync(key);
            this.assert.cok(exist, ERROR_CODE.CONFIG_ERROR, () => `find password by email failed: template file ${pathOfFindPwdEmailTpl} are not exist`);
            return fs.readFileSync(pathOfFindPwdEmailTpl, {encoding: "utf-8"});
        }, 60);

        const html = applyTemplate(tpl, [
            {from: /{url}/, to: url},
            {from: /{redisKey}/, to: redisKey},
        ]);
        this.assert.cok(html, ERROR_CODE.TEMPLATE_LOADING_FAILED,
            () => `find password by email failed: cannot find the email template.`
        );

        try {
            await this.sendMailHtml(email, "Retrieve password", html!);
        } catch (e) {
            this.log.error(`sign in by email ${email} failed, send email error: ${e.message}, stack: ${e.stack}`);
            throw e;
        }
        await RedisDriver.inst.set(redisKey, email, "EX", 300);
        return {token: url};
    }

    async resetPwd(token: string, pwd: string) {
        const email = await RedisDriver.inst.get(token);
        this.assert.cok(email, ERROR_CODE.SESSION_NOT_FOUND, () => `${token} is invalid`);

        let md5 = crypto.createHash('md5');
        const password = md5.update(pwd).digest('hex');

        const account = await AccountModel.findOneAndUpdate({email}, {$set: {password}}, {new: true});
        return account;
    }

    async changePwdOfEmail(email: string, old_pwd_hash: string, pwd: string) {
        const account = await AccountHelper.getByEmail(email);
        this.assert.cok(account, ERROR_CODE.PASSPORT_DOSE_NOT_EXIST,
            () => `change pwd of email failed: cannot found user ${email}`);
        this.assert.cStrictEqual(account!.password, old_pwd_hash, ERROR_CODE.PASSWORD_NOT_MATCH,
            () => `change pwd of email failed: validate failed ${email} ${old_pwd_hash}`);

        let md5 = crypto.createHash('md5');
        const new_password = md5.update(pwd).digest('hex');
        return await AccountModel.findOneAndUpdate({
            email, password: old_pwd_hash
        }, {$set: {password: new_password}}, {new: true});
    }

    async changePwdOfPassport(passport: string, old_pwd_hash: string, pwd: string) {
        const account = await AccountHelper.getByPassport(passport);
        this.assert.cok(account, ERROR_CODE.PASSPORT_DOSE_NOT_EXIST,
            () => `change pws of passport failed: cannot found user ${passport}`);
        this.assert.cStrictEqual(account!.password, old_pwd_hash, ERROR_CODE.PASSWORD_NOT_MATCH,
            () => `change pws of passport failed: validate failed ${passport} ${old_pwd_hash}`);
        let md5 = crypto.createHash('md5');
        const new_password = md5.update(pwd).digest('hex');
        return await AccountModel.findOneAndUpdate({
            passport, password: old_pwd_hash
        }, {$set: {password: new_password}}, {new: true});
    }

    async getOnlineUIDByToken(webToken: string): Promise<string> {
        const rkWebToken = LoginService.getRKWebToken(webToken);
        const dgid = await RedisDriver.inst.get(rkWebToken);
        this.assert.ok(dgid, () => `get dgid by webToken <${webToken}> failed: cannot find this token`);
        return dgid!;
    }

    async getOnlineAccountInfo(webToken: string): Promise<IAccountDocument> {
        const dgid = await this.getOnlineUIDByToken(webToken);
        const account = await AccountHelper.getByUID(parseInt(dgid));
        this.assert.cok(account, ERROR_CODE.SESSION_NOT_FOUND, () => `get account by webToken <${webToken}> failed: this account does not exist.`);
        return account!;
    }

    async sendMailHtml(toEmail: string, subject: string, content: string) {
        const email = turtle.rules<ILoginRule>().mail_option.auth.user;
        const indAt = email.indexOf("@") + 1;
        this.assert.cok(indAt >= 0, ERROR_CODE.PARAM_ERROR, () => `send mail failed, email ${email} format error`);
        await mail.sendMailHtml(
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
        this.assert.cok(data, ERROR_CODE.SESSION_NOT_FOUND, `${token} is invalid`);

        const {email, password} = JSON.parse(data!);
        this.assert.cok(email && password, ERROR_CODE.PARAM_ERROR, `${token} is invalid`);

        const account = new AccountModel({
            email: email,
            password: password,
        });
        return await account.save();
    }
}
