/**
 * ===========================================
 * Logger Configuration (Winston)
 * ===========================================
 *
 * Centralized logging with structured output.
 * - Console: colorized for development
 * - File: JSON format for production analysis
 *   • combined.log  — all messages (info+)
 *   • error.log     — errors only
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom console format: "2026-03-04 14:30:00 [INFO] message"
const consoleFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]${extra ? ' ' : ''} ${message}${extra}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'cinevest-api' },
  transports: [
    // Console — always active
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat,
      ),
    }),
  ],
});

// In production, also write to files
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json()),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
  );
}

export default logger;
