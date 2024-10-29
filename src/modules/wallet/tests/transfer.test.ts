import request from 'supertest';
import app from '../../../app';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';

describe('Wallet Transfer Endpoint', () => {
    let senderWalletId: string;
    let receiverWalletId: string;

    // Set up the test database
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
        await knex.seed.run({ directory: './src/seeds' });

        // Create unique user and wallet IDs
        const senderUserId = uuidv4();
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
    });

    afterAll(async () => {
        await knex.destroy();
    });

    test('Successful transfer', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                senderWalletId: senderWalletId,
                receiverWalletId: receiverWalletId,
                amount: 100,
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Transfer successful');
    });

    test('Insufficient funds', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                senderWalletId: senderWalletId,
                receiverWalletId: receiverWalletId,
                amount: 10000, // Exceeds balance
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Insufficient funds');
    });

    test('Invalid sender wallet', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                senderWalletId: 'invalid-sender-wallet-id',
                receiverWalletId: receiverWalletId,
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Sender wallet not found');
    });

    test('Invalid receiver wallet', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                senderWalletId: senderWalletId,
                receiverWalletId: 'invalid-receiver-wallet-id',
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Receiver wallet not found');
    });

    test('Invalid transfer amount (negative)', async () => {
        const response = await request(app)
            .post('/api/wallet/transfer')
            .send({
                senderWalletId: senderWalletId,
                receiverWalletId: receiverWalletId,
                amount: -100, // Invalid negative amount
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Transfer amount must be greater than zero');
    });
});


