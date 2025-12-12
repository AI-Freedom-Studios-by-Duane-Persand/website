import { createLogger, format, transports } from 'winston';
import path from 'path';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(process.cwd(), 'logs', 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(process.cwd(), 'logs', 'combined.log') }),
  ],
});
