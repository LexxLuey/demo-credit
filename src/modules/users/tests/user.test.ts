import request from 'supertest';
import app from '../../../app';
import knex from '../../../config/knex';
import { UserService } from '../user.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('User Onboarding', () => {
    let walletId: string;
    const userId = uuidv4();

    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
    });

    beforeEach(async () => {
        await knex.transaction(async (trx) => {
            await trx('transactions').del();
            await trx('wallets').del();
            await trx('users').del();
        });
        // Create seed data with unique email for each test run
        const seedUserId = uuidv4();
        const seedWalletId = uuidv4();
        const uniqueEmail = `balanceuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
        
        // Insert test user and wallet for balance tests - USER FIRST!
        await knex('users').insert({ id: seedUserId, first_name: 'User', last_name: 'Balance', email: uniqueEmail });
        await knex('wallets').insert({ id: seedWalletId, user_id: seedUserId, balance: 300 });
    });

    afterAll(async () => {
        await knex.destroy();
        jest.clearAllMocks();
    });

    test('Onboard new user successfully when not blacklisted', async () => {
        // Mock Karma API to return 404 (user not blacklisted)
        mockedAxios.get.mockResolvedValueOnce({ status: 404 });

        const response = await request(app)
            .post('/api/users')
            .send({
                first_name: 'John',
                middle_name: 'Middle',
                last_name: 'Doe',
                email: 'john.doe@example.com'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');

        // Check if the wallet was created
        const userId = response.body.id;
        const wallet = await knex('wallets').where({ user_id: userId }).first();
        expect(wallet).toBeDefined();
        expect(Number(wallet.balance)).toBe(0); // Initial balance should be zero
    });

    test('Reject user onboarding when blacklisted', async () => {
        // Mock Karma API to return 200 (user is blacklisted)
        const mockData = {
            "status": "success",
            "message": "Successful",
            "data": {
                "karma_identity": "jane.doe@example.com",
                "amount_in_contention": "0.00",
                "reason": null,
                "default_date": "2020-05-18",
                "karma_type": {
                    "karma": "Others"
                },
                "karma_identity_type": {
                    "identity_type": "Domain"
                },
                "reporting_entity": {
                    "name": "Blinkcash",
                    "email": "support@blinkcash.ng"
                }
            },
            "meta": {
                "cost": 10,
                "balance": 1600
            }
        }
        mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await UserService.checkCustomerKarma('jane.doe@example.com');

        expect(result).toBe(true);

        // Ensure no user entry was created
        const user = await knex('users').where({ email: 'jane.doe@example.com' }).first();
        expect(user).toBeUndefined();
    });

    test('Handles error when blacklist service is unavailable', async () => {
        // Mock Karma API to throw an error
        mockedAxios.get.mockRejectedValueOnce(new Error('Service Unavailable'));

        const response = await request(app)
            .post('/api/users')
            .send({
                first_name: 'Sarah',
                middle_name: 'Ann',
                last_name: 'Smith',
                email: 'sarah.smith@example.com'
            });

        // When service is unavailable, we should still allow onboarding
        // but log the issue for monitoring
        expect(response.status).toBe(201); // User should be created successfully
        const user = await knex('users').where({ email: 'sarah.smith@example.com' }).first();
        expect(user).toBeDefined();
        expect(user?.email).toBe('sarah.smith@example.com');
    });

    test('Rejects onboarding with invalid email format', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                first_name: 'Invalid',
                middle_name: 'User',
                last_name: 'Email',
                email: 'invalid-email-format'
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Invalid email format' })
            ])
        );
    });

    test('Rejects onboarding with script tags in first_name', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                first_name: '<script>alert("hack")</script>',
                middle_name: 'Middle',
                last_name: 'Doe',
                email: 'script.hacker@example.com'
            });
    
        expect(response.status).toBe(400);
    });

    test('Rejects onboarding when required fields are missing', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                email: 'missing.fields@example.com'
            });
    
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'First name is required' }),
                expect.objectContaining({ msg: 'Last name is required' })
            ])
        );
    });

    test('Rejects onboarding when first_name exceeds max length', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                first_name: 'A'.repeat(300), // Excessive length
                middle_name: 'Middle',
                last_name: 'Doe',
                email: 'longname@example.com'
            });
    
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'First name must be at most 100 characters' })
            ])
        );
    });
    

});
