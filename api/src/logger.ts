import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `[${timestamp}] [${level}]${context ? ' [' + context + ']' : ''}: ${message}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || 'logs/api.log',
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
};
