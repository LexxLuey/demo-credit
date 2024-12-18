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
        client: "sqlite3",
        connection: ":memory:",
        useNullAsDefault: true,
        migrations: {
            directory: './src/migrations',
        },
        seeds: {
            directory: './src/seeds',
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
