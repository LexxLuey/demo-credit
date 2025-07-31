import express, {  } from 'express';
import cors from 'cors';
import swaggerSpec from './config/swagger.config';
import healthRouter from './modules/health/health.controller';
import userRouter from './modules/users/user.controller';
import walletRouter from './modules/wallet/wallet.controller';
import { fauxAuth } from './middleware/fauxAuth';

const swaggerUi = require('swagger-ui-express');

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

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

export default app;
