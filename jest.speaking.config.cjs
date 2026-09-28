module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/speaking-persistence.test.ts', '**/speaking-upload.test.ts', '**/speaking-recording.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', isolatedModules: true }, diagnostics: false }] },
};
