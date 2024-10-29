// src/modules/wallet/interfaces/wallet.interface.ts

import { IBaseEntity } from '../../shared/interfaces/base.interface';

export interface IWallet extends IBaseEntity {
    userId: string;
    balance: number;
}
