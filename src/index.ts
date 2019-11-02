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
        admin_token: "FILL_THIS_FILED_WITH_RANDOM_STRING",
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
        active_host: "",
        frontend_host: "",
        validate_redirect: "https://www.github.com/bagaking",
        use_public_id: true,
        sign_in_tpl: "./tpl/sign_in.html",
        find_pwd_tpl: "./tpl/find_pwd.html",
    } as ILoginRule
};

import * as controllers from "./controllers";
import { IMailOption } from "@khgame/turtle/lib/utils/sendMail";
import {ILoginRule} from "./constants/iRule";

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
