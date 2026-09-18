import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import mongoSanitize from 'express-mongo-sanitize';

import routes from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { ApiError } from './utils/ApiError.js';
import { ERROR_CODES } from './constants/responseCodes.js';
import { env } from './config/env.js';

import { observabilityMiddleware } from './middleware/observabilityMiddleware.js';

const app = express();

app.use(observabilityMiddleware);

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body Parsing & Cookie Parser
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

// Request Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errorCode: ERROR_CODES.BAD_REQUEST,
  },
});
app.use('/api', limiter);

// Base API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`, ERROR_CODES.NOT_FOUND));
});

// Central Error Handler
app.use(errorHandler);

export default app;
