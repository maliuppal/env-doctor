import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/cli.ts', 'src/version.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: { lines: 90, functions: 90, branches: 84, statements: 90 },
    },
  },
});
