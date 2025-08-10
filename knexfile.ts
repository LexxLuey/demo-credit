// knexfile.ts
import { Knex } from 'knex';
import { config } from './src/config/env.config';

const knexConfig: { [key: string]: Knex.Config } = {
    development: {
        client: 'mysql2',
        connection:  {
            host: config.databaseHost,
            port: parseInt(config.databasePort),
            user: config.databaseUser,
            password: config.databasePassword,
            database: config.databaseName,
        },
        migrations: {
            directory: './src/migrations',
        },
        seeds: {
            directory: './src/seeds',
        },
    },
    test: {
        client: 'mysql2',
        connection: {
            host: config.databaseHost || 'localhost',
            port: parseInt(config.databasePort || '3306'),
            user: config.databaseUser || 'root',
            password: config.databasePassword || 'password',
            database: process.env.TEST_DATABASE_NAME || 'demo_credit_test',
        },
        migrations: {
            directory: './src/migrations',
        },
        seeds: {
            directory: './src/seeds',
        },
        pool: {
            min: 1,
            max: 10,
            acquireTimeoutMillis: 60000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 200,
        }
    },
    production: {
        client: 'pg',
        connection: {
            host: config.databaseHost,
            port: parseInt(config.databasePort),
            user: config.databaseUser,
            database: config.databaseName,
            password: config.databasePassword,
        },
        migrations: {
            directory: './src/migrations',
        },
        seeds: {
            directory: './src/seeds',
        },
    },
};

export default knexConfig;
