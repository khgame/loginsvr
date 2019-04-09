import {Service} from "typedi";


@Service()
export class ServerService {
    static inst : ServerService;

    constructor() {
        ServerService.inst = this;
        console.log("Service: instance created ", ServerService.inst);
    }
}
