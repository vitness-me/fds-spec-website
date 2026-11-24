import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The descriptor steps use the encoder's source, as tsconfig.json's `paths` and the build do: the transformer bundles
  // the encoder it was built beside rather than depending on a published copy.
  resolve: {
    alias: {
      '@vitness/fds-encoder': new URL('../fds-encoder/src/index.ts', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
