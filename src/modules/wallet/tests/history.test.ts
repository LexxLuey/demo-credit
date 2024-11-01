import request from 'supertest';
import express from 'express';
import app from '../../../app';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';
import walletRouter from '../wallet.controller';
import { mockAuthMiddleware } from '../../../middleware/mockFauxAuth';
import { fauxAuth } from '../../../middleware/fauxAuth';


// const app = express();
// app.use(express.json());

// app.use(mockAuthMiddleware);

// // Prefix all routes with 'api/'
// const apiRouter = express.Router();

// apiRouter.use('/wallet', walletRouter); // Health routes at /api/health

// app.use('/api', apiRouter);


describe('Wallet Transaction History Endpoint', () => {
    let walletId: string;
    const userId = uuidv4();

    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });

        walletId = uuidv4();

        await knex('users').insert({ id: userId, first_name: 'User', last_name: 'Test', email: 'user@example.com' });
        await knex('wallets').insert({ id: walletId, user_id: userId, balance: 1000 });

        // Insert transactions
        await knex('transactions').insert([
            { id: uuidv4(), wallet_id: walletId, type: 'FUND', amount: 100, created_at: new Date() },
            { id: uuidv4(), wallet_id: walletId, type: 'WITHDRAW', amount: -50, created_at: new Date() },
        ]);

        app.use((req, res, next) => {
            req.authenticatedUser = { id: userId, walletId: walletId, first_name: 'Test', last_name: 'User', email: 'testuser@example.com' };
            next();
        });
    });

    afterEach(async () => {
        app.use((req, res, next) => {
            req.authenticatedUser = { id: userId, walletId: walletId, first_name: 'Test', last_name: 'User', email: 'testuser@example.com' };
            next();
        });
    });    

    afterAll(async () => {
        await knex.destroy();
    });

    test('Retrieve paginated transaction history', async () => {
        const response = await request(app)
            .get('/api/wallet/transactions')
            .query({ walletId: walletId, page: 1, limit: 2 });

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(2);
    });

    test('Invalid wallet ID in transaction history', async () => {
        const originalAuth = app._router.stack.find((layer: any) => layer.handle === fauxAuth);
        if (originalAuth) originalAuth.handle = (req: any, res: any, next: any) => {
            req.authenticatedUser = {
                id: userId,
                walletId: 'invalid-wallet-id',
                first_name: 'Test',
                last_name: 'User',
                email: 'testuser@example.com'
            };
            next();
        }; 

        const response = await request(app)
            .get('/api/wallet/transactions')
            .query({ page: 1, limit: 2 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Wallet not found');
    });
});
