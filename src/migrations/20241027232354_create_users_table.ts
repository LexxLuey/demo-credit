import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid()); // Unique identifier, UUID
        table.string('last_name').notNullable(); // User's name
        table.string('middle_name').nullable(); // User's name
        table.string('first_name').notNullable(); // User's name
        table.string('email').unique().notNullable(); // Unique email for each user
        table.timestamps(true, true); // created_at and updated_at timestamps
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('users');
}
