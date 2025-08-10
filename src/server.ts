import app from './app';
import { config } from './config/env.config';
import logger from './utils/logger';
import { validateEnvironment } from './config/envValidator';

// Validate environment variables before starting the server
try {
    validateEnvironment();
} catch (error) {
    logger.error('Environment validation failed:', error);
    process.exit(1);
}

const startServer = async () => {
    try {
        const server = app.listen(config.port, () => {
            logger.info(`🚀 Server is running on port ${config.port}`, {
                port: config.port,
                nodeEnv: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            });
        });

        // Graceful shutdown handling
        const gracefulShutdown = (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);
            server.close(() => {
                logger.info('Server closed. Process exiting.');
                process.exit(0);
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

    } catch (error) {
        logger.error('Server failed to start:', error);
        process.exit(1);
    }
};

startServer();
