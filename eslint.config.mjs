import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteConfig from './app/svelte.config.mjs';

export default ts.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      /* Generated data, not authored - reformatting or linting a
         machine-written file is noise for no behaviour change. */
      'data.js',
      'i/**',
      /* Everything under .claude/ except the hooks themselves: agent
         wiring (settings, prompts, skills) that is not JS, plus
         `.claude/worktrees/`, a dispatched agent's own isolated checkout
         (host infrastructure that can land nested here unpredictably -
         `.prettierignore`'s own comment explains the same hazard). The
         hooks are real node scripts and are linted below. */
      '.claude/*',
      '!.claude/hooks'
    ]
  },
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { projectService: true, extraFileExtensions: ['.svelte'] }
    },
    rules: {
      /* `any` is an error, not a warning: the plan asks for exactly that */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },
  {
    /* .svelte has a parser of its own, and the type-aware rules only work if it
       forwards the parse on to @typescript-eslint. Without `parser` here the
       whole strictTypeChecked set falls over on the first component. */
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        projectService: true,
        extraFileExtensions: ['.svelte'],
        svelteConfig
      }
    }
    /* C9 (issues/phase-8): tried `@typescript-eslint/no-confusing-void-
       expression`'s `ignoreVoidReturningFunctions` option here to clear the
       three eslint-disable comments in ListPage.svelte/PrintCard.svelte that
       suppress it for `{@render}` tags. It cleared none of the three and, on
       PrintCard's file-wide disable, exposed thirteen other pre-existing
       violations the disable had also been hiding - a wider effect than
       intended for zero gain, so not kept; the three disables stay as they
       were. */
  },
  {
    /* ---------- the layer boundary ----------
       `src/lib` is pure logic. It has to work without a browser: unit tests run
       it, and one day a build script will call it too. A single
       `document.querySelector` slipping in turns the module into a piece of the
       view, and the only sign of it would be a test failing in an environment
       with no DOM. Cheaper to forbid. */
    files: ['app/src/lib/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'src/lib is pure logic: no DOM' },
        { name: 'document', message: 'src/lib is pure logic: no DOM' },
        { name: 'location', message: 'the address arrives as an argument' },
        { name: 'history', message: 'navigation goes through the router port' },
        { name: 'localStorage', message: 'storage goes through a port' },
        { name: 'navigator', message: 'src/lib is pure logic: no DOM' },
        { name: 'fetch', message: 'there is no network: data arrives as an argument' }
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['svelte', 'svelte/*', '*.svelte'],
              message: 'src/lib knows nothing about the view'
            },
            {
              group: ['**/ports/*', '../ports/*'],
              message: 'a port is already something outside; lib stays pure'
            }
          ]
        }
      ]
    }
  },
  {
    /* ---------- everything else in the app ----------
       Ports own the browser. A component may measure the DOM - print fitting
       cannot be done any other way - but it may not reach for storage, the
       network, the address bar or the clipboard directly, because each of those
       has a second implementation and a test needs to supply it.

       Without this rule "app code depends on ports only" is a sentence in a
       document; with it, it is a build failure. */
    files: ['app/src/**/*.ts', 'app/src/**/*.svelte'],
    ignores: ['app/src/ports/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'use the storage port' },
        { name: 'sessionStorage', message: 'use the storage port' },
        { name: 'navigator', message: 'use the clipboard or share port' },
        { name: 'fetch', message: 'there is no network in this app' },
        { name: 'location', message: 'use the router port' },
        { name: 'history', message: 'use the router port' }
      ]
    }
  },
  {
    /* Root config files sit outside tsconfig, so type-aware rules cannot apply:
       the project service simply does not see them. */
    files: ['*.config.mjs', 'app/*.config.mjs'],
    extends: [ts.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    /* tests/** and tools/**: standalone node scripts that sit outside every
       tsconfig, so the type-aware rules have no project to resolve them
       against - same treatment as the root config files above.
       `.claude/hooks/**` joins them for the same reason (issues/phase-8,
       H11): these ran outside both lint and format on a rationale - "an
       older style" - that only ever described the fourteen legacy suites
       R0c deleted, not this code.

       This is a format-and-lint-enablement batch, not a rewrite: every rule
       turned off below either assumes TypeScript-authored code these plain
       CommonJS/ESM scripts never had, or would otherwise demand touching
       lines this same commit's own acceptance line requires untouched
       (`git diff -w --stat` empty apart from this file and
       .prettierignore) - real, pre-existing patterns recorded here rather
       than silently rewritten in a commit whose only claimed effect is
       formatting. */
    files: [
      'tests/**/*.js',
      'tests/**/*.mjs',
      'tools/**/*.js',
      'tools/**/*.mjs',
      '.claude/hooks/**/*.mjs'
    ],
    extends: [ts.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      /* Every suite's entire reporting mechanism is `console.log`, the same
         way it is for any node CLI tool - not the browser-app policy this
         rule exists to enforce. */
      'no-console': 'off',
      /* CommonJS is the correct, only form for the .js files here - not a
         TypeScript-era holdover to migrate off. */
      '@typescript-eslint/no-require-imports': 'off',
      /* Untyped JS: there is no annotation to write, and no type to infer
         one from either. */
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      /* `{ 'index.html': _dropped, ...rest }` (check-site.test.mjs) is the
         destructure-to-drop-a-key idiom - the `^_` prefix this rule already
         supports for exactly that case, not a blanket off. */
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      /* tests/derived.js's ci.yml-indentation regexes (`/^  deploy:/`,
         `/^    needs:/`) use literal run-length spaces, not a `{n}`
         quantifier - pre-existing and unambiguous in context; not touched
         here. */
      'no-regex-spaces': 'off',
      /* tools/artwork/run.mjs and tools/tg-preview/run.mjs rethrow without
         `{ cause }` - a real improvement, left for the batch that next
         touches error handling in either file rather than this one. */
      'preserve-caught-error': 'off',
      /* tools/capture-share-fixture.mjs's constructor-only class and
         tools/tg-preview/live.mjs's one dead `let` assignment are pre-
         existing shapes, not new code this batch is answerable for. */
      '@typescript-eslint/no-extraneous-class': 'off',
      'no-useless-assignment': 'off'
    }
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' }
  }
);
