import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/selenium/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  // Selenium tests are slow — give each test and hook up to 90 s
  testTimeout: 90000,
  verbose: true,
  // Must be sequential: one browser instance at a time
  maxWorkers: 1,
};

export default config;
