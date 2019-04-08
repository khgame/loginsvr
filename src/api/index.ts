import * as Koa from "koa";
import "reflect-metadata";

import { useContainer, useKoaServer } from "routing-controllers";
import { Container } from "typedi";

import * as controllers from "./controllers/index";

import { useMiddlewares } from "./middlewares";
import { createServer, Server } from "http";

const objectToArray = (dict: any): any[] =>
    Object.keys(dict).map((name) => dict[name]);

class Application {
    private app: Koa;
    private server: Server;

    constructor() {
        this.app = new Koa();

        useContainer(Container);

        this.server = createServer(this.app.callback());
        this.init();
    }

    public start(port: number) {
        this.app.listen(port, (): void => {
            console.log(`Koa server has started, running with: http://127.0.0.1:${port}. `);
        });
    }

    private init() {
        this.app.use(async (ctx: Koa.Context, next: Function) => {
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

        useMiddlewares(this.app, 'dev');

        this.app = useKoaServer<Koa>(this.app, {
            routePrefix: "/v1",
            validation: true,
            controllers: objectToArray(controllers),
            classTransformer: false,
        });
        useContainer(Container);
    }
}

const app = new Application();
app.start(6002);
