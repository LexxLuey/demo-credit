// src/modules/wallet/wallet.service.ts

import knex from '../../config/knex';
import { IWallet } from './interfaces/wallet.interface';
import { Wallet } from './wallet.model';
import { v4 as uuidv4 } from 'uuid';
import { TransactionType } from '../transactions/interfaces/transaction.interface';

export class WalletService {
    // Create a wallet with initial balance for a user
    static async createWalletForUser(userId: string): Promise<IWallet> {
        const walletId = uuidv4();
        const newWallet: IWallet = new Wallet(walletId, userId, 0);

        await knex('wallets').insert({
            id: newWallet.id,
            user_id: newWallet.userId,
            balance: 0,
            created_at: newWallet.createdAt,
            updated_at: newWallet.updatedAt
        });
        return newWallet;
    }

    static async fundWallet(walletId: string, amount: number) {
        await knex.transaction(async trx => {
            // Fetch wallet
            const wallet = await trx('wallets').where({ id: walletId }).first();
            if (!wallet) throw new Error('Wallet not found');

            // Update wallet balance
            const updatedBalance = Number(wallet.balance) + Number(amount);

            await trx('wallets').where({ id: walletId }).update({
                balance: updatedBalance,
                updated_at: new Date(),
            });

            // Insert transaction record directly
            const transactionId = uuidv4();
            await trx('transactions').insert({
                id: transactionId,
                wallet_id: walletId,
                type: TransactionType.FUND,
                amount: amount,
                target_wallet_id: null, // No target wallet for FUND transactions
                created_at: new Date(),
                updated_at: new Date(),
            });
        });

        // Return updated wallet
        const wallet = await knex('wallets').where({ id: walletId }).first();
        return {...wallet, message: 'Wallet funding successful' }
    }

    // Transfer funds from one wallet to another
    static async transferFunds(senderWalletId: string, receiverWalletId: string, amount: number) {
        if (amount <= 0) throw new Error('Transfer amount must be greater than zero');

        await knex.transaction(async trx => {
            // Fetch sender wallet
            const senderWallet = await trx('wallets').where({ id: senderWalletId }).first();
            if (!senderWallet) throw new Error('Sender wallet not found');

            // Fetch receiver wallet
            const receiverWallet = await trx('wallets').where({ id: receiverWalletId }).first();
            if (!receiverWallet) throw new Error('Receiver wallet not found');
            
            if (receiverWallet.id === senderWallet.id) throw new Error('Cannot transfer funds from self to self');

            // Check sufficient funds
            const senderBalance = Number(senderWallet.balance)
            const receiverBalance = Number(receiverWallet.balance)

            if (senderBalance < amount) throw new Error('Insufficient funds');

            // Update sender's wallet balance
            const updatedSenderBalance = senderBalance - amount;
            await trx('wallets').where({ id: senderWalletId }).update({
                balance: updatedSenderBalance,
                updated_at: new Date(),
            });

            // Update receiver's wallet balance
            const updatedReceiverBalance = receiverBalance + amount;
            await trx('wallets').where({ id: receiverWalletId }).update({
                balance: updatedReceiverBalance,
                updated_at: new Date(),
            });

            // Record the transaction for sender
            await trx('transactions').insert({
                id: uuidv4(),
                wallet_id: senderWalletId,
                type: TransactionType.TRANSFER,
                amount: -amount, // Negative amount indicates debit
                target_wallet_id: receiverWalletId,
                created_at: new Date(),
                updated_at: new Date(),
            });

            // Record the transaction for receiver
            await trx('transactions').insert({
                id: uuidv4(),
                wallet_id: receiverWalletId,
                type: TransactionType.TRANSFER,
                amount: amount, // Positive amount indicates credit
                target_wallet_id: senderWalletId,
                created_at: new Date(),
                updated_at: new Date(),
            });
        });

        // Return the result for confirmation
        return { message: 'Transfer successful', amount, senderWalletId, receiverWalletId };
    }

    static async withdrawFunds(walletId: string, amount: number) {
        if (amount <= 0) throw new Error('Withdrawal amount must be greater than zero');

        await knex.transaction(async trx => {
            // Fetch the wallet
            const wallet = await trx('wallets').where({ id: walletId }).first();
            if (!wallet) throw new Error('Wallet not found');

            // Check sufficient balance
            if (wallet.balance < amount) throw new Error('Insufficient funds');

            // Update wallet balance
            const updatedBalance = wallet.balance - amount;
            await trx('wallets').where({ id: walletId }).update({
                balance: updatedBalance,
                updated_at: new Date(),
            });

            // Record the transaction as a withdrawal
            await trx('transactions').insert({
                id: uuidv4(),
                wallet_id: walletId,
                type: TransactionType.WITHDRAW,
                amount: -amount, // Negative amount to represent withdrawal
                target_wallet_id: null, // No target wallet for withdrawal
                created_at: new Date(),
                updated_at: new Date(),
            });
        });

        // Return success response
        return { message: 'Withdrawal successful', walletId, amount };
    }

    static async getTransactionHistory(walletId: string, page: number, limit: number) {
        const offset = (page - 1) * limit;
        const wallet = await knex('wallets').where({ id: walletId }).first();
        if (!wallet) throw new Error('Wallet not found');        

        // Fetch transactions with pagination
        const transactions = await knex('transactions')
            .where({ wallet_id: walletId })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);

        const total = await knex('transactions').where({ wallet_id: walletId }).count('* as count').first();

        return {
            data: transactions,
            page,
            limit,
            total: total?.count || 0,
        };
    }

    static async getBalance(walletId: string) {
        const wallet = await knex('wallets').where({ id: walletId }).first();
        if (!wallet) throw new Error('Wallet not found');
        return Number(wallet.balance);
    }

    static async getWalletId(userId: string) {
        const wallet = await knex('wallets').where({ user_id: userId }).first();
        if (!wallet) throw new Error('Wallet not found');
        return wallet.id;
    }

}
