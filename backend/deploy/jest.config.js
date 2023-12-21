/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '<rootDir>/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/(tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx))',
    // '<rootDir>/**/*.test.(ts|tsx|)',
    // '<rootDir>/(tests/unit/**/*.spec.(ts|tsx|)|**/__tests__/*.(ts|tsx))',
  ],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
};