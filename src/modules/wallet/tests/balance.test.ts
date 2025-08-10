import request from 'supertest';
import express from 'express';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';

describe('Wallet Balance Inquiry Endpoint', () => {
    let walletId: string;
    let userId: string;
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

        // Generate fresh IDs for each test
        walletId = uuidv4();
        userId = uuidv4();

        // Insert test user and wallet for each test - USER FIRST!
        await knex('users').insert({ id: userId, first_name: 'User', last_name: 'Balance', email: 'balanceuser@example.com' });
        await knex('wallets').insert({ id: walletId, user_id: userId, balance: 300 });

        // Create isolated app for each test
        testApp = express();
        testApp.use(express.json());
        testApp.use((req, res, next) => {
            req.authenticatedUser = { id: userId, walletId: walletId, first_name: 'User', last_name: 'Balance', email: 'balanceuser@example.com' };
            next();
        });
        const walletRouter = (await import('../wallet.controller')).default;
        testApp.use('/api/wallet', walletRouter);
    });

    afterAll(async () => {
        await knex.destroy();
    });

    test('Retrieve wallet balance successfully', async () => {
        const response = await request(testApp)
            .get('/api/wallet/balance')
            .query({ walletId: walletId });

        expect(response.status).toBe(200);
        expect(Number(response.body.balance)).toBe(300);
    });

    test('Invalid wallet ID for balance inquiry', async () => {
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
            .get('/api/wallet/balance')
            .query({ walletId: 'invalid-wallet-id' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Wallet not found');
    });
});
