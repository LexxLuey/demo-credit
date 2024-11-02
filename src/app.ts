import express, {  } from 'express';
import swaggerSpec from './config/swagger.config';
import healthRouter from './modules/health/health.controller';
import userRouter from './modules/users/user.controller';
import walletRouter from './modules/wallet/wallet.controller';
import { fauxAuth } from './middleware/fauxAuth';

const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

app.use(fauxAuth);

const apiRouter = express.Router();

// Attach routers to `apiRouter`
apiRouter.use('/health', healthRouter); 
apiRouter.use('/users', userRouter);    
apiRouter.use('/wallet', walletRouter); 

// Set up Swagger documentation route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply the prefix to all routes
app.use('/api', apiRouter);

export default app;
