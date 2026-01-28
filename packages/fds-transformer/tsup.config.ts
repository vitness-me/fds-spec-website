import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/fds-transformer.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  outDir: 'dist',
  splitting: false,
  shims: true,
  onSuccess: async () => {
    // Copy bundled schemas to dist for package distribution
    const srcDir = join(__dirname, 'src/schemas/bundled');
    const destDir = join(__dirname, 'dist/schemas/bundled');
    
    // Copy v1.0.0 schemas
    const v1Dir = join(srcDir, 'v1.0.0');
    const v1DestDir = join(destDir, 'v1.0.0');
    
    mkdirSync(v1DestDir, { recursive: true });
    
    const files = readdirSync(v1Dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      copyFileSync(join(v1Dir, file), join(v1DestDir, file));
    }
    
    console.log(`Copied ${files.length} bundled schema files to dist/schemas/bundled/v1.0.0/`);
  },
});
