/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",  
  testEnvironment: 'jsdom',
  clearMocks: true,
  moduleFileExtensions: ['ts', 'tsx'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  coverageProvider: "v8",
  coverageDirectory: "coverage",
};