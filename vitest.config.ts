import { defineConfig } from 'vitest/config';
import quickpickle from 'quickpickle';

export default defineConfig({
  // @ts-expect-error - vite version mismatch between vitest and quickpickle
  plugins: [quickpickle()],
  test: {
    include: ['features/unit/**/*.feature', 'features/integration/**/*.feature'],
    setupFiles: ['./tests/steps/index.ts'],
  },
});
