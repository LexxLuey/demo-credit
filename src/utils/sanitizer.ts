import validator from 'validator';

export function sanitizeString(input: string): string {
    return validator.escape(input.trim());
}

export function sanitizeEmail(input: string): string {
    return validator.normalizeEmail(input.trim()) || '';
}

export function sanitizeNumber(input: string): number {
    return validator.isNumeric(input) ? Number(input) : 0;
}
