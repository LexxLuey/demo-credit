// src/modules/transaction/transaction.service.ts

import { v4 as uuidv4 } from 'uuid';
import knex from '../../config/knex';
import { Transaction } from './transaction.model';
import { TransactionType } from './interfaces/transaction.interface';

export class TransactionService {
    static async createTransaction(walletId: string, type: TransactionType, amount: number, targetWalletId?: string) {
        const transactionId = uuidv4();

        const newTransaction = new Transaction(transactionId, walletId, type, amount, targetWalletId);

        await knex('transactions').insert({
            id: newTransaction.id,
            wallet_id: newTransaction.walletId,
            type: newTransaction.type,
            amount: newTransaction.amount,
            target_wallet_id: newTransaction.targetWalletId,
            created_at: newTransaction.createdAt,
            updated_at: newTransaction.updatedAt,
        });

        return newTransaction;
    }
}
