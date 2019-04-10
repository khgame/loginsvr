import {JsonController, UseInterceptor} from "routing-controllers";
import {MessageInterceptor} from "./messageInterceptor";
export {Get, Body, Post, Param} from "routing-controllers";


function compose(...decs: Function[]) {
    return (f: any) => {
        return decs.reverse().forEach(d => d(f));
    };
}

export function API(path: string) {
    return compose(
        UseInterceptor(MessageInterceptor),
        JsonController(path)
    );
}
