import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Add indexes for users table
    await knex.schema.alterTable('users', (table) => {
        table.index(['email'], 'idx_users_email');
        table.index(['first_name', 'last_name'], 'idx_users_name');
        table.index(['created_at'], 'idx_users_created_at');
    });

    // Add indexes for wallets table
    await knex.schema.alterTable('wallets', (table) => {
        table.index(['user_id'], 'idx_wallets_user_id');
        table.index(['balance'], 'idx_wallets_balance');
        table.index(['created_at'], 'idx_wallets_created_at');
    });

    // Add indexes for transactions table
    await knex.schema.alterTable('transactions', (table) => {
        table.index(['wallet_id'], 'idx_transactions_wallet_id');
        table.index(['type'], 'idx_transactions_type');
        table.index(['created_at'], 'idx_transactions_created_at');
        table.index(['target_wallet_id'], 'idx_transactions_target_wallet_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    // Remove indexes from transactions table
    await knex.schema.alterTable('transactions', (table) => {
        table.dropIndex(['wallet_id'], 'idx_transactions_wallet_id');
        table.dropIndex(['type'], 'idx_transactions_type');
        table.dropIndex(['created_at'], 'idx_transactions_created_at');
        table.dropIndex(['target_wallet_id'], 'idx_transactions_target_wallet_id');
    });

    // Remove indexes from wallets table
    await knex.schema.alterTable('wallets', (table) => {
        table.dropIndex(['user_id'], 'idx_wallets_user_id');
        table.dropIndex(['balance'], 'idx_wallets_balance');
        table.dropIndex(['created_at'], 'idx_wallets_created_at');
    });

    // Remove indexes from users table
    await knex.schema.alterTable('users', (table) => {
        table.dropIndex(['email'], 'idx_users_email');
        table.dropIndex(['first_name', 'last_name'], 'idx_users_name');
        table.dropIndex(['created_at'], 'idx_users_created_at');
    });
} 