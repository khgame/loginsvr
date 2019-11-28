import {IMailOption} from "@khgame/turtle";
import {ILoginRule} from "./constants/iRule";

export const defaultConf = {
    name: "dg-login",
    id: 0,
    port: 12001,
    setting: {
        log_prod_console: "info" as "info",
    },
    drivers: {
        "mongo": {
            host: "127.0.0.1",
            port: 27017,
            database: "dg-login",
            username: "",
            password: ""
        },
        "redis": {
            db: 0,
            family: 4,
            host: "127.0.0.1",
            port: 6379,
            keyPrefix: "dg-login:",
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
        use_public_ip: true,
        sign_in_tpl: "./tpl/sign_in.html",
        find_pwd_tpl: "./tpl/find_pwd.html",
    } as ILoginRule
};