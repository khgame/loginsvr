import * as Koa from "koa";
import * as cors from "@koa/cors";
import * as bodyParser from "koa-bodyparser";
import * as logger from "koa-logger";

const apply: { [key: string]: () => Koa.Middleware[] } = {
    ["prod"]: () => [
        cors(),
        bodyParser()
    ],
    ["dev"]: () => [
        cors(),
        bodyParser(),
        logger(),
    ]
};

export const useMiddlewares = (app: Koa, applyGroup: string): Koa => {
    return apply[applyGroup]().reduce((_, m) => {
        _.use(m);
        return _
    }, app);
};
