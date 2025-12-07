import { defineConfig } from 'vitest/config';
import quickpickle from 'quickpickle';
import path from 'path';

export default defineConfig({
  // @ts-expect-error - vite version mismatch between vitest and quickpickle
  plugins: [quickpickle()],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  test: {
    include: ['features/unit/**/*.feature', 'features/integration/**/*.feature'],
    setupFiles: ['./tests/steps/index.ts'],
  },
});
