import request from 'supertest';
import app from '../../../app';
import knex from '../../../config/knex';
import { v4 as uuidv4 } from 'uuid';
import { fauxAuth } from '../../../middleware/fauxAuth';


describe('Wallet Funding Endpoint', () => {
    let walletId: string;
    const userId = uuidv4();

    // Set up the test database
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });

        // Create a unique user and wallet for testing
        // const userId = uuidv4();
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

    test('Successful funding', async () => {
        const response = await request(app)
            .post('/api/wallet/fund')
            .send({
                amount: 100,
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Wallet funding successful');
    });

    test('Invalid wallet ID', async () => {

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
            .post('/api/wallet/fund')
            .send({
                amount: 100,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Wallet not found');
    });

    test('Invalid funding amount (negative)', async () => {
        const response = await request(app)
            .post('/api/wallet/fund')
            .send({
                amount: -100, // Negative amount
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Amount must be greater than zero' })
            ])
        );
    });

    test('Maximum transaction amount', async () => {
        const response = await request(app)
            .post('/api/wallet/fund')
            .send({
                amount: 9999999999990,
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Maximum transaction amount exceeded' })
            ])
        );
    });
});