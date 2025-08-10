import express, {  } from 'express';
import cors from 'cors';
import swaggerSpec from './config/swagger.config';
import healthRouter from './modules/health/health.controller';
import userRouter from './modules/users/user.controller';
import walletRouter from './modules/wallet/wallet.controller';
import { fauxAuth } from './middleware/fauxAuth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';

const swaggerUi = require('swagger-ui-express');

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Rate limiting middleware (disabled during tests)
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
  });
  app.use(limiter);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.'
    }
  });
  app.use('/api/', apiLimiter);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors());

app.use(fauxAuth);

const apiRouter = express.Router();

// Attach routers to `apiRouter`
apiRouter.use('/health', healthRouter); 
apiRouter.use('/users', userRouter);    
apiRouter.use('/wallet', walletRouter); 

// Set up Swagger documentation route with CORS-friendly options
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        tryItOutEnabled: true,
        requestInterceptor: (req: any) => {
            // Add CORS headers to requests made from Swagger UI
            req.headers['Access-Control-Allow-Origin'] = '*';
            req.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            req.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
            return req;
        },
        responseInterceptor: (res: any) => {
            return res;
        }
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Demo Credit API Documentation'
}));

// Apply the prefix to all routes
app.use('/api', apiRouter);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
