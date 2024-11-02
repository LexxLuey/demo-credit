// src/modules/user/user.validators.ts

import { body } from 'express-validator';

export const validateUserOnboarding = [
    body('first_name')
        .isString().withMessage('First name must be a string')
        .isLength({ min: 1 }).withMessage('First name is required')
        .isLength({ max: 100 }).withMessage('First name must be at most 100 characters')
        .trim().escape(),

    body('middle_name')
        .optional()
        .isString().withMessage('Middle name must be a string')
        .isLength({ max: 100 }).withMessage('Middle name must be at most 100 characters')
        .trim().escape(),

    body('last_name')
        .isString().withMessage('Last name must be a string')
        .isLength({ min: 1 }).withMessage('Last name is required')
        .isLength({ max: 100 }).withMessage('Last name must be at most 100 characters')
        .trim().escape(),

    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
];
