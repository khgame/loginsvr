import * as fs from "fs-extra";
import * as Path from 'path';

export class Global {
    static get conf() {
        if(!Global._conf) {
            throw new Error("read config error: config are not set.");
        }
        return Global._conf;
    }

    private static _conf: any;

    static confPath: any;

    static setConf(path: string, force: boolean) {
        if (!force && Global._conf) {
            return;
        }

        path = Path.isAbsolute(path) ? path : Path.resolve(process.cwd(), path);
        if (!fs.existsSync(path)) {
            throw new Error(`conf file at path(${path}) cannot be found`);
        }

        let content = fs.readFileSync(path);
        try {
            Global._conf = JSON.parse(content.toString());
        } catch (e) {
            throw new Error(`parse conf file at path(${path}) failed, content: ${content.toString()}`);
        }
        Global.confPath = path;
    }
}
