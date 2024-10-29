// src/modules/transaction/models/transaction.model.ts

import { BaseModel } from '../shared/models/base.model';
import { ITransaction, TransactionType } from './interfaces/transaction.interface';

export class Transaction extends BaseModel implements ITransaction {
    walletId: string;
    type: TransactionType;
    amount: number;
    targetWalletId?: string;

    constructor(
        id: string,
        walletId: string,
        type: TransactionType,
        amount: number,
        targetWalletId?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
        this.walletId = walletId;
        this.type = type;
        this.amount = amount;
        this.targetWalletId = targetWalletId;
    }
}
