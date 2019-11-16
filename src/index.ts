#!/usr/bin/env node

import "reflect-metadata";
import {Container} from "typedi";
import {Action, useContainer} from "routing-controllers";

useContainer(Container);

import {CommandLineApp, IWorker, RedisDriver} from "@khgame/turtle";
import * as workers from "./workers";
import {Api} from "./api/api";
import {defaultConf} from "./defaultConf";
import * as controllers from "./controllers";

const cli = new CommandLineApp(
    "dg-login",
    process.version,
    ["mongo", "redis", "discover/consul"],
    () => new Api(Object.values(controllers), 1000,
        async (action: Action) => {
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
    Object.values(workers).map(
        w => () => Container.get<IWorker>(w)
    ),
    defaultConf);
cli.run();
