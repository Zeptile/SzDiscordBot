import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

const { combine, timestamp, printf, colorize } = winston.format;

const callerFormat = winston.format((info) => {
  const stackTrace = new Error().stack;
  const callerLine = stackTrace?.split("\n")[3];
  if (callerLine) {
    const match = callerLine.match(/\((.+)\)/);
    if (match) {
      const fullPath = match[1].split(":")[0];
      info.caller = path.relative(process.cwd(), fullPath);
    }
  }
  return info;
});

const logFormat = printf(({ level, message, timestamp, caller }) => {
  return `${timestamp} [${level}] ${caller ? `(${caller})` : ""}: ${message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(
    callerFormat(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
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
  ],
});

export default logger;
