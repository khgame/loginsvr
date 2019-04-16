import {assert} from "chai";
import * as Path from "path";
import {Global} from "../src/global";

import {spawn, exec, ChildProcess} from 'child_process';
import {getValidatorInfo, initServices, waitForValidatorAlive} from "../src/logic/service";
import {forMs} from "kht";
import {createReq} from "./createReq";
import {forCondition} from "kht";

describe(`validate owner_id`, async function () {
    process.env.NODE_ENV = "production";
    Global.setConf(Path.resolve(__dirname, `../src/conf.default.json`), false);

    let validatorProcess: ChildProcess;
    before(async function() {
        this.timeout(10000);
        await initServices();
        console.log("=> start login server mock", Date.now());
        validatorProcess = exec("npx mockSignValidator start -m", function (err) {
            console.log('child exit code (exec)', err!.code);
        });
        await waitForValidatorAlive();
        console.log("=> start test", Date.now());
    });

    after((done) => {
        validatorProcess.kill();
        console.log("=> end login server mock");
        done();
    });

    let token: string;

    it('0. /v1/core/validator: check validator info', function (done) {
        createReq().get(`/v1/core/validator`)
            .set('Accept', 'application/json')
            .send({})
            .expect('Content-Type', /json/)
            .expect(200) // Method not allowed
            .end(function (err, res) {
                if (err) {
                    console.log(res.body);
                    return done(err);
                }
                let result = res.body.result;
                assert.ok(result);
                done();
            });
    });

    it('1. /v1/session/get_login_token: login procedure', function (done) {
        createReq().get(`/v1/session/get_login_token`)
            .set('Accept', 'application/json')
            .send({validatorIdentity: "eos", userIdentity: "thetestuser1"})
            .expect(405) // Method not allowed
            .end(done);
    });

    it('2. /v1/session/get_login_token: login procedure', function (done) {
        createReq().post(`/v1/session/get_login_token`)
            .set('Accept', 'application/json')
            .send({validatorIdentity: "mock", userIdentity: "test_user"})
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
                console.log("=> token set:", token);
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

    let session_id: string;
    it('6. /v1/session/login: login when validate passed', function (done) {
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
                session_id = result.sessionId;
                assert.ok(result.result);
                assert.ok(result.sessionId);
                done();
            });
    });

    it('7. /v1/game_svr/list: get list wrong session_id', function (done) {
        createReq().get(`/v1/game_svr/list`)
            .set('Accept', 'application/json')
            .set("session_id", "mock")
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('8. /v1/game_svr/list: get list passed', function (done) {
        createReq().get(`/v1/game_svr/list`)
            .set('Accept', 'application/json')
            .set("session_id", session_id)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    console.log(res.body);
                    return done(err);
                }
                let result = res.body.result;
                // console.log("res.body:", result);
                done();
            });
    });

    it('9. /v1/game_svr/server_list: get server_list passed', function (done) {
        createReq().get(`/v1/game_svr/server_list`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('10. /v1/game_svr/heartbeat: server heartbeat wrong server_identity', function (done) {
        createReq().post(`/v1/game_svr/heartbeat`)
            .set('Accept', 'application/json')
            .send({server_identity: "222", server_state: "1"})
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('11. /v1/game_svr/heartbeat: server heartbeat passed', function (done) {
        createReq().post(`/v1/game_svr/heartbeat`)
            .set('Accept', 'application/json')
            .send({server_identity: "1", server_state: "1"})
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('12. /v1/session/choose_server: choose_server wrong session_id', function (done) {
        createReq().post(`/v1/session/choose_server`)
            .set('Accept', 'application/json')
            .set("session_id", "mock222")
            .send({server_identity: "1"})
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('13. /v1/session/choose_server: choose_server wrong server_identity', function (done) {
        createReq().post(`/v1/session/choose_server`)
            .set('Accept', 'application/json')
            .set("session_id", session_id)
            .send({server_identity: "11"})
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('14. /v1/session/choose_server: choose_server wrong state server_identity', function (done) {
        createReq().post(`/v1/session/choose_server`)
            .set('Accept', 'application/json')
            .set("session_id", session_id)
            .send({server_identity: "2"})
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('15. /v1/session/choose_server: choose_server passed', function (done) {
        createReq().post(`/v1/session/choose_server`)
            .set('Accept', 'application/json')
            .set("session_id", session_id)
            .send({serverIdentity: "1"})
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('16. /v1/session/heartbeat: session heartbeat wrong session_id', function (done) {
        createReq().post(`/v1/session/heartbeat`)
            .set('Accept', 'application/json')
            .set("session_id", "mock")
            .expect('Content-Type', /json/)
            .expect(500)
            .end(done);
    });

    it('17. /v1/session/heartbeat: session heartbeat passed', function (done) {
        createReq().post(`/v1/session/heartbeat`)
            .set('Accept', 'application/json')
            .set("session_id", session_id)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('18. /v1/session/online_list: online_list passed', function (done) {
        createReq().get(`/v1/session/online_list`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('19. /v1/session/online_state: online_list passed', function (done) {
        createReq().get(`/v1/session/online_state/${session_id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });
});
