import {Global} from "../../global";
import {http} from "./rpc";
import {forCondition} from "kht";

export const waitForValidatorAlive = async () => {
    return await forCondition(async () => {
        try {
            return (await getValidatorInfo()).status === 200;
        }catch (e) {
            return false;
        }
    });
}

export const getValidatorInfo = async () => {
    const rsp = await http.get(`${Global.conf.validator.host}${"/info"}`).catch((ex: { message: string; }) => {
        throw new Error("validator error => " + ex.message);
    });
    return rsp;
};

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
    }).catch((ex: { message: string; }) => {
        throw new Error("validator error => " + ex.message);
    });

    if (rsp.status !== 200){
        throw new Error("validator response status error");
    }
    return rsp.data;
};
