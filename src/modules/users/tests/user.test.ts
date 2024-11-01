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

        walletId = uuidv4();

        await knex('users').insert({ id: userId, first_name: 'User', last_name: 'Balance', email: 'balanceuser@example.com' });
        await knex('wallets').insert({ id: walletId, user_id: userId, balance: 300 });

    });

    // afterEach(async () => {
    //     await knex('users').del();
    //     await knex('wallets').del();
    // });

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
        expect(wallet.balance).toBe(0); // Initial balance should be zero
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

        expect(response.status).toBe(400); // Should not onboard the user
        const user = await knex('users').where({ email: 'sarah.smith@example.com' }).first();
        expect(user).toBeUndefined();
    });
});
