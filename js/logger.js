const colorize = require("json-colorizer");
// logger
import { createLogger, format, transports } from "winston";

const myFormat = format.printf((info) => {
    const { timestamp: tmsmp, level, message, stack, ...rest } = info;

    // format message
    var messageIn = message;
    if (typeof message === "object") {
        messageIn = JSON.stringify(message);
    }
    let log = `${tmsmp} - ${level}:\t${messageIn}`;

    // Only if there is an error
    if (stack !== undefined) log = `${log}\n ${stack}`;
    // Check if rest is object
    if (!(Object.keys(rest).length === 0 && rest.constructor === Object)) {
        log = `${log}\n${colorize(JSON.stringify(rest, null, 2))}`;
    }
    return log;
});


export function createCustomLogger() {

    var logger = createLogger({
        level: "info",
        format: format.combine(
            format.colorize(),
            format.timestamp(),
            myFormat
            //format.printf(inlineFormat)
        ),
        transports: [
            //
            // - Write all logs with level `error` and below to `error.log`
            // - Write all logs with level `info` and below to `combined.log`
            //
            new transports.File({
                filename: "error.log", level: "error",
                handleExceptions: true
            }),
            new transports.File({
                filename: "combined.log",
                handleExceptions: true
            })
        ]
    });

    //
    // If we're not in production then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    // 
    if (process.env.NODE_ENV !== "production") {
        logger.add(new transports.Console({
            timestamp: true,
            handleExceptions: true
        }));
    }

    return logger;
}