import {Global} from "../../global";
import {http} from "./rpc";

export const validate = async (
    validatorIdentity: string,
    userIdentity: string,
    loginToken: string,
    secret: string,
    algorithm: string) => {
    console.log("req");
    const rsp = await http.post(`${Global.conf.validator.host}${Global.conf.validator.api}`, {
        validatorIdentity,
        userIdentity,
        loginToken,
        secret,
        algorithm
    }).catch(ex => {
        throw new Error("validator error => " + ex.message);
    });

    if (rsp.status !== 200){
        throw new Error("validator response status error");
    }
    return rsp.data;
};
