import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.ts'],
  rootDir: '..',
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
export default config;
