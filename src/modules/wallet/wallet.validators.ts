// src/modules/wallet/wallet.validators.ts

import { body } from 'express-validator';

export const validateAmount = [
    body('amount')
        .isFloat({ gt: 0 }).withMessage('Amount must be greater than zero')
        .isFloat({ lt: 999999999999 }).withMessage('Maximum transaction amount exceeded')
        .toFloat()
];
