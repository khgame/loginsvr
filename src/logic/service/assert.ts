import {Logger} from "winston";
import {genLogger} from "./logger";

type StringMethod = () => string;

export class Assert {

    public log: Logger;

    constructor(public prefix: string) {
        this.log = genLogger(prefix);
    }

    ok<T>(condition: T, msg: string | Error | StringMethod) {
        if (condition) {
            return;
        }
        let msgStr: string = '';
        if (msg as StringMethod) {
            msgStr = (msg as StringMethod)();
            msg = new Error(msgStr);
        } else if (msg as string) {
            msgStr = msg as string;
            msg = new Error(msgStr);
        } else {
            msgStr = (msg as Error).message;
        }
        this.log.warn(msgStr);
        throw msg;
    }

    sEqual<T>(a: T, b: T, msg: string | Error | StringMethod) {
        return this.ok(a === b, msg);
    }

    sNotEqual<T>(a: T, b: T, msg: string | Error | StringMethod) {
        return this.ok(a !== b, msg);
    }
}

export function genAssert(prefix: string) {
    return new Assert(prefix);
}






