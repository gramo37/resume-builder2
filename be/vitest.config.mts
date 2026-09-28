import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'applyant_test',
      COGNITO_USER_POOL_ID: 'us-east-1_TestPool1',
      COGNITO_CLIENT_ID: 'testclientid',
    },
  },
});
