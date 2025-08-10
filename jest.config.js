/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  moduleFileExtensions: ['ts', 'js'],   // Recognize .ts and .js files
  testMatch: ['**/tests/**/*.test.ts'], // Specify test file pattern
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  transformIgnorePatterns: ['/node_modules/'],
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  testTimeout: 30000, // Increase timeout for MySQL operations
};
