import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as logger from "koa-logger";

const apply: { [key: string]: () => Koa.Middleware[] } = {
    ["production"]: () => [
        bodyParser()
    ],
    ["development"]: () => [
        bodyParser(),
        logger(),
    ]
};

export const useMiddlewares = (app: Koa, applyGroup: string): Koa => {
    return apply[applyGroup]().reduce((_, m) => {
        _.use(m);
        return _;
    }, app);
};
