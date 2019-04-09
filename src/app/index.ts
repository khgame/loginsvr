import * as commander from "commander";
import * as Redis from "ioredis";
import {Global} from "../global";
import {ApiApplication} from "../api";
import * as Path from 'path';
import * as fs from "fs-extra";

async function main() {
    commander.version('0.1.0')
        .command('start')
        .description('start running login server')
        .option('-d, --development',
            '(default env setting) similar to set NODE_ENV=development, and will read login.development.json at executing position as config by default',
            () => process.env.NODE_ENV = 'development')
        .option('-p, --production',
            'similar to set NODE_ENV=production, and will read login.production.json at executing position as config by default',
            () => process.env.NODE_ENV = 'production')
        .option('-c, --config <path>',
            'set config path, and the specified conf will override the default one set by NODE_ENV',
            path => Global.setConf(path, true))
        .option('-P, --port <port>',
            'the port to serve api, will override the setting in config file, 11801 by default')
        .action((options) => {
            try {
                Global.setConf(Path.resolve(process.cwd(), `./login.${process.env.NODE_ENV || "development"}.json`), false);
            }catch (e) {
                Global.setConf(Path.resolve(__dirname, `../conf.default.json`), false);
            }

            console.log("config path :", Global.confPath);
            Global.conf.port = (options && options.port) || Global.conf.port || 11801;
            const api = new ApiApplication();
            api.start(Global.conf.port);
        });

    commander.command('extract')
        .description('extract default config to a file')
        .option('-p, --path <path>', 'the export path')
        .action((options) => {
            let extractPath = (options && options.path) || './login.development.json';
            extractPath = Path.isAbsolute(extractPath) ? extractPath : Path.resolve(process.cwd(), extractPath);
            fs.copyFileSync(Path.resolve(__dirname, `../conf.default.json`), extractPath);
            process.exit(1);
        });

    commander.parse(process.argv);
}

main().then(() => {
    console.info('running @khgame/loginsvr succeeded.');
}).catch((reason => {
    console.error(reason + '\nrunning @khgame/loginsvr failed.');
    process.exit(1);
}));

