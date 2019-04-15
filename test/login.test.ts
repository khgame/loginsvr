import {assert} from "chai";
import * as Path from "path";
import {Global} from "../src/global";

import {spawn, exec, ChildProcess} from 'child_process';
import {initServices} from "../src/logic/service";
import {forMs} from "kht";
import {createReq} from "./createReq";

describe(`validate owner_id`, async function () {
    process.env.NODE_ENV = "production";
    Global.setConf(Path.resolve(__dirname, `../src/conf.default.json`), false);

    before(async () => {
        await initServices();
    });

    let token;

    it('1. /v1/session/get_login_token: login procedure', function (done) {
        createReq().get(`/v1/session/get_login_token`)
            .set('Accept', 'application/json')
            .send({ validatorIdentity: "eos", userIdentity: "thetestuser1" })
            .expect(405) // Method not allowed
            .end(done);
    });

    it('2. /v1/session/get_login_token: login procedure', function (done) {
        createReq().post(`/v1/session/get_login_token`)
            .set('Accept', 'application/json')
            .send({ validatorIdentity: "eos", userIdentity: "thetestuser1" })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(res.body);
                    return done(err);
                }
                let result = res.body.result;

                assert.ok(result.token);
                token = result.token;
                done();
            });
    });
});
