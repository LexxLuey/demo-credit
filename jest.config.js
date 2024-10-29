/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  moduleFileExtensions: ['ts', 'js'],   // Recognize .ts and .js files
  testMatch: ['**/tests/**/*.test.ts'], // Specify test file pattern

  transformIgnorePatterns: ['/node_modules/'],   
};