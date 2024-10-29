// src/modules/transaction/interfaces/transaction.interface.ts

import { IBaseEntity } from '../../shared/interfaces/base.interface';

// Define transaction types as an enum
export enum TransactionType {
    FUND = 'FUND',
    TRANSFER = 'TRANSFER',
    WITHDRAW = 'WITHDRAW',
}

export interface ITransaction extends IBaseEntity {
    walletId: string;
    type: TransactionType;
    amount: number;
    targetWalletId?: string; // Optional for transfers
}
