import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  oxc: false,
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['test/setup.ts'],
    testTimeout: 15_000,
    coverage: {
      reportsDirectory: '../../coverage/api-e2e',
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
