import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/app/layout.tsx',
        'src/app/loading.tsx',
        'src/app/not-found.tsx',
        'src/domain/types.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 85,
        statements: 90,
      },
    },
  },
});
