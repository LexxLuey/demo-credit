// src/modules/wallet/models/wallet.model.ts

import { BaseModel } from '../shared/models/base.model';
import { IWallet } from './interfaces/wallet.interface';

export class Wallet extends BaseModel implements IWallet {
    userId: string;
    balance: number;

    constructor(id: string, userId: string, balance: number, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this.userId = userId;
        this.balance = balance;
    }
}
