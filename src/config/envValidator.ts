// src/config/envValidator.ts
import { config } from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
config();

const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'ADJUTOR_API_KEY'
];

const optionalEnvVars = [
    'NODE_ENV',
    'PORT',
    'LOG_LEVEL',
    'DATABASE_PORT'
];

export const validateEnvironment = (): void => {
    const missing: string[] = [];
    const invalid: string[] = [];

    // Check required environment variables
    requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    });

    // Validate specific environment variables
    if (process.env.DATABASE_PORT && isNaN(Number(process.env.DATABASE_PORT))) {
        invalid.push('DATABASE_PORT must be a valid number');
    }

    if (process.env.PORT && isNaN(Number(process.env.PORT))) {
        invalid.push('PORT must be a valid number');
    }

    if (process.env.LOG_LEVEL && !['error', 'warn', 'info', 'debug'].includes(process.env.LOG_LEVEL)) {
        invalid.push('LOG_LEVEL must be one of: error, warn, info, debug');
    }

    // Log validation results
    if (missing.length > 0) {
        logger.error('Missing required environment variables', { missing });
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (invalid.length > 0) {
        logger.error('Invalid environment variables', { invalid });
        throw new Error(`Invalid environment variables: ${invalid.join(', ')}`);
    }

    // Log successful validation
    logger.info('Environment validation completed successfully', {
        required: requiredEnvVars.length,
        optional: optionalEnvVars.length,
        nodeEnv: process.env.NODE_ENV || 'development'
    });
};

export const getEnvironmentConfig = () => {
    return {
        database: {
            host: process.env.DATABASE_HOST!,
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USER!,
            password: process.env.DATABASE_PASSWORD!,
            name: process.env.DATABASE_NAME!
        },
        adjutor: {
            apiKey: process.env.ADJUTOR_API_KEY!
        },
        app: {
            port: parseInt(process.env.PORT || '3000'),
            nodeEnv: process.env.NODE_ENV || 'development',
            logLevel: process.env.LOG_LEVEL || 'info'
        }
    };
}; 