import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('transactions', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid()); // Unique identifier, UUID
        table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('CASCADE'); // Foreign key reference to wallets table
        table.enu('type', ['FUND', 'TRANSFER', 'WITHDRAW']).notNullable(); // Enum for transaction types
        table.decimal('amount', 14, 2).notNullable(); // Transaction amount with two decimal precision
        table.uuid('target_wallet_id').nullable().references('id').inTable('wallets').onDelete('SET NULL'); // Optional: Target wallet for transfers
        table.timestamps(true, true); // created_at and updated_at timestamps
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('transactions');
}
