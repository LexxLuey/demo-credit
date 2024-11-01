// src/app.ts
import express, { Request, Response } from 'express';
import { config } from './config/env.config';
import swaggerSpec from './config/swagger.config';
import healthRouter from './modules/health/health.controller';
import userRouter from './modules/users/user.controller';
import walletRouter from './modules/wallet/wallet.controller';
import { fauxAuth } from './middleware/fauxAuth';

const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

app.use(fauxAuth);

// Prefix all routes with 'api/'
const apiRouter = express.Router();
// apiRouter.use(fauxAuth);

// Attach routers to `apiRouter`
apiRouter.use('/health', healthRouter); // Health routes at /api/health
apiRouter.use('/users', userRouter);    // User routes at /api/users
apiRouter.use('/wallet', walletRouter); // Health routes at /api/health

// Set up Swagger documentation route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply the prefix to all routes
app.use('/api', apiRouter);

export default app;
