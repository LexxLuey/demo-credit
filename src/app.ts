// src/app.ts
import express, { Request, Response } from 'express';
import { config } from './config/env.config';
import swaggerSpec from './config/swagger.config';
import healthRouter from './modules/health/health.controller';


const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

// Prefix all routes with 'api/'
const apiRouter = express.Router();


// Set up Swagger documentation route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply the prefix to all routes
app.use('/api', apiRouter);
app.use('/api', healthRouter); // Add the health router

export default app;
