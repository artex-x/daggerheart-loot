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
      /* Everything that ships, not only the parts that are easy to measure.
         Leaving components out was how a number in the eighties described two
         directories out of four. */
      include: ['src/**/*.ts', 'src/**/*.svelte'],
      exclude: [
        'src/**/*.test.ts',
        /* Test-only helpers, the entry point, and the one file that is types
           and nothing else - it emits no code, so a percentage of it is noise. */
        'src/test/**',
        'src/ports/types.ts',
        /* The canvas conversion cannot run in jsdom at all - no Image, no
           canvas, no toBlob - so a percentage of this file would measure the
           two test doubles and nothing else. It is exercised for real by
           tests/parity.js, which drives the built app in Chrome. */
        'src/ports/image.ts',
        'src/vite-env.d.ts',
        'src/main.ts'
      ],
      reporter: ['text', 'text-summary'],
      /* Per directory, because one global number lets a well covered library
         pay for a component nobody tested. The bars differ because the
         obligations differ: lib is pure and has no excuse, ports wrap browser
         APIs whose happy paths jsdom cannot reach, everything else is drawn on
         screen and is checked through behaviour. `perFile` is the part that
         matters - it is what makes a file with no test at all fail, without
         demanding a test file per source file. */
      thresholds: {
        perFile: true,
        'src/lib/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
        'src/ports/**': { lines: 70, functions: 70, branches: 55, statements: 70 },
        /* Every component except the one named below. A threshold glob does
           not override a wider one - both are applied - so the exception has to
           be carved out of the pattern rather than layered on top of it. */
        'src/**/!(Button).svelte': { lines: 85, functions: 80, branches: 75, statements: 85 },
        /* The one exception, and it is a file rather than a rule. Svelte
           compiles every attribute into an update path; Button is small enough
           that its own tests - seven of them, including one that changes its
           props under it - still cannot reach them all. Lowering this for every
           component to suit one would hide a component nobody rendered, so the
           exception is named here instead. */
        'src/components/Button.svelte': {
          lines: 85,
          functions: 80,
          branches: 50,
          statements: 85
        },
        'src/state/**': { lines: 90, functions: 90, branches: 80, statements: 90 }
      }
    }
  }
});
