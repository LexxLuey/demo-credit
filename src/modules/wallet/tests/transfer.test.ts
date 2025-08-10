import request from 'supertest';
import express from 'express';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';

describe('Wallet Transfer Endpoint', () => {
    let senderUserId: string;
    let receiverUserId: string;
    let senderWalletId: string;
    let receiverWalletId: string;
    let testApp: express.Express;

    // Set up the test database
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });

        // Create unique user and wallet IDs
        senderUserId = uuidv4();
        receiverUserId = uuidv4();
        senderWalletId = uuidv4();
        receiverWalletId = uuidv4();

        // Create isolated Express app for this test suite
        testApp = express();
        testApp.use(express.json());

        // Set up faux authenticated user as the sender
        testApp.use((req, res, next) => {
            req.authenticatedUser = { id: senderUserId, walletId: senderWalletId, first_name: 'Sender', last_name: 'User', email: 'sender@example.com' };
            next();
        });

        // Import and mount wallet router
        const walletRouter = (await import('../wallet.controller')).default;
        testApp.use('/api/wallet', walletRouter);
    });
    beforeEach(async () => {
        await knex.transaction(async (trx) => {
            await trx('transactions').del();
            await trx('wallets').del();
            await trx('users').del();
        });

        // Insert test users and wallets for each test
        await knex('users').insert([
            { id: senderUserId, first_name: 'Sender', last_name: 'User', email: 'sender@example.com' },
            { id: receiverUserId, first_name: 'Receiver', last_name: 'User', email: 'receiver@example.com' }
        ]);
        await knex('wallets').insert([
            { id: senderWalletId, user_id: senderUserId, balance: 1000 },
            { id: receiverWalletId, user_id: receiverUserId, balance: 500 }
        ]);
    });

    test('Successful transfer', async () => {
        const response = await request(testApp)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: receiverWalletId,
                amount: 100,
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Transfer successful');
    });

    test('Catch self-transfer attempt', async () => {
        const response = await request(testApp)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: senderWalletId, // Using senderWalletId to simulate self-transfer
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Cannot transfer funds from self to self');
    });

    test('Insufficient funds', async () => {
        const response = await request(testApp)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: receiverWalletId,
                amount: 10000, // Exceeds balance
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Insufficient funds');
    });

    test('Invalid receiver wallet', async () => {
        const response = await request(testApp)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: 'invalid-receiver-wallet-id',
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Receiver wallet not found');
    });

    test('Invalid sender wallet', async () => {
        // Create isolated app with invalid wallet ID
        const invalidApp = express();
        invalidApp.use(express.json());
        invalidApp.use((req, res, next) => {
            req.authenticatedUser = {
                id: senderUserId,
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
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: receiverWalletId,
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Sender wallet not found');
    });

    test('Invalid transfer amount (negative)', async () => {
        const response = await request(testApp)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: receiverWalletId,
                amount: -100, // Invalid negative amount
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Amount must be greater than zero' })
            ])
        );
    });
});

describe('Concurrent wallet transfers', () => {
    let senderUserId: string;
    let senderWalletId: string;
    let receiverWalletId: string;
    let localApp: express.Express;
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
        senderUserId = uuidv4();
        const receiverUserId = uuidv4();
        senderWalletId = uuidv4();
        receiverWalletId = uuidv4();
        await knex('users').insert([
            { id: senderUserId, first_name: 'Sender', last_name: 'User', email: 'sender_concurrent@example.com' },
            { id: receiverUserId, first_name: 'Receiver', last_name: 'User', email: 'receiver_concurrent@example.com' }
        ]);
        await knex('wallets').insert([
            { id: senderWalletId, user_id: senderUserId, balance: 600 }, // Reduced to force race condition
            { id: receiverWalletId, user_id: receiverUserId, balance: 100 }
        ]);
        // Build an isolated app for this suite to control auth precisely
        localApp = express();
        localApp.use(express.json());
        localApp.use((req, res, next) => {
            req.authenticatedUser = { id: senderUserId, walletId: senderWalletId, first_name: 'Sender', last_name: 'User', email: 'sender_concurrent@example.com' };
            next();
        });
        const walletRouter = (await import('../wallet.controller')).default;
        localApp.use('/api/wallet', walletRouter);
    });
    test('should handle concurrent transfers safely', async () => {
        const transferPayload = {
            receiverWalletId: receiverWalletId,
            amount: 500
        };
        // Fire two transfers with minimal scheduling gap to increase contention
        const p1 = request(localApp).post('/api/wallet/transfer').send(transferPayload);
        const p2 = request(localApp).post('/api/wallet/transfer').send(transferPayload);
        const [res1, res2] = await Promise.all([p1, p2]);

        // Only one should succeed, the other should fail due to insufficient funds or transfer failure
        const successCount = [res1, res2].filter(r => r.status === 200).length;
        const failCount = [res1, res2].filter(r => r.status === 400 &&
            (r.body.message === 'Insufficient funds' || r.body.message === 'Transfer failed')).length;
        expect(successCount).toBe(1);
        expect(failCount).toBe(1);
    });
});

describe('Extreme value transfer tests', () => {
    let senderUserId: string;
    let senderWalletId: string;
    let receiverWalletId: string;
    let extremeApp: express.Express;
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
        senderUserId = uuidv4();
        const receiverUserId = uuidv4();
        senderWalletId = uuidv4();
        receiverWalletId = uuidv4();
        await knex('users').insert([
            { id: senderUserId, first_name: 'Sender', last_name: 'User', email: 'sender_extreme@example.com' },
            { id: receiverUserId, first_name: 'Receiver', last_name: 'User', email: 'receiver_extreme@example.com' }
        ]);
        await knex('wallets').insert([
            { id: senderWalletId, user_id: senderUserId, balance: 100000000000 },
            { id: receiverWalletId, user_id: receiverUserId, balance: 0 }
        ]);

        // Create isolated app for extreme tests
        extremeApp = express();
        extremeApp.use(express.json());
        extremeApp.use((req, res, next) => {
            req.authenticatedUser = { id: senderUserId, walletId: senderWalletId, first_name: 'Sender', last_name: 'User', email: 'sender_extreme@example.com' };
            next();
        });
        const walletRouter = (await import('../wallet.controller')).default;
        extremeApp.use('/api/wallet', walletRouter);
    });
    test('should reject transfer with amount exceeding allowed maximum', async () => {
        const response = await request(extremeApp)
            .post('/api/wallet/transfer')
            .send({ receiverWalletId, amount: 9999999999990 });
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Maximum transaction amount exceeded' })
            ])
        );
    });
    test('should reject transfer with zero amount', async () => {
        const response = await request(extremeApp)
            .post('/api/wallet/transfer')
            .send({ receiverWalletId, amount: 0 });
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Amount must be greater than zero' })
            ])
        );
    });
});
