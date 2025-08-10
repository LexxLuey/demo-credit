// src/middleware/mockAuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const mockAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    logger.debug('Request Mock Object:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
        authenticatedUser: req.authenticatedUser,
    });
    next();
};
