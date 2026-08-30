import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/* Everything the built page needs in order to open from a folder: the data
   arrives as a separate classic script (under file:// a `fetch` for a local file
   is blocked), and the entry point stops being a module.
   docs/specs/META.md section 4, and docs/specs/CONTRACTS.md section 4. */
function fileUrlBuild(): Plugin {
  return {
    name: 'dhloot-file-url',
    enforce: 'post',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'data.js',
        source: readFileSync(new URL('./data.js', import.meta.url), 'utf8')
      });
    },
    /* Vite puts `type="module"` on the entry even when the format is iife. Such
       a script does not load from a folder at all - Chrome forbids modules over
       file:// - and Pages cannot reveal it, because there it works. So the tag is
       rewritten to a classic one, and tools/smoke-file-url.mjs checks it. */
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin /g, '<script defer ')
        .replace(/<script type="module" /g, '<script defer ');
    }
  };
}

/* The live site still sits in the repository root, so the new app has a root of
   its own: `app/` is built into `dist/`, and until the cut-over (issue #47,
   phase 7) neither gets in the other's way. */
export default defineConfig({
  root: 'app',
  publicDir: false,
  /* A relative base, not '/daggerheart-loot/'. On GitHub Pages it behaves
     exactly the same, while an absolute one breaks every asset URL when the page
     is opened from a folder - see docs/specs/META.md section 4. */
  base: './',
  plugins: [svelte(), fileUrlBuild()],
  /* Under vitest the modules are loaded the way a server would, and Svelte then
     hands back its server build - where `mount` does not exist. Asking for the
     browser condition during tests is what makes a component test a component
     test rather than a render-to-string. */
  resolve: process.env['VITEST'] ? { conditions: ['browser'] } : {},
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    /* One classic bundle instead of modules: Chrome will not load ES modules
       over file://, and the page has to open from a folder. Hence no code
       splitting either - there would be nothing to fetch the second file with. */
    rollupOptions: {
      output: { format: 'iife', entryFileNames: 'assets/app.js' }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/ports/**/*.ts'],
      reporter: ['text-summary'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 }
    }
  }
});
