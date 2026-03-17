import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: './tsconfig.json',
    }],
  },
  // Each test suite gets its own timeout — overridden per-file as needed
  testTimeout: 30000,
  // Show individual test names in output
  verbose: true,
  // setupFilesAfterEnv runs after Jest globals (describe/it/afterEach) are available.
  // dotenv loading works here because it runs before any test file is evaluated.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Prevent parallel runs from interfering with shared external API state
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

export default config;
