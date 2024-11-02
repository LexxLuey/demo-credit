import request from 'supertest';
import app from '../../../app';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';
import { fauxAuth } from '../../../middleware/fauxAuth';


describe('Wallet Transfer Endpoint', () => {
    let senderUserId: string;
    let senderWalletId: string;
    let receiverWalletId: string;

    // Set up the test database
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
        // await knex.seed.run({ directory: './src/seeds' });

        // Create unique user and wallet IDs
        senderUserId = uuidv4();
        const receiverUserId = uuidv4();
        senderWalletId = uuidv4();
        receiverWalletId = uuidv4();

        // Insert test users
        await knex('users').insert([
            { id: senderUserId, first_name: 'Sender', last_name: 'User', email: 'sender@example.com' },
            { id: receiverUserId, first_name: 'Receiver', last_name: 'User', email: 'receiver@example.com' }
        ]);

        // Insert wallets linked to these users
        await knex('wallets').insert([
            { id: senderWalletId, user_id: senderUserId, balance: 500 },
            { id: receiverWalletId, user_id: receiverUserId, balance: 200 }
        ]);

        // Set up faux authenticated user as the sender
        app.use((req, res, next) => {
            req.authenticatedUser = { id: senderUserId, walletId: senderWalletId, first_name: 'Sender', last_name: 'User', email: 'sender@example.com' };
            next();
        });
    });
    beforeEach(() => {
        app.use((req, res, next) => {
            req.authenticatedUser = { id: senderUserId, walletId: senderWalletId, first_name: 'Sender', last_name: 'User', email: 'sender@example.com' };
            next();
        });
    });

    afterAll(async () => {
        await knex.destroy();
    });

    test('Successful transfer', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: receiverWalletId,
                amount: 100,
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Transfer successful');
    });

    test('Catch self-transfer attempt', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: senderWalletId, // Using senderWalletId to simulate self-transfer
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Cannot transfer funds from self to self');
    });

    test('Insufficient funds', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: receiverWalletId,
                amount: 10000, // Exceeds balance
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Insufficient funds');
    });

    test('Invalid receiver wallet', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: 'invalid-receiver-wallet-id',
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Receiver wallet not found');
    });

    test('Invalid sender wallet', async () => {
        const originalAuth = app._router.stack.find((layer: any) => layer.handle === fauxAuth);
        if (originalAuth) originalAuth.handle = (req: any, res: any, next: any) => {
            req.authenticatedUser = {
                id: senderUserId,
                walletId: 'invalid-wallet-id',
                first_name: 'Test',
                last_name: 'User',
                email: 'testuser@example.com'
            };
            next();
        };
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                receiverWalletId: receiverWalletId,
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Sender wallet not found');
    });

    test('Invalid transfer amount (negative)', async () => {
        const response = await request(app)
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
