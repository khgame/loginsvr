#!/usr/bin/env node

import { CommandLineApp, RedisDriver } from "@khgame/turtle";
import { Api } from "./api/api";

const defaultConf = {
    name: "loginSvr",
    id: 0,
    port: 11801,
    setting: {
        log_prod_console: "info" as "info",
    },
    drivers: {
        "mongo": {
            host: "127.0.0.1",
            port: 27017,
            database: "loginSvr",
            username: "",
            password: ""
        },
        "redis": {
            db: 0,
            family: 4,
            host: "127.0.0.1",
            port: 6379,
            keyPrefix: "khgame:login:",
            key_mutex_wait_threshold: 100
        },
        "discover/consul": {
            optional: true,
            health: {
                api: "api/v1/core/health"
            },
            did: {
                "head_refresh": "process"
            }
        }
    },
    rules: {
        renewal_time_span: 600,
        mail_option: {
            host: '',
            port: 465,
            secureConnection: true,
            auth: {
                user: '',
                pass: '',
            }
        } as IMailOption,
        servers: ['crypto_heroes'],
        active_host: "",
        frontend_host: "",
        validate_redirect: "",
        sign_in_tpl: `
        <div style="width: 800px;background-color: black;padding: 50px;margin: 0;">
          <p style="margin: 0;">
            <strong style="color:white;font-size: 2rem;">你好！</strong>
          </p>
          <div style="color:white;font-size:1rem;padding: 2rem;background-color: #e48600;width:400px;margin-top: 30px;" >
            <p style="margin: 0;">请点击以下链接完成激活：</p>
            <a href="{url}" style="display: block; color:white;margin-top: 1rem;">激活链接：{redisKey}</a>
          </div>
          <!--<p style="color:white;margin: 0;margin-top: 2rem;">邮件内容描述</p>-->
        </div>
        `,
        find_pwd_tpl: `
        <div style="width: 800px;background-color: black;padding: 50px;margin: 0;">
          <p style="margin: 0;">
            <strong style="color:white;font-size: 2rem;">你好！</strong>
          </p>
          <div style="color:white;font-size:1rem;padding: 2rem;background-color: #e48600;width:400px;margin-top: 30px;" >
            <p style="margin: 0;">请点击以下链接重设密码：</p>
            <a href="{url}" style="display: block; color:white;margin-top: 1rem;">重设密码链接：{redisKey}</a>
          </div>
          <!--<p style="color:white;margin: 0;margin-top: 2rem;">邮件内容描述</p>-->
        </div>
        `
    }
};

import * as controllers from "./controllers";
import { IMailOption } from "@khgame/turtle/lib/utils/sendMail";

const cli = new CommandLineApp(
    "loginSvr",
    process.version,
    ["mongo", "redis", "discover/consul"],
    () => new Api(Object.values(controllers), 1000,
        async (action) => {
            const token = action.request.headers.token;
            if (token) {
                const uid = await RedisDriver.inst.get(token);
                if (uid) {
                    await RedisDriver.inst.set(token, uid, "EX", 7200);
                    return uid;
                }
            }
            return true;
        }
    ),
    [], defaultConf);
cli.run();
