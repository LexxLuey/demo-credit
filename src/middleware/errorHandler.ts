import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';
import logger from '../utils/logger';

// Global error handling middleware
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err.message || 'Internal Server Error';

    // Log error details
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    });
};

// Async error wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};