import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { fakerEN_NG as faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries in users table
    await knex('users').del();

    const users = [];
    const emails = new Set<string>(); // Set to track unique emails

    for (let i = 0; i < 1000; i++) {
        let email;
        // Generate a unique email for each user
        do {
            email = faker.internet.email();
        } while (emails.has(email));

        emails.add(email); // Add the unique email to the Set

        users.push({
            id: uuidv4(),
            last_name: faker.person.firstName(),
            middle_name: faker.person.middleName(),
            first_name: faker.person.lastName(),
            email,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    // Insert sample users
    await knex('users').insert(users);
}
