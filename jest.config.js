/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  clearMocks: true,
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)", "**/*.test.(ts|tsx)"],
  coverageProvider: "v8",
  coverageDirectory: "coverage",
  // tsconfig указывает jsxImportSource: "orve" — резолвим его на исходники
  moduleNameMapper: {
    "^orve/jsx-dev-runtime$": "<rootDir>/src/jsx-dev-runtime.ts",
    "^orve/jsx-runtime$": "<rootDir>/src/jsx-runtime.ts",
    "^orve$": "<rootDir>/src/index.ts",
  },
};
