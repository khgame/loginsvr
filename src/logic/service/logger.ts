import * as fs from "fs";
import * as path from "path";
import {createLogger, format, transports} from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";
import {Global} from "../../global";

function ensureLogDir(folder?: string): string {
    let logDir: string = "logs";
    if (folder) {
        logDir = path.resolve(logDir, folder);
    }
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    return logDir;
}

function createFileTransport(label: string) {
    const nameSpace = label ? label.split(':')[0] : '';
    return new DailyRotateFile({
        level: "verbose",
        filename: `${ensureLogDir()}/[loginsvr]${
            Global.conf.server_id}#${Global.conf.server_hash}@${Global.conf.port
            }/${nameSpace.replace(/[:,&|]/g, '-')}@%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "40m",
        maxFiles: "21d",
        format: format.json(),
    });
}

export const genLogger = (label: string = "") => {
    const inDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    return createLogger({
        // change level if in dev environment versus production
        level: inDev ? "debug" : "info",
        format: format.combine(
            format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss.SSS",
            }),
            format.label({label})
        ),
        transports: [
            new transports.Console({
                level: inDev ? "verbose" : "info",
                format: format.combine(
                    format.colorize(),
                    format.printf((info) =>
                        `[${info.timestamp}] [${info.level}] [${info.lebel}]: ${info.message}`),
                ),
            }),
            createFileTransport(label),
            createFileTransport('main')
        ],
    });
};
