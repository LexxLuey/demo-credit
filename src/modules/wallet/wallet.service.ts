// src/modules/wallet/wallet.service.ts

import knex from '../../config/knex';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError, NotFoundError, InsufficientFundsError } from '../../types/errors';
import logger from '../../utils/logger';
import { QueryBuilder } from '../../utils/queryBuilder';

export class WalletService {

    // Create a wallet for a user
    static async createWalletForUser(userId: string) {
        const walletId = uuidv4();
        await knex('wallets').insert({
            id: walletId,
            user_id: userId,
            balance: 0,
            created_at: new Date(),
            updated_at: new Date()
        });

        logger.info('Wallet created for user', { userId, walletId });
        return walletId;
    }

    // Get wallet balance
    static async getWalletBalance(walletId: string) {
        const wallet = await knex('wallets').where({ id: walletId }).first();
        if (!wallet) throw new NotFoundError('Wallet');
        return Number(wallet.balance);
    }

    // Fund a wallet
    static async fundWallet(walletId: string, amount: number) {
        if (amount <= 0) throw new ValidationError('Fund amount must be greater than zero');

        await knex.transaction(async trx => {
            const wallet = await trx('wallets').where({ id: walletId }).first();
            if (!wallet) throw new NotFoundError('Wallet');

            const newBalance = Number(wallet.balance) + amount;
            await trx('wallets').where({ id: walletId }).update({
                balance: newBalance,
                updated_at: new Date()
            });

            // Record the transaction
            await trx('transactions').insert({
                id: uuidv4(),
                wallet_id: walletId,
                type: 'FUND',
                amount: amount,
                created_at: new Date()
            });
        });

        logger.info('Wallet funded successfully', { walletId, amount });
    }

    // Transfer funds from one wallet to another
    static async transferFunds(senderWalletId: string, receiverWalletId: string, amount: number) {
        if (amount <= 0) throw new ValidationError('Transfer amount must be greater than zero');

        await knex.transaction(async trx => {
            // Fetch wallets
            const [senderWallet, receiverWallet] = await Promise.all([
                trx('wallets').where({ id: senderWalletId }).first(),
                trx('wallets').where({ id: receiverWalletId }).first(),
            ]);
            if (!senderWallet) throw new NotFoundError('Sender wallet');
            if (!receiverWallet) throw new NotFoundError('Receiver wallet');
            if (receiverWallet.id === senderWallet.id) throw new ValidationError('Cannot transfer funds from self to self');

            // Atomic debit with guard: only debit if balance >= amount
            const rowsUpdated = await trx('wallets')
                .where({ id: senderWalletId })
                .andWhere('balance', '>=', amount)
                .update({
                    balance: trx.raw('balance - ?', [amount]),
                    updated_at: new Date(),
                });
            if (rowsUpdated === 0) {
                throw new InsufficientFundsError();
            }

            // Credit receiver
            await trx('wallets')
                .where({ id: receiverWalletId })
                .update({
                    balance: trx.raw('balance + ?', [amount]),
                    updated_at: new Date(),
                });

            // Record transactions
            await trx('transactions').insert([
                {
                    id: uuidv4(),
                    wallet_id: senderWalletId,
                    type: 'TRANSFER',
                    amount: -amount,
                    target_wallet_id: receiverWalletId,
                    created_at: new Date()
                },
                {
                    id: uuidv4(),
                    wallet_id: receiverWalletId,
                    type: 'TRANSFER',
                    amount: amount,
                    target_wallet_id: senderWalletId,
                    created_at: new Date()
                }
            ]);
        });

        logger.info('Funds transferred successfully', { 
            senderWalletId, 
            receiverWalletId, 
            amount 
        });
    }

    // Withdraw funds from a wallet
    static async withdrawFunds(walletId: string, amount: number) {
        if (amount <= 0) throw new ValidationError('Withdrawal amount must be greater than zero');

        await knex.transaction(async trx => {
            const wallet = await trx('wallets').where({ id: walletId }).first();
            if (!wallet) throw new NotFoundError('Wallet');

            const currentBalance = Number(wallet.balance);
            if (currentBalance < amount) throw new InsufficientFundsError();

            const newBalance = currentBalance - amount;
            await trx('wallets').where({ id: walletId }).update({
                balance: newBalance,
                updated_at: new Date()
            });

            // Record the transaction
            await trx('transactions').insert({
                id: uuidv4(),
                wallet_id: walletId,
                type: 'WITHDRAW',
                amount: -amount,
                created_at: new Date()
            });
        });

        logger.info('Funds withdrawn successfully', { walletId, amount });
    }

    static async getTransactionHistory(walletId: string, page: number, limit: number) {
        const wallet = await knex('wallets').where({ id: walletId }).first();
        if (!wallet) throw new NotFoundError('Wallet');        

        // Sanitize and validate input
        const { page: validatedPage, limit: validatedLimit } = QueryBuilder.validatePagination(page, limit);
        const offset = (validatedPage - 1) * validatedLimit;

        // Get transactions for this wallet
        const data = await knex('transactions')
            .where({ wallet_id: walletId })
            .orderBy('created_at', 'desc')
            .limit(validatedLimit)
            .offset(offset);

        // Get total count
        const totalResult = await knex('transactions')
            .where({ wallet_id: walletId })
            .count('* as count')
            .first();
        const total = Number(totalResult?.count) || 0;

        return {
            data,
            page: validatedPage,
            limit: validatedLimit,
            total,
        };
    }

    // Get all wallets with search and pagination
    static async getAllWallets(page: number = 1, limit: number = 10, search?: string): Promise<{
        data: any[];
        page: number;
        limit: number;
        total: number;
    }> {
        // Sanitize and validate input
        const sanitizedSearch = search ? QueryBuilder.sanitizeSearchInput(search) : undefined;
        const { page: validatedPage, limit: validatedLimit } = QueryBuilder.validatePagination(page, limit);

        // Build query using QueryBuilder
        const result = await QueryBuilder.buildPaginatedQuery(
            knex,
            'wallets',
            [
                'wallets.id',
                'wallets.user_id',
                'wallets.balance',
                'wallets.created_at',
                'wallets.updated_at',
                'users.first_name',
                'users.last_name',
                'users.email'
            ],
            {
                search: sanitizedSearch,
                searchConfig: {
                    fields: ['first_name', 'last_name', 'email', 'id'],
                    table: 'users'
                },
                pagination: {
                    page: validatedPage,
                    limit: validatedLimit
                },
                orderBy: { column: 'wallets.created_at', direction: 'desc' },
                joins: [
                    {
                        table: 'users',
                        on: 'wallets.user_id = users.id',
                        type: 'inner'
                    }
                ]
            }
        );

        // Transform data to match expected format
        const wallets = result.data.map(wallet => ({
            id: wallet.id,
            user_id: wallet.user_id,
            balance: wallet.balance,
            created_at: wallet.created_at,
            updated_at: wallet.updated_at,
            user: {
                first_name: wallet.first_name,
                last_name: wallet.last_name,
                email: wallet.email
            }
        }));

        return {
            data: wallets,
            page: result.page,
            limit: result.limit,
            total: result.total
        };
    }
}
