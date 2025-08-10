import request from 'supertest';
import express from 'express';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';

describe('Wallet Withdrawal Endpoint', () => {
    let walletId: string;
    let userId: string;
    let testApp: express.Express;

    // Set up the test database
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
    });

    beforeEach(async () => {
        await knex.transaction(async (trx) => {
            await trx('transactions').del();
            await trx('wallets').del();
            await trx('users').del();
        });

        // Generate fresh IDs for each test
        walletId = uuidv4();
        userId = uuidv4();
        // Insert test user and wallet for each test - USER FIRST!
        await knex('users').insert({ id: userId, first_name: 'User', last_name: 'Withdraw', email: 'withdrawuser@example.com' });
        await knex('wallets').insert({ id: walletId, user_id: userId, balance: 1000 });

        // Create isolated app for each test
        testApp = express();
        testApp.use(express.json());
        testApp.use((req, res, next) => {
            req.authenticatedUser = { id: userId, walletId: walletId, first_name: 'User', last_name: 'Withdraw', email: 'withdrawuser@example.com' };
            next();
        });
        const walletRouter = (await import('../wallet.controller')).default;
        testApp.use('/api/wallet', walletRouter);
    });

    afterAll(async () => {
        await knex.destroy();
    });

    test('Successful withdrawal', async () => {
        const response = await request(testApp)
            .post('/api/wallet/withdraw')
            .send({
                walletId: walletId,
                amount: 100,
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Withdrawal successful');
    });

    test('Insufficient funds', async () => {
        const response = await request(testApp)
            .post('/api/wallet/withdraw')
            .send({
                walletId: walletId,
                amount: 10000, // Exceeds balance
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Insufficient funds');
    });

    test('Invalid wallet ID', async () => {
        // Create isolated app with invalid wallet ID
        const invalidApp = express();
        invalidApp.use(express.json());
        invalidApp.use((req, res, next) => {
            req.authenticatedUser = {
                id: userId,
                walletId: 'invalid-wallet-id',
                first_name: 'Test',
                last_name: 'User',
                email: 'testuser@example.com'
            };
            next();
        });
        const walletRouter = (await import('../wallet.controller')).default;
        invalidApp.use('/api/wallet', walletRouter);

        const response = await request(invalidApp)
            .post('/api/wallet/withdraw')
            .send({
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Wallet not found');
    });

    test('Invalid withdrawal amount (negative)', async () => {
        const response = await request(testApp)
            .post('/api/wallet/withdraw')
            .send({
                walletId: walletId,
                amount: -100, // Negative amount
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Amount must be greater than zero' })
            ])
        );
    });
});