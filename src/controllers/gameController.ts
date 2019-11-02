import {API, Post, Body} from "./decorators";
import {genAssert, genLogger, turtle} from "@khgame/turtle/lib";
import {Get, Param} from "routing-controllers";
import {ILoginRule} from "../constants/iRule";
import {GameHelper} from "../services/model/game";
import {DGID} from "dgip-ts";

@API("/game")
export class GameController {

    log = genLogger('api:game');
    assert = genAssert('api:game');

    constructor() {
    }

    @Post("/create")
    public async create(@Body() body: {
        service_name: string, game_admin_dgid: DGID, admin_token?: string
    }) {
        this.assert.cStrictEqual(body.admin_token, turtle.rules<ILoginRule>().admin_token, 401,
            () => `admin_token token ${body.admin_token}  error`);
        this.assert.cNotNullAndUndefined(body.admin_token, 400, "admin_token must be given");
        return await GameHelper.create(body.service_name, body.game_admin_dgid);
    }

    @Get("/list")
    public async list() {
        return await GameHelper.list();
    }

    @Get("/get_by_name/:service_name")
    public async get(@Param("service_name") service_name: string) {
        return await GameHelper.getByName(service_name);
    }


}
