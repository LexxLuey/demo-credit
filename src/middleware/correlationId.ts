import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to add correlation IDs to requests for better tracking and logging
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Check if correlation ID is already provided in headers
    let correlationId = req.headers['x-correlation-id'] as string;
    
    // Generate new correlation ID if not provided
    if (!correlationId) {
        correlationId = uuidv4();
    }
    
    // Attach correlation ID to request for use throughout the request lifecycle
    req.correlationId = correlationId;
    
    // Set correlation ID in response headers for client tracking
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
};
