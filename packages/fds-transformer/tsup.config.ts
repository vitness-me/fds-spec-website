import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/fds-transformer.ts'],
  format: ['esm'],
  // dts, so `types` resolves. sourcemap, because esbuild embeds `sourcesContent`
  // — the maps carry every original source inline, so a stack trace resolves in
  // a consumer's debugger without `src/` being published. Shipping the maps is
  // therefore how the sources ship; dropping them would be the thing that made
  // the package undebuggable, not the thing that fixed a dangling reference.
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  outDir: 'dist',
  // No splitting, so each entry inlines everything it imports — including the
  // bundled schema JSON. That is what makes the offline fallback work in the
  // published package, and it is why nothing needs to be copied into dist/.
  //
  // An `onSuccess` hook used to copy `src/schemas/bundled/v1.0.0/*.json` into
  // `dist/schemas/bundled/v1.0.0/`. Five files, one release, hard-coded, while
  // five releases are bundled — the shape of a hand-kept list that stopped
  // matching what it described. It was also dead weight: no code path reads a
  // schema off disk, so those files were never opened by anything. They still
  // read, convincingly, as the offline story, which is worse than being absent
  // — the one release they named is 1.0.0, whose exercise and equipment
  // versions are withdrawn and 404, so anyone trusting the directory listing
  // would conclude the package could only resolve schemas that no longer exist.
  //
  // `scripts/check-packages.mjs` asserts the real property instead: it opens
  // the tarball and loads every release the manifest names, with `fetch`
  // disabled, from the installed artifact.
  splitting: false,
  shims: true,
});
