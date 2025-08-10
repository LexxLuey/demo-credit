import { QueryBuilder } from '../queryBuilder';
import knex from '../../config/knex';
import { v4 as uuidv4 } from 'uuid';

describe('QueryBuilder Utility Tests', () => {
    beforeAll(async () => {
        await knex.migrate.latest({ directory: './src/migrations' });
    });

    beforeEach(async () => {
        await knex.transaction(async (trx) => {
            await trx('transactions').del();
            await trx('wallets').del();
            await trx('users').del();
        });
    });

    afterAll(async () => {
        await knex.destroy();
    });

    describe('sanitizeSearchInput', () => {
        test('should handle non-string input', () => {
            expect(QueryBuilder.sanitizeSearchInput(null as any)).toBe('');
            expect(QueryBuilder.sanitizeSearchInput(undefined as any)).toBe('');
            expect(QueryBuilder.sanitizeSearchInput(123 as any)).toBe('');
            expect(QueryBuilder.sanitizeSearchInput([] as any)).toBe('');
            expect(QueryBuilder.sanitizeSearchInput({} as any)).toBe('');
        });

        test('should remove angle brackets (HTML tag markers)', () => {
            const input = '<script>alert("xss")</script>test<div>content</div>';
            const result = QueryBuilder.sanitizeSearchInput(input);
            expect(result).toBe('scriptalert(xss)/scripttestdivcontent/div'); // Only < and > are removed
        });

        test('should remove quotes and backslashes', () => {
            const input = 'test"value\'with\\backslash';
            const result = QueryBuilder.sanitizeSearchInput(input);
            expect(result).toBe('testvaluewithbackslash');
        });

        test('should trim whitespace', () => {
            const input = '  test value  ';
            const result = QueryBuilder.sanitizeSearchInput(input);
            expect(result).toBe('test value');
        });

        test('should limit length to 100 characters', () => {
            const input = 'a'.repeat(150);
            const result = QueryBuilder.sanitizeSearchInput(input);
            expect(result.length).toBe(100);
        });

        test('should handle empty string', () => {
            const result = QueryBuilder.sanitizeSearchInput('');
            expect(result).toBe('');
        });
    });

    describe('validatePagination', () => {
        test('should handle negative page numbers', () => {
            const result = QueryBuilder.validatePagination(-5, 10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        test('should handle zero page numbers', () => {
            const result = QueryBuilder.validatePagination(0, 10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        test('should handle decimal page numbers', () => {
            const result = QueryBuilder.validatePagination(2.7, 10);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(10);
        });

        test('should handle negative limit', () => {
            const result = QueryBuilder.validatePagination(1, -10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(1);
        });

        test('should handle zero limit', () => {
            const result = QueryBuilder.validatePagination(1, 0);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10); // 0 becomes 10 due to || 10 fallback
        });

        test('should cap limit at 100', () => {
            const result = QueryBuilder.validatePagination(1, 500);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(100);
        });

        test('should handle decimal limit', () => {
            const result = QueryBuilder.validatePagination(1, 15.7);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(15);
        });

        test('should handle null/undefined values', () => {
            const result = QueryBuilder.validatePagination(null as any, undefined as any);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });
    });

    describe('buildSearchCondition', () => {
        test('should handle empty search string', () => {
            const config = {
                fields: ['name', 'email']
            };

            const query = knex('users').select('*');
            const modifiedQuery = QueryBuilder.buildSearchCondition('', config)(query);

            // Should return the same query without modification - just check SQL and bindings
            expect(modifiedQuery.toSQL().sql).toBe(query.toSQL().sql);
            expect(modifiedQuery.toSQL().bindings).toEqual(query.toSQL().bindings);
        });

        test('should handle search without table prefix', () => {
            const config = {
                fields: ['name', 'email']
            };

            const query = knex('users').select('*');
            const modifiedQuery = QueryBuilder.buildSearchCondition('test', config)(query);

            expect(modifiedQuery.toSQL().sql).toContain('where');
            expect(modifiedQuery.toSQL().sql).toContain('like');
        });

        test('should handle search with table prefix', () => {
            const config = {
                fields: ['name', 'email'],
                table: 'users'
            };

            const query = knex('users').select('*');
            const modifiedQuery = QueryBuilder.buildSearchCondition('test', config)(query);

            expect(modifiedQuery.toSQL().sql).toContain('`users`.`name`');
            expect(modifiedQuery.toSQL().sql).toContain('`users`.`email`');
        });

        test('should handle single field search', () => {
            const config = {
                fields: ['name']
            };

            const query = knex('users').select('*');
            const modifiedQuery = QueryBuilder.buildSearchCondition('test', config)(query);

            expect(modifiedQuery.toSQL().sql).toContain('where');
            expect(modifiedQuery.toSQL().bindings).toContain('%test%');
        });

        test('should handle multiple fields search', () => {
            const config = {
                fields: ['name', 'email', 'description']
            };

            const query = knex('users').select('*');
            const modifiedQuery = QueryBuilder.buildSearchCondition('test', config)(query);

            expect(modifiedQuery.toSQL().sql).toContain('or');
            expect(modifiedQuery.toSQL().bindings.length).toBe(3);
        });
    });

    describe('buildPaginatedQuery', () => {
        beforeEach(async () => {
            // Insert test data
            const userIds = [uuidv4(), uuidv4(), uuidv4()];
            const walletIds = [uuidv4(), uuidv4(), uuidv4()];

            await knex('users').insert([
                { id: userIds[0], first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
                { id: userIds[1], first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
                { id: userIds[2], first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com' }
            ]);

            await knex('wallets').insert([
                { id: walletIds[0], user_id: userIds[0], balance: 100 },
                { id: walletIds[1], user_id: userIds[1], balance: 200 },
                { id: walletIds[2], user_id: userIds[2], balance: 300 }
            ]);
        });

        test('should handle basic pagination without search', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    pagination: { page: 1, limit: 2 }
                }
            );

            expect(result.data.length).toBe(2);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(2);
            expect(result.total).toBe(3);
        });

        test('should handle pagination with search', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    search: 'john',
                    searchConfig: {
                        fields: ['first_name', 'last_name', 'email']
                    },
                    pagination: { page: 1, limit: 10 }
                }
            );

            expect(result.data.length).toBe(2); // John Doe and Bob Johnson
            expect(result.total).toBe(2);
        });

        test('should handle pagination with ordering', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    pagination: { page: 1, limit: 10 },
                    orderBy: { column: 'first_name', direction: 'asc' }
                }
            );

            expect(result.data.length).toBe(3);
            expect(result.data[0].first_name).toBe('Bob');
            expect(result.data[1].first_name).toBe('Jane');
            expect(result.data[2].first_name).toBe('John');
        });

        test('should handle pagination with joins', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['users.id', 'users.first_name', 'wallets.balance'],
                {
                    pagination: { page: 1, limit: 10 },
                    joins: [
                        { table: 'wallets', on: 'users.id = wallets.user_id' }
                    ]
                }
            );

            expect(result.data.length).toBe(3);
            expect(result.data[0]).toHaveProperty('balance');
        });

        test('should handle search without searchConfig', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    search: 'john',
                    pagination: { page: 1, limit: 10 }
                }
            );

            // Should return all results since search is ignored without config
            expect(result.data.length).toBe(3);
        });

        test('should handle searchConfig without search', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    searchConfig: {
                        fields: ['first_name', 'last_name', 'email']
                    },
                    pagination: { page: 1, limit: 10 }
                }
            );

            expect(result.data.length).toBe(3);
        });

        test('should handle joins with different join types', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['users.id', 'users.first_name', 'wallets.balance'],
                {
                    pagination: { page: 1, limit: 10 },
                    joins: [
                        { table: 'wallets', on: 'users.id = wallets.user_id', type: 'left' }
                    ]
                }
            );

            expect(result.data.length).toBe(3);
        });

        test('should handle ordering without direction', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    pagination: { page: 1, limit: 10 },
                    orderBy: { column: 'first_name' } // No direction specified
                }
            );

            expect(result.data.length).toBe(3);
            // Should default to desc order
        });

        test('should handle second page results', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    pagination: { page: 2, limit: 2 }
                }
            );

            expect(result.data.length).toBe(1); // Only one item on second page
            expect(result.page).toBe(2);
            expect(result.total).toBe(3);
        });

        test('should handle empty results', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['id', 'first_name', 'last_name', 'email'],
                {
                    search: 'nonexistent',
                    searchConfig: {
                        fields: ['first_name', 'last_name', 'email']
                    },
                    pagination: { page: 1, limit: 10 }
                }
            );

            expect(result.data.length).toBe(0);
            expect(result.total).toBe(0);
        });

        test('should handle search with table prefix in searchConfig', async () => {
            const result = await QueryBuilder.buildPaginatedQuery(
                knex,
                'users',
                ['users.id', 'users.first_name', 'wallets.balance'],
                {
                    search: 'john',
                    searchConfig: {
                        fields: ['first_name', 'last_name'],
                        table: 'users'
                    },
                    pagination: { page: 1, limit: 10 },
                    joins: [
                        { table: 'wallets', on: 'users.id = wallets.user_id' }
                    ]
                }
            );

            expect(result.data.length).toBe(2); // John Doe and Bob Johnson
        });
    });
});
