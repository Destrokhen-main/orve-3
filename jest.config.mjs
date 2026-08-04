/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  clearMocks: true,
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)", "**/*.test.(ts|tsx)"],
  coverageProvider: "v8",
  coverageDirectory: "coverage",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        // Пакет собирается в ESM, а раннер jest остаётся CJS — компилируем тесты в CJS.
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node",
        },
      },
    ],
  },
  moduleNameMapper: {
    // Исходники ссылаются друг на друга по ESM-правилам ("./foo.js"),
    // на диске лежат .ts/.tsx — снимаем расширение обратно.
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Пакет резолвится в исходники: dist для тестов не собираем.
    "^orve/jsx-dev-runtime$": "<rootDir>/src/jsx-dev-runtime.ts",
    "^orve/jsx-runtime$": "<rootDir>/src/jsx-runtime.ts",
    "^orve$": "<rootDir>/src/index.ts",
  },
};
