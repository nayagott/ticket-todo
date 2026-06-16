import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customConfig: Config = {
  coverageProvider: 'v8',
  testEnvironment: '<rootDir>/jest.environment.ts',
  // jsdom 환경의 기본 "browser" export 조건 때문에 msw의 './node' 서브패스가 null로 막히는 문제 방지
  testEnvironmentOptions: { customExportConditions: [''] },
  maxWorkers: 1, // DB 테스트 파일들이 동일한 Postgres 테스트 DB를 TRUNCATE로 공유 — 병렬 워커 간 레이스 방지
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

export default createJestConfig(customConfig);
