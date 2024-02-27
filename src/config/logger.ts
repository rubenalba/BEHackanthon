import winston from 'winston';

const LoggerWrapper = (): winston.Logger => {
  return winston.createLogger({
    level: `${process.env.LOGGER_LEVEL}`,
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    exitOnError: false,
  });
};

export const logger = LoggerWrapper();
