import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('wallets', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid()); // Unique identifier, UUID
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE'); // Foreign key reference to users table
        table.decimal('balance', 14, 2).notNullable().defaultTo(0.00); // Balance with two decimal precision
        table.timestamps(true, true); // created_at and updated_at timestamps
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('wallets');
}
