// src/modules/user/user.validators.ts

import { body } from 'express-validator';

// Custom sanitization function to remove script tags and dangerous content
const sanitizeInput = (value: string): string => {
    if (typeof value !== 'string') return value;
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
};

// Custom validation for XSS prevention
const validateNoScriptTags = (value: string): boolean => {
    if (typeof value !== 'string') return true;
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i;
    return !scriptPattern.test(value);
};

export const validateUserOnboarding = [
    body('first_name')
        .isString().withMessage('First name must be a string')
        .isLength({ min: 1 }).withMessage('First name is required')
        .isLength({ max: 100 }).withMessage('First name must be at most 100 characters')
        .custom(validateNoScriptTags).withMessage('First name contains invalid content')
        .customSanitizer(sanitizeInput)
        .trim().escape(),

    body('middle_name')
        .optional()
        .isString().withMessage('Middle name must be a string')
        .isLength({ max: 100 }).withMessage('Middle name must be at most 100 characters')
        .custom(validateNoScriptTags).withMessage('Middle name contains invalid content')
        .customSanitizer(sanitizeInput)
        .trim().escape(),

    body('last_name')
        .isString().withMessage('Last name must be a string')
        .isLength({ min: 1 }).withMessage('Last name is required')
        .isLength({ max: 100 }).withMessage('Last name must be at most 100 characters')
        .custom(validateNoScriptTags).withMessage('Last name contains invalid content')
        .customSanitizer(sanitizeInput)
        .trim().escape(),

    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .custom(validateNoScriptTags).withMessage('Email contains invalid content')
        .customSanitizer(sanitizeInput)
];
