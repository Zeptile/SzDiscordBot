import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

const { combine, timestamp, printf, colorize, json, errors, prettyPrint } =
  winston.format;

const callerFormat = winston.format((info) => {
  const stackTrace = new Error().stack;
  if (stackTrace) {
    const lines = stackTrace.split("\n");
    for (const line of lines) {
      if (
        !line.includes("node_modules/") &&
        !line.includes("utils/logger.ts") &&
        line.includes("(")
      ) {
        const match = line.match(/\((.+?):(\d+):/);
        if (match) {
          const [, fullPath, lineNumber] = match;
          info.caller = `${path.relative(process.cwd(), fullPath)}:${lineNumber}`;
          break;
        }
      }
    }
  }
  return info;
});

const logFormat = printf(({ level, message, timestamp, caller }) => {
  return `${timestamp} [${level}] ${caller ? `(${caller})` : ""}: ${message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(callerFormat(), timestamp()),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
    }),
    new winston.transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
    }),
    new winston.transports.Http({
      format: combine(
        json(),
        errors({ stack: true }),
        prettyPrint(),
        winston.format((info) => {
          info.environment = process.env.NODE_ENV ?? "development";
          return info;
        })()
      ),
      host: "pub.highlight.run",
      path: "/v1/logs/json",
      ssl: true,
      headers: {
        "x-highlight-project": "jd403m0g",
        "x-highlight-service": "sz-discord-bot",
      },
    }),
  ],
});

export default logger;
