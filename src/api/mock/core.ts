import {API, Get} from "../decorators";
import {getValidatorInfo} from "../../logic/service";

@API("/core")
export class ServerController {

    constructor() {
    }

    @Get("/info")
    public async info() {
        return {
            version: "0.1.2",
        }; // mock todo
    }

    @Get("/validator")
    public async validator() {
        const validatorInfoRsp = await getValidatorInfo()
        if (validatorInfoRsp.status !== 200) {
            return false;
        }
        return validatorInfoRsp.data;
    }

}
