import {genMemCache, turtle} from "@khgame/turtle";
import * as Path from "path";
import * as fs from "fs-extra";

const superFlags = [
    {
        from: /{{ip_public}}/,
        to: () => turtle.runtime.ip_public
    },
    {
        from: /{{ip_locale}}/,
        to: () => turtle.runtime.ip
    }
];

const cache = genMemCache();

export function readTemplate(
    relativePath: string,
    replace: Array<{ from: string | RegExp, to: string | (() => string) }>
): string | null {

    let ret: string | null = cache.get(relativePath) || null;
    if (!ret) {
        const filePth = Path.resolve(turtle.runtime.cwd, relativePath);
        const exist = fs.existsSync(filePth);
        if (!exist) {
            return null;
        }
        ret = fs.readFileSync(filePth, {encoding: "UTF-8"});
    }

    if (!ret) { return null; }

    return applyTemplate(ret, replace);
}

export function applyTemplate(
    contents: string,
    replace: Array<{ from: string | RegExp, to: string | (() => string) }>
): string | null {

    let ret = contents;

    for (let iRep in replace) {
        const replacer = replace[iRep];
        ret = ret.replace(
            replacer.from,
            typeof replacer.to === "string" ? replacer.to : replacer.to()
        );
    }

    for (let iRep in superFlags) {
        const replacer = replace[iRep];
        ret = ret.replace(
            replacer.from,
            typeof replacer.to === "string" ? replacer.to : replacer.to()
        );
    }

    return ret;
}
