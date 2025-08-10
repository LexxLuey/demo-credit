// src/utils/queryBuilder.ts
import { Knex } from 'knex';

export interface SearchConfig {
    fields: string[];
    table?: string;
    joinTable?: string;
    joinCondition?: string;
}

export interface PaginationConfig {
    page: number;
    limit: number;
}

export interface QueryResult<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
}

export class QueryBuilder {
    /**
     * Builds a search condition for the given fields
     */
    static buildSearchCondition(search: string, config: SearchConfig) {
        return (query: Knex.QueryBuilder) => {
            if (!search) return query;
            
            return query.where(function() {
                config.fields.forEach((field, index) => {
                    const fieldName = config.table ? `${config.table}.${field}` : field;
                    if (index === 0) {
                        this.where(fieldName, 'like', `%${search}%`);
                    } else {
                        this.orWhere(fieldName, 'like', `%${search}%`);
                    }
                });
            });
        };
    }

    /**
     * Builds a paginated query with search functionality
     */
    static async buildPaginatedQuery<T = any>(
        knex: Knex,
        table: string,
        selectFields: string[],
        config: {
            search?: string;
            searchConfig?: SearchConfig;
            pagination: PaginationConfig;
            orderBy?: { column: string; direction?: 'asc' | 'desc' };
            joins?: Array<{
                table: string;
                on: string;
                type?: 'inner' | 'left' | 'right';
            }>;
        }
    ): Promise<QueryResult<T>> {
        const { search, searchConfig, pagination, orderBy, joins } = config;
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;

        // Build main query
        let query = knex(table).select(selectFields);

        // Add joins if specified
        if (joins) {
            joins.forEach(join => {
                query = query.join(join.table, join.on, join.type || 'inner');
            });
        }

        // Add search condition if search term and config provided
        if (search && searchConfig) {
            query = this.buildSearchCondition(search, searchConfig)(query);
        }

        // Add ordering
        if (orderBy) {
            query = query.orderBy(orderBy.column, orderBy.direction || 'desc');
        }

        // Add pagination
        const data = await query.limit(limit).offset(offset) as T[];

        // Build count query
        let countQuery = knex(table);

        // Add joins to count query
        if (joins) {
            joins.forEach(join => {
                countQuery = countQuery.join(join.table, join.on, join.type || 'inner');
            });
        }

        // Add search condition to count query
        if (search && searchConfig) {
            countQuery = this.buildSearchCondition(search, searchConfig)(countQuery);
        }

        const totalResult = await countQuery.count('* as count').first();
        const total = Number(totalResult?.count) || 0;

        return {
            data,
            page,
            limit,
            total
        };
    }

    /**
     * Sanitizes search input to prevent SQL injection
     */
    static sanitizeSearchInput(input: string): string {
        if (typeof input !== 'string') return '';
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"\\]/g, '') // Remove quotes and backslashes
            .substring(0, 100); // Limit length
    }

    /**
     * Validates pagination parameters
     */
    static validatePagination(page: number, limit: number): { page: number; limit: number } {
        const validatedPage = Math.max(1, Math.floor(page) || 1);
        const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit) || 10));
        
        return {
            page: validatedPage,
            limit: validatedLimit
        };
    }
} 