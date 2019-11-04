#!/usr/bin/env node

import { CommandLineApp, RedisDriver } from "@khgame/turtle";
import { Api } from "./api/api";
import {defaultConf} from "./defaultConf";
import * as controllers from "./controllers";

const cli = new CommandLineApp(
    "dg-login",
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
