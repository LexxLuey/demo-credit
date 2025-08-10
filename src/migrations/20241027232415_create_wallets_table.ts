import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('wallets', (table) => {
        table.uuid('id').primary(); // Unique identifier, UUID
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE'); // Foreign key reference to users table
        // Use decimal for MySQL; in sqlite it maps to TEXT/NUMERIC, tests ensure numeric inputs
        table.decimal('balance', 14, 2).notNullable().defaultTo(0.00); // Balance with two decimal precision
        table.timestamps(true, true); // created_at and updated_at timestamps
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('wallets');
}
