import * as fs from "fs";
import * as path from "path";
import { createLogger, format, transports } from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";
const env = process.env.NODE_ENV || "development";

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

const mainTransport = new DailyRotateFile({
    level: "info",
    filename: `${ensureLogDir()}/%DATE%-main.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "40m",
    maxFiles: "21d",
    format: format.json(),
});

export const log = createLogger({
    // change level if in dev environment versus production
    level: env === "development" ? "debug" : "info",
    format: format.combine(
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss.SSS",
        }),
        // format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
    ),
    transports: [
        new transports.Console({
            level: "debug",
            format: format.combine(
                format.colorize(),
                format.printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`),
            ),
        }),
        mainTransport,
    ],
});


export const genLogger = (prefix: string) => createLogger({
    // change level if in dev environment versus production
    level: (!process.env.NODE_ENV || process.env.NODE_ENV === "development") ? "debug" : "info",
    format: format.combine(
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss.SSS",
        }),
        // format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
    ),
    transports: [
        new transports.Console({
            level: (!process.env.NODE_ENV || process.env.NODE_ENV === "development") ? "verbose" : "info",
            format: format.combine(
                format.colorize(),
                format.printf((info) =>
                    `[${info.timestamp}] [${info.level}] ${prefix ? "[" + prefix + "]" : ""}: ${info.message}`),
            ),
        }),
        mainTransport,
    ],
});
