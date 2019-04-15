import {ApiApplication} from "../src/api";
import * as request from "supertest";

export function createReq() {
    const server = (new ApiApplication()).server;
    return request(server);
}
