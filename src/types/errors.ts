// Custom error types for consistent error handling
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404);
    }
}

export class InsufficientFundsError extends AppError {
    constructor() {
        super('Insufficient funds', 400);
    }
}

export class BlacklistError extends AppError {
    constructor() {
        super('User is blacklisted', 403);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, 401);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

export class ExternalServiceError extends AppError {
    constructor(service: string, message: string = 'External service error') {
        super(`${service}: ${message}`, 400);
    }
} 

export class UserAlreadyExistsError extends AppError {
    constructor(email: string) {
        super(`User with email ${email} already exists`, 400);
    }
}