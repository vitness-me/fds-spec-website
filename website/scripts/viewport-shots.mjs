#!/usr/bin/env node
/**
 * Full-page screenshots at real mobile viewports, on demand.
 *
 * Why this exists: resizing a desktop browser window does not make a mobile
 * viewport. Headless browsers clamp small window sizes and extension-driven
 * resizes can report success while `window.innerWidth` never changes — both
 * have burned this project by making 375px look "verified" when no media
 * query had actually fired. Playwright sets the *viewport* independently of
 * the window, so what these screenshots show is what a phone lays out.
 *
 * Usage:
 *   node scripts/viewport-shots.mjs [path] [outDir]
 *
 *   path    page path on the dev server, default "/"
 *   outDir  where the PNGs land, default "./.viewport-shots" (gitignored)
 *
 * Expects the dev server on http://localhost:3001 (see the port in the repo's
 * dev workflow); set VIEWPORT_BASE to point anywhere else — a production
 * build served locally, or a localized locale path's server. Screenshots are
 * taken at each width in WIDTHS, in both color schemes, full page.
 *
 * The Playwright version is pinned: `npx playwright@<other>` insists on its
 * own browser build and exits before taking anything. If you bump it, run
 * once and let it tell you whether it needs `npx playwright install chromium`.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PLAYWRIGHT = 'playwright@1.60.0';
const BASE = process.env.VIEWPORT_BASE || 'http://localhost:3001';

const WIDTHS = [
  { width: 375, height: 812, name: 'iphone-se-ish' },
  { width: 414, height: 896, name: 'iphone-plus-ish' },
  { width: 820, height: 1180, name: 'ipad-ish' },
];
const SCHEMES = ['light', 'dark'];

const pagePath = process.argv[2] ?? '/';
const outDir = process.argv[3] ?? join(process.cwd(), '.viewport-shots');
mkdirSync(outDir, { recursive: true });

const url = new URL(pagePath, BASE).href;
const slug = pagePath === '/' ? 'landing' : pagePath.replace(/^\/|\/$/g, '').replace(/\//g, '-');

for (const { width, height, name } of WIDTHS) {
  for (const scheme of SCHEMES) {
    const file = join(outDir, `${slug}-${width}-${scheme}.png`);
    process.stdout.write(`  ${width}x${height} ${scheme} (${name}) → ${file}\n`);
    execFileSync(
      'npx',
      [
        '-y', PLAYWRIGHT, 'screenshot',
        '--browser=chromium',
        `--viewport-size=${width},${height}`,
        `--color-scheme=${scheme}`,
        '--full-page',
        '--wait-for-timeout=5000',
        url,
        file,
      ],
      { stdio: ['ignore', 'ignore', 'inherit'] }
    );
  }
}

process.stdout.write('done\n');
