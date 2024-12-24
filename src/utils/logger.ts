import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

const { combine, timestamp, printf, colorize } = winston.format;

// Custom format to include the caller information
const callerFormat = winston.format((info) => {
  const stackTrace = new Error().stack;
  const callerLine = stackTrace?.split("\n")[3]; // Get the caller's line
  if (callerLine) {
    const match = callerLine.match(/\((.+)\)/);
    if (match) {
      const fullPath = match[1].split(":")[0];
      info.caller = path.relative(process.cwd(), fullPath);
    }
  }
  return info;
});

// Custom format for console and file output
const logFormat = printf(({ level, message, timestamp, caller }) => {
  return `${timestamp} [${level}] ${caller ? `(${caller})` : ""}: ${message}`;
});

// Create the logger
const logger = winston.createLogger({
  level: "info",
  format: combine(
    callerFormat(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      ),
    }),
    // Rotating file transport for errors
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
    }),
    // Rotating file transport for all logs
    new winston.transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
    }),
  ],
});

export default logger;
