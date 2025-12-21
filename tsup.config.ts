import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx', 'src/ink-entry.tsx'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    'better-sqlite3',
    'react-devtools-core',
    // Ink and its dependencies use CommonJS that doesn't bundle well
    'ink',
    'ink-text-input',
    'ink-spinner',
    '@inkjs/ui',
    'react',
    'react-reconciler',
    'signal-exit',
    'yoga-wasm-web',
  ],
});
