import {CommandLineApp} from "@khgame/turtle/lib";
import {Api} from "./api/api";


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
        "renewal_time_span": 600
    }
};

import * as controllers from "./controllers";

const cli = new CommandLineApp(
    "loginSvr",
    "0.0.1",
    ["mongo", "redis", "discover/consul"],
    () => new Api(Object.values(controllers), 1000,
        async (action) => { //
            // todo: validate service
            return true;
        }
    ),
    [], defaultConf);
cli.run();
