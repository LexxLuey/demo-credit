import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { fakerEN_NG as faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("wallets").del();

    // Fetch all users
    const users = await knex('users').select('id');

    // Insert wallets for each user
    const wallets = users.map(user => ({
        id: uuidv4(),
        user_id: user.id,
        balance: parseFloat(faker.finance.amount({ min: 0, max: 999999, dec: 2 })), // Balance between 0 and 999,999,999 with 2 decimal points
        created_at: new Date(),
        updated_at: new Date(),
    }));

    await knex('wallets').insert(wallets);
};
