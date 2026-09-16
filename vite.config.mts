import { existsSync, readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

/*
 * The artwork, beside the page that asks for it.
 *
 * The build emits the application; the pictures are made outside it and live in
 * the repository root. Without this the built page opens and immediately fails
 * five requests for `img/*.webp` - which nothing noticed while the opening
 * screen happened to be one the rewrite had not reached, and which CI caught
 * the moment Core rules started drawing four cards on it.
 *
 * Linked rather than copied: 80 MB on every build is not a cost worth paying
 * for a folder that has not changed. `junction` is what makes that work on
 * Windows without elevation, and is ignored on everything else.
 */
function artwork(): Plugin {
  return {
    name: 'dhloot-artwork',
    apply: 'build',
    closeBundle() {
      for (const dir of ['img', 'og', 'card']) {
        const at = join(ROOT, 'dist', dir);
        if (!existsSync(at)) symlinkSync(join(ROOT, dir), at, 'junction');
      }
    }
  };
}

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
  plugins: [svelte(), fileUrlBuild(), artwork()],
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
    /* Vitest defaults to 5000ms, which is below what these tests actually do:
       axe over a full page in jsdom takes seconds, and the slowest a11y specs
       were measured at 13.5s. The default held only on an idle machine - one
       `npm run check` with a single puppeteer probe alongside produced 92
       failures, 71 of them `Test timed out in 5000ms`, on a suite that passes
       658/658 at 30s. Three sessions wrote that off as "contention" before
       anyone looked at the config.

       30s is a little over twice the slowest measured test, so a genuinely
       hung test still fails rather than hanging the run. Scoping it to the
       a11y specs alone was considered and dropped: vitest has no per-file
       timeout without splitting into projects, and 30s is a bounded cost for
       a non-a11y test to hang before failing, not an unbounded one.

       The second half of the problem - a timed-out test leaves `axe.run()`
       in flight and axe holds a global lock, so one timeout takes the rest of
       the file with it (`Axe is already running`) - was not a timeout value
       and lives in app/src/test/a11y.ts instead: expectNoA11yViolations
       clears axe's `_running` flag before every run, so an abandoned run from
       a timed-out neighbour can no longer block the next one. See
       app/src/test/a11y.test.ts for the regression test (issue 47, B3.6). */
    testTimeout: 30_000,
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
        /* Test-only helpers, and the one file that is types and nothing else
           - it emits no code, so a percentage of it is noise. */
        'src/test/**',
        'src/ports/types.ts',
        /* The canvas conversion cannot run in jsdom at all - no Image, no
           canvas, no toBlob - so a percentage of this file would measure the
           two test doubles and nothing else. It is exercised for real by
           tests/app/states.js's copy-image case, which drives the built app
           in Chrome. */
        'src/ports/image.ts',
        'src/vite-env.d.ts',
        /* The entry point that mounts the app onto a real DOM - exercised for
           real by tools/smoke-file-url.mjs, which opens the built page from a
           folder the way file:// requires. */
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
        'src/lib/**': { lines: 95, functions: 95, branches: 85, statements: 90 },
        'src/ports/**': { lines: 70, functions: 80, branches: 55, statements: 70 },
        /* Every component except the one named below. A threshold glob does
           not override a wider one - both are applied - so the exception has to
           be carved out of the pattern rather than layered on top of it. */
        'src/**/!(Button|DiceBar).svelte': {
          lines: 85,
          functions: 80,
          branches: 75,
          statements: 85
        },
        /* The one exception, and it is a file rather than a rule. Svelte
           compiles every attribute into an update path; Button is small enough
           that its own tests - seven of them, including one that changes its
           props under it - still cannot reach them all. Lowering this for every
           component to suit one would hide a component nobody rendered, so the
           exception is named here instead. */
        /* Five buttons built from three props and nothing else: every branch
         Svelte generates for it is an attribute update path, and even a test
         that switches the language cannot reach them all. Named rather than
         lowering the bar for every component - see CLAUDE.md. */
        'src/components/DiceBar.svelte': {
          lines: 85,
          functions: 80,
          branches: 55,
          statements: 85
        },
        'src/components/Button.svelte': {
          lines: 85,
          functions: 80,
          branches: 60,
          statements: 85
        },
        'src/state/**': { lines: 95, functions: 95, branches: 85, statements: 90 }
      }
    }
  }
});
