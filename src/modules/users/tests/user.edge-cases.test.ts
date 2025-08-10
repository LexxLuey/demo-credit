import request from 'supertest';
import app from '../../../app';
import knex from '../../../config/knex';
import { UserService } from '../user.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('User Service Edge Cases and Branch Coverage', () => {
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
    });

    beforeEach(async () => {
        await knex.transaction(async (trx) => {
            await trx('transactions').del();
            await trx('wallets').del();
            await trx('users').del();
        });
    });

    afterAll(async () => {
        await knex.destroy();
        jest.clearAllMocks();
    });

    describe('UserService.checkCustomerKarma edge cases', () => {
        test('should handle axios timeout error', async () => {
            // Mock timeout error
            const timeoutError = new Error('timeout of 10000ms exceeded');
            timeoutError.name = 'AxiosError';
            mockedAxios.get.mockRejectedValueOnce(timeoutError);

            const result = await UserService.checkCustomerKarma('timeout@example.com');

            expect(result).toBe(false); // Should allow onboarding on service failure
        });

        test('should handle network error', async () => {
            // Mock network error
            const networkError = new Error('Network Error');
            networkError.name = 'AxiosError';
            mockedAxios.get.mockRejectedValueOnce(networkError);

            const result = await UserService.checkCustomerKarma('network@example.com');

            expect(result).toBe(false); // Should allow onboarding on service failure
        });

        test('should handle unexpected HTTP status codes', async () => {
            // Mock 500 server error response
            mockedAxios.get.mockRejectedValueOnce({
                response: {
                    status: 500,
                    data: { message: 'Internal Server Error' }
                }
            });

            const result = await UserService.checkCustomerKarma('server-error@example.com');

            expect(result).toBe(false); // Should allow onboarding on service failure
        });

        test('should handle non-Error objects thrown', async () => {
            // Mock throwing a string instead of Error object
            mockedAxios.get.mockRejectedValueOnce('Unknown error string');

            const result = await UserService.checkCustomerKarma('string-error@example.com');

            expect(result).toBe(false); // Should allow onboarding on service failure
        });

        test('should handle axios response with undefined status', async () => {
            // Mock response without status
            mockedAxios.get.mockResolvedValueOnce({ data: {} } as any);

            const result = await UserService.checkCustomerKarma('no-status@example.com');

            expect(result).toBe(false); // Should treat as not blacklisted
        });
    });

    describe('UserService.onboardUser edge cases', () => {
        test('should handle blacklist error during onboarding', async () => {
            // Mock blacklisted user
            mockedAxios.get.mockResolvedValueOnce({ status: 200 });

            await expect(
                UserService.onboardUser('Jane', 'Doe', 'blacklisted@example.com', 'Middle')
            ).rejects.toThrow('User is blacklisted');
        });

        // This test is skipped as it destroys database connection
        test.skip('should handle database insertion error', async () => {
            // Mock successful blacklist check
            mockedAxios.get.mockResolvedValueOnce({ status: 404 });

            // Close database connection to force error
            await knex.destroy();

            await expect(
                UserService.onboardUser('Test', 'User', 'db-error@example.com')
            ).rejects.toThrow();
        });

        test('should successfully onboard user without middle name', async () => {
            // Mock successful blacklist check
            mockedAxios.get.mockResolvedValueOnce({ status: 404 });

            const user = await UserService.onboardUser('Test', 'User', 'no-middle@example.com');

            expect(user).toBeDefined();
            expect(user.middle_name).toBeUndefined();
            expect(user.email).toBe('no-middle@example.com');
        });

        test('should handle duplicate email error', async () => {
            // Mock successful blacklist check
            mockedAxios.get.mockResolvedValueOnce({ status: 404 });

            // Create a user first
            await UserService.onboardUser('First', 'User', 'duplicate@example.com');
            
            // Mock blacklist check again for second attempt
            mockedAxios.get.mockResolvedValueOnce({ status: 404 });

            // Try to create another user with same email - should fail due to unique constraint
            await expect(
                UserService.onboardUser('Second', 'User', 'duplicate@example.com')
            ).rejects.toThrow();
        });
    });

    describe('UserService.getAllUsers edge cases', () => {
        test('should handle search with undefined parameter', async () => {
            // Create test users
            const userId1 = uuidv4();
            const userId2 = uuidv4();
            
            await knex('users').insert([
                { id: userId1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
                { id: userId2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
            ]);

            const result = await UserService.getAllUsers(1, 10, undefined);

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        test('should handle search with empty string', async () => {
            // Create test users
            const userId1 = uuidv4();
            
            await knex('users').insert([
                { id: userId1, first_name: 'Empty', last_name: 'Search', email: 'empty@example.com' }
            ]);

            const result = await UserService.getAllUsers(1, 10, '');

            expect(result.data).toHaveLength(1);
        });

        test('should handle invalid page and limit parameters', async () => {
            const result = await UserService.getAllUsers(-1, 0);

            expect(result.page).toBe(1); // Should default to 1
            expect(result.limit).toBe(10); // 0 becomes 10 due to || 10 fallback
        });

        test('should handle excessive limit parameter', async () => {
            const result = await UserService.getAllUsers(1, 500);

            expect(result.limit).toBe(100); // Should cap at 100
        });

        test('should handle search with special characters', async () => {
            // Create test user
            const userId1 = uuidv4();
            await knex('users').insert([
                { id: userId1, first_name: 'Special', last_name: 'User', email: 'special@example.com' }
            ]);

            const result = await UserService.getAllUsers(1, 10, 'special<>');

            expect(result.data).toHaveLength(1); // Search should be sanitized and work
        });
    });

    describe('API endpoint edge cases', () => {
        test('should handle missing required fields in user creation', async () => {
            // Create a user for authentication
            const userId = uuidv4();
            const walletId = uuidv4();
            await knex('users').insert({ id: userId, first_name: 'Auth', last_name: 'User', email: 'auth1@example.com' });
            await knex('wallets').insert({ id: walletId, user_id: userId, balance: 0 });
            
            const response = await request(app)
                .post('/api/users')
                .send({
                    first_name: 'John'
                    // Missing last_name and email
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        test('should handle empty JSON body', async () => {
            // Create a user for authentication
            const userId = uuidv4();
            const walletId = uuidv4();
            await knex('users').insert({ id: userId, first_name: 'Auth', last_name: 'User', email: 'auth2@example.com' });
            await knex('wallets').insert({ id: walletId, user_id: userId, balance: 0 });
            
            const response = await request(app)
                .post('/api/users')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        test('should handle malformed JSON', async () => {
            // Create a user for authentication
            const userId = uuidv4();
            const walletId = uuidv4();
            await knex('users').insert({ id: userId, first_name: 'Auth', last_name: 'User', email: 'auth3@example.com' });
            await knex('wallets').insert({ id: walletId, user_id: userId, balance: 0 });
            
            const response = await request(app)
                .post('/api/users')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}');

            expect(response.status).toBe(500); // JSON parse error gives 500
        });

        test('should handle GET users with invalid query parameters', async () => {
            // Create a user for authentication
            const userId = uuidv4();
            const walletId = uuidv4();
            await knex('users').insert({ id: userId, first_name: 'Auth', last_name: 'User', email: 'auth4@example.com' });
            await knex('wallets').insert({ id: walletId, user_id: userId, balance: 0 });
            
            const response = await request(app)
                .get('/api/users')
                .query({
                    page: 'invalid',
                    limit: 'invalid',
                    search: 'test'
                });

            expect(response.status).toBe(200); // Should still work with defaults
            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(10);
        });

        test('should handle correlation ID in headers', async () => {
            // Create a user first for authentication
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
                balance: 0
            });
            
            const correlationId = uuidv4();
            
            const response = await request(app)
                .get('/api/health')
                .set('X-Correlation-ID', correlationId);

            expect(response.status).toBe(200);
            expect(response.headers['x-correlation-id']).toBe(correlationId);
        });

        test('should generate correlation ID when not provided', async () => {
            // Create a user first for authentication
            const userId = uuidv4();
            const walletId = uuidv4();
            
            await knex('users').insert({
                id: userId,
                first_name: 'Test',
                last_name: 'User',
                email: 'test2@example.com'
            });
            
            await knex('wallets').insert({
                id: walletId,
                user_id: userId,
                balance: 0
            });
            
            const response = await request(app)
                .get('/api/health');

            expect(response.status).toBe(200);
            expect(response.headers['x-correlation-id']).toBeDefined();
            expect(response.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });
    });
});
