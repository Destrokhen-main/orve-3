/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",  
  clearMocks: true,
  coverageProvider: "v8",
  coverageDirectory: "coverage",
};