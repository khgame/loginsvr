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

    let validatorProcess: ChildProcess;
    before(async () => {
        await initServices();
        console.log("=> start login server mock");
        validatorProcess = exec("npx mockSignValidator start -m", function (err) {
            console.log('child exit code (exec)', err!.code);
        });
        await forMs(1000);
        console.log("=> start test");
    });

    after((done) => {
        validatorProcess.kill();
        console.log("=> end login server mock");
        done();
    });

    let token: string;

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
            .send({ validatorIdentity: "mock", userIdentity: "test_user" })
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
                console.log("token set:", token);
                done();
            });
    });

    it('3. /v1/session/login: login with wrong validatorIdentity', function (done) {
        createReq().post(`/v1/session/login`)
            .set('Accept', 'application/json')
            .send({
                validatorIdentity: "wrong" + Math.random(),
                userIdentity: "test_user",
                loginToken: token,
                secret: token + "_sign",
                algorithm: ""
            })
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('4. /v1/session/login: login with wrong userIdentity', function (done) {
        createReq().post(`/v1/session/login`)
            .set('Accept', 'application/json')
            .send({
                validatorIdentity: "mock",
                userIdentity: "wrong_user" + Math.random(),
                loginToken: token,
                secret: token + "_sign",
                algorithm: ""
            })
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('5. /v1/session/login: login when validate failed', function (done) {
        createReq().post(`/v1/session/login`)
            .set('Accept', 'application/json')
            .send({
                validatorIdentity: "mock",
                userIdentity: "test_user",
                loginToken: token,
                secret: "b",
                algorithm: ""
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(res.body);
                    return done(err);
                }
                let result = res.body.result;
                assert.ok(!result.result);
                done();
            });
    });

    it('6. /v1/session/login: login when validate passed', function (done) {
        this.timeout(10000);
        createReq().post(`/v1/session/login`)
            .set('Accept', 'application/json')
            .send({
                validatorIdentity: "mock",
                userIdentity: "test_user",
                loginToken: token,
                secret: token + "_sign",
                algorithm: ""
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(res.body);
                    return done(err);
                }
                let result = res.body.result;
                // console.log("res.body:", res.body);
                assert.ok(result.result);
                assert.ok(result.sessionId);
                done();
            });
    });
});
