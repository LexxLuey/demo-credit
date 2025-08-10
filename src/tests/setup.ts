// src/tests/setup.ts
// Ensure test env is set BEFORE requiring modules that depend on it
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '0';
process.env.TEST_DATABASE_NAME = process.env.TEST_DATABASE_NAME || 'demo_credit_test';

import logger from '../utils/logger';

// Silence all logger transports during tests to keep output clean
try {
  // winston logger exposes transports array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logger.transports as any[]).forEach((transport: any) => {
    transport.silent = true;
  });
} catch {
  // no-op if logger shape changes
}

// Dynamically require knex AFTER setting NODE_ENV
// eslint-disable-next-line @typescript-eslint/no-var-requires
const knex = require('../config/knex').default;

// Global test setup for database
beforeAll(async () => {
  // Run migrations for test database
  await knex.migrate.latest({ directory: './src/migrations' });
});

// Global test teardown
afterAll(async () => {
  // Close all database connections
  await knex.destroy();
});

// Intentionally avoid global knex.destroy here; individual suites may manage their own teardown
