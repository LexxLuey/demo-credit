import request from 'supertest';
import express from 'express';
import app from '../../../app';

import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';
import { mockAuthMiddleware } from '../../../middleware/mockFauxAuth';
import walletRouter from '../wallet.controller';
import { fauxAuth } from '../../../middleware/fauxAuth';


// const app = express();
// app.use(express.json());

// app.use(mockAuthMiddleware);

// // Prefix all routes with 'api/'
// const apiRouter = express.Router();

// apiRouter.use('/wallet', walletRouter); // Health routes at /api/health

// app.use('/api', apiRouter);

describe('Wallet Balance Inquiry Endpoint', () => {
    let walletId: string;
    const userId = uuidv4();

    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });

        walletId = uuidv4();

        await knex('users').insert({ id: userId, first_name: 'User', last_name: 'Balance', email: 'balanceuser@example.com' });
        await knex('wallets').insert({ id: walletId, user_id: userId, balance: 300 });

        app.use((req, res, next) => {
            req.authenticatedUser = { id: userId, walletId: walletId, first_name: 'User', last_name: 'Balance', email: 'balanceuser@example.com' };
            next();
        });
    });

    beforeEach(() => {
        app.use((req, res, next) => {
            req.authenticatedUser = { id: userId, walletId: walletId, first_name: 'User', last_name: 'Balance', email: 'balanceuser@example.com' };
            next();
        });
    })

    afterAll(async () => {
        await knex.destroy();
    });

    test('Retrieve wallet balance successfully', async () => {
        const response = await request(app)
            .get('/api/wallet/balance')
            .query({ walletId: walletId });

        expect(response.status).toBe(200);
        expect(response.body.balance).toBe(300);
    });

    test('Invalid wallet ID for balance inquiry', async () => {
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
            .get('/api/wallet/balance')
            .query({ walletId: 'invalid-wallet-id' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Wallet not found');
    });
});
