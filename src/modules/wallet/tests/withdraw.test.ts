import request from 'supertest';
import app from '../../../app';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';


describe('Wallet Withdrawal Endpoint', () => {
    let walletId: string;

    // Set up the test database
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
        await knex.seed.run({ directory: './src/seeds' });

        // Create a unique user and wallet for testing
        const userId = uuidv4();
        walletId = uuidv4();

        // Insert test user and wallet
        await knex('users').insert({
            id: userId,
            first_name: 'Test',
            last_name: 'User',
            email: 'testuser@example.com'
        });

        await knex('wallets').insert({
            id: walletId,
            user_id: userId,
            balance: 500 // Initial balance for testing
        });
    });

    // afterEach(async () => {
    //     // Clear transaction table to avoid interference between tests
    //     await knex('transactions').del();
    // });

    afterAll(async () => {
        await knex.destroy();
    });

    test('Successful withdrawal', async () => {
        const response = await request(app)
            .post('/api/wallet/withdraw')
            .send({
                walletId: walletId,
                amount: 100,
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Withdrawal successful');
    });

    test('Insufficient funds', async () => {
        const response = await request(app)
            .post('/api/wallet/withdraw')
            .send({
                walletId: walletId,
                amount: 10000, // Exceeds balance
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Insufficient funds');
    });

    test('Invalid wallet ID', async () => {
        const response = await request(app)
            .post('/api/wallet/withdraw')
            .send({
                walletId: 'invalid-wallet-id',
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Wallet not found');
    });

    test('Invalid withdrawal amount (negative)', async () => {
        const response = await request(app)
            .post('/api/wallet/withdraw')
            .send({
                walletId: walletId,
                amount: -100, // Negative amount
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Withdrawal amount must be greater than zero');
    });
});