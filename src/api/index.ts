import * as Koa from "koa";
import "reflect-metadata";

import { useContainer, useKoaServer } from "routing-controllers";
import { Container } from "typedi";

import * as controllers from "./controllers/index";

import { useMiddlewares } from "./middlewares";
import { createServer, Server } from "http";

const objectToArray = (dict: any): any[] =>
    Object.keys(dict).map((name) => dict[name]);

export class ApiApplication {
    private api: Koa;
    private server: Server;

    constructor() {
        this.api = new Koa();
        this.server = createServer(this.api.callback());
    }

    private init() {
        this.api.use(async (ctx: Koa.Context, next: Function) => {
            try {
                await next();
            } catch (error) {
                ctx.status = 200;
                const msgCode = Number(error.message || error);

                ctx.body = {
                    statusCode: error.statusCode || 500,
                    message: isNaN(msgCode) ? (error.message || error) : msgCode,
                };
            }
        });

        useMiddlewares(this.api, process.env.NODE_ENV || "development");

        this.api = useKoaServer<Koa>(this.api, {
            routePrefix: "/v1",
            validation: true,
            controllers: objectToArray(controllers),
            classTransformer: false,
        });
        useContainer(Container);
    }

    public start(port: number): Server {
        this.init();
        return this.api.listen(port, (): void => {
            console.log(`Koa server has started, running at: http://127.0.0.1:${port}. `);
        });
    }
}
