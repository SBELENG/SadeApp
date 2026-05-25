import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  logger.info('Health check endpoint called');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SADE API',
    databaseConnection: 'Configured'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`SADE API Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

export default app;
