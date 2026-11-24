import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/fds-encoder.ts'],
  format: ['esm'],
  dts: { entry: 'src/index.ts' },
  sourcemap: true,
  clean: true,
  target: 'node20',
  outDir: 'dist',
  // No splitting, so each entry inlines what it imports — including the descriptor registries under
  // specification/registries/descriptors/, which src/alphabet.ts imports from the repository. The package ships the
  // rules revision it was built from and reads no registry at run time.
  splitting: false,
  shims: true,
});
