// src/middleware/mockAuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export const mockAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Request Mock Object:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
        authenticatedUser: req.authenticatedUser, // Custom property if set by auth middleware
    });
    next();
};
