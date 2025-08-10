import request from 'supertest';
import express from 'express';
import knex from '../../config/knex';
import { correlationIdMiddleware } from '../correlationId';
import { fauxAuth } from '../fauxAuth';
import { errorHandler, notFoundHandler, asyncHandler } from '../errorHandler';
import { AppError } from '../../types/errors';
import { v4 as uuidv4 } from 'uuid';

describe('Middleware Tests', () => {
    let testApp: express.Express;

    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
    });

    beforeEach(async () => {
        await knex.transaction(async (trx) => {
            await trx('transactions').del();
            await trx('wallets').del();
            await trx('users').del();
        });

        testApp = express();
        testApp.use(express.json());
    });

    afterAll(async () => {
        await knex.destroy();
    });

    describe('Correlation ID Middleware', () => {
        test('should generate correlation ID when not provided', async () => {
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res) => {
                res.json({ correlationId: req.correlationId });
            });

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(200);
            expect(response.headers['x-correlation-id']).toBeDefined();
            expect(response.headers['x-correlation-id']).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            );
            expect(response.body.correlationId).toBe(response.headers['x-correlation-id']);
        });

        test('should use provided correlation ID from headers', async () => {
            const providedCorrelationId = uuidv4();
            
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res) => {
                res.json({ correlationId: req.correlationId });
            });

            const response = await request(testApp)
                .get('/test')
                .set('X-Correlation-ID', providedCorrelationId);

            expect(response.status).toBe(200);
            expect(response.headers['x-correlation-id']).toBe(providedCorrelationId);
            expect(response.body.correlationId).toBe(providedCorrelationId);
        });

        test('should handle lowercase correlation ID header', async () => {
            const providedCorrelationId = uuidv4();
            
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res) => {
                res.json({ correlationId: req.correlationId });
            });

            const response = await request(testApp)
                .get('/test')
                .set('x-correlation-id', providedCorrelationId);

            expect(response.status).toBe(200);
            expect(response.headers['x-correlation-id']).toBe(providedCorrelationId);
        });

        test('should handle empty correlation ID header', async () => {
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res) => {
                res.json({ correlationId: req.correlationId });
            });

            const response = await request(testApp)
                .get('/test')
                .set('X-Correlation-ID', '');

            expect(response.status).toBe(200);
            expect(response.headers['x-correlation-id']).toBeDefined();
            expect(response.headers['x-correlation-id']).not.toBe('');
        });
    });

    describe('FauxAuth Middleware', () => {
        test('should return 401 when no users exist', async () => {
            testApp.use(fauxAuth);
            testApp.get('/test', (req, res) => {
                res.json({ success: true });
            });

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('No authenticated user available');
        });

        test('should authenticate with last created user', async () => {
            // Create test users with different creation times
            const userId1 = uuidv4();
            const userId2 = uuidv4();
            const walletId1 = uuidv4();
            const walletId2 = uuidv4();

            await knex('users').insert([
                { 
                    id: userId1, 
                    first_name: 'First', 
                    last_name: 'User', 
                    email: 'first@example.com',
                    created_at: new Date('2023-01-01')
                },
                { 
                    id: userId2, 
                    first_name: 'Last', 
                    last_name: 'User', 
                    email: 'last@example.com',
                    created_at: new Date('2023-12-31')
                }
            ]);

            await knex('wallets').insert([
                { id: walletId1, user_id: userId1, balance: 100 },
                { id: walletId2, user_id: userId2, balance: 200 }
            ]);

            testApp.use(fauxAuth);
            testApp.get('/test', (req, res) => {
                res.json({ 
                    userId: req.authenticatedUser.id,
                    email: req.authenticatedUser.email 
                });
            });

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(200);
            expect(response.body.userId).toBe(userId2); // Should be the last created user
            expect(response.body.email).toBe('last@example.com');
        });

        test('should handle missing wallet for authenticated user', async () => {
            const userId = uuidv4();

            await knex('users').insert({
                id: userId,
                first_name: 'No',
                last_name: 'Wallet',
                email: 'nowallet@example.com'
            });

            testApp.use(fauxAuth);
            testApp.get('/test', (req, res) => {
                res.json({ success: true });
            });

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error retrieving authenticated user');
        });

        test('should trust authenticated user in test environment', async () => {
            process.env.NODE_ENV = 'test';
            
            testApp.use((req, res, next) => {
                req.authenticatedUser = {
                    id: 'test-user-id',
                    walletId: 'test-wallet-id',
                    first_name: 'Test',
                    last_name: 'User',
                    email: 'test@example.com'
                };
                next();
            });

            testApp.use(fauxAuth);
            testApp.get('/test', (req, res) => {
                res.json({ 
                    userId: req.authenticatedUser.id,
                    email: req.authenticatedUser.email 
                });
            });

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(200);
            expect(response.body.userId).toBe('test-user-id');
            expect(response.body.email).toBe('test@example.com');

            // Reset NODE_ENV
            delete process.env.NODE_ENV;
        });

        test('should handle database error during user lookup', async () => {
            // Close database connection to simulate error
            await knex.destroy();

            testApp.use(correlationIdMiddleware);
            testApp.use(fauxAuth);
            testApp.get('/test', (req, res) => {
                res.json({ success: true });
            });

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error retrieving authenticated user');

            // Reinitialize database
            await knex.initialize();
        });
    });

    describe('Error Handler Middleware', () => {
        test('should handle AppError with status code', async () => {
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res, next) => {
                const error = new AppError('Custom error message', 422);
                next(error);
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(422);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Custom error message');
        });

        test('should handle generic Error', async () => {
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res, next) => {
                const error = new Error('Generic error');
                next(error);
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Generic error');
        });

        test('should include stack trace in development mode', async () => {
            process.env.NODE_ENV = 'development';
            
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res, next) => {
                const error = new Error('Error with stack');
                next(error);
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.stack).toBeDefined();

            // Reset NODE_ENV
            delete process.env.NODE_ENV;
        });

        test('should not include stack trace in production mode', async () => {
            process.env.NODE_ENV = 'production';
            
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res, next) => {
                const error = new Error('Error without stack');
                next(error);
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.stack).toBeUndefined();

            // Reset NODE_ENV
            delete process.env.NODE_ENV;
        });

        test('should handle error without message', async () => {
            testApp.use(correlationIdMiddleware);
            testApp.get('/test', (req, res, next) => {
                const error = new Error();
                error.message = '';
                next(error);
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Internal Server Error');
        });
    });

    describe('NotFound Handler Middleware', () => {
        test('should handle 404 for non-existent routes', async () => {
            testApp.use(notFoundHandler);
            testApp.use(errorHandler);

            const response = await request(testApp).get('/non-existent-route');

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Route /non-existent-route not found');
        });
    });

    describe('AsyncHandler Wrapper', () => {
        test('should catch async errors and pass to error handler', async () => {
            const asyncRoute = asyncHandler(async (req: express.Request, res: express.Response) => {
                throw new Error('Async error');
            });

            testApp.get('/test', asyncRoute);
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Async error');
        });

        test('should handle async route that resolves successfully', async () => {
            const asyncRoute = asyncHandler(async (req: express.Request, res: express.Response) => {
                res.json({ success: true });
            });

            testApp.get('/test', asyncRoute);
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should handle rejected promises', async () => {
            const asyncRoute = asyncHandler(async (req: express.Request, res: express.Response) => {
                await Promise.reject(new AppError('Promise rejected', 400));
            });

            testApp.get('/test', asyncRoute);
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Promise rejected');
        });
    });

    describe('Middleware Integration', () => {
        test('should work together with correlation ID and error handling', async () => {
            const userId = uuidv4();
            const walletId = uuidv4();

            await knex('users').insert({
                id: userId,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com'
            });

            await knex('wallets').insert({
                id: walletId,
                user_id: userId,
                balance: 1000
            });

            testApp.use(correlationIdMiddleware);
            testApp.use(fauxAuth);
            
            testApp.get('/test', (req, res, next) => {
                if (req.query.error === 'true') {
                    const error = new AppError('Test error with correlation', 400);
                    next(error);
                } else {
                    res.json({ 
                        userId: req.authenticatedUser.id,
                        correlationId: req.correlationId
                    });
                }
            });
            
            testApp.use(errorHandler);

            // Test successful request
            const successResponse = await request(testApp).get('/test');
            expect(successResponse.status).toBe(200);
            expect(successResponse.body.userId).toBe(userId);
            expect(successResponse.headers['x-correlation-id']).toBeDefined();

            // Test error handling with correlation
            const errorResponse = await request(testApp).get('/test?error=true');
            expect(errorResponse.status).toBe(400);
            expect(errorResponse.body.message).toBe('Test error with correlation');
            expect(errorResponse.headers['x-correlation-id']).toBeDefined();
        });
    });
});
