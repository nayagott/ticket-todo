import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customConfig: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  maxWorkers: 1, // DB 테스트 파일들이 동일한 Postgres 테스트 DB를 TRUNCATE로 공유 — 병렬 워커 간 레이스 방지
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // MSW v2 uses ESM — include in SWC transform
  transformIgnorePatterns: ['/node_modules/(?!(msw)/)'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

export default createJestConfig(customConfig);
