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

       Every rule turned off below reflects a real, structural fact about
       this code, not a diff-size budget (issues/phase-8, B9-N6 - the
       original wording here cited this same commit's own "git diff -w
       --stat empty" acceptance line, which B9 itself recorded as unmet and
       as the wrong instrument): `no-console` is these suites' entire
       reporting mechanism, the same way it is for any node CLI tool, not
       the browser-app policy the rule exists to enforce; `no-require-
       imports` (narrowed to `*.js` below, issues/phase-8, B9-N11) is
       correct CommonJS in these files, not a TypeScript-era holdover to
       migrate off; `explicit-module-boundary-types` has no annotation to
       write over untyped JS, and no type to infer one from either. A rule
       that instead caught a real, fixable pattern - `no-regex-spaces`,
       `no-extraneous-class`, `no-useless-assignment` - was fixed at each of
       its sites rather than turned off directory-wide (issues/phase-8,
       B9-R2/B9-N5); `preserve-caught-error` likewise stays on here, with an
       inline disable at each of its three pre-existing sites, so a *new*
       catch/rethrow in `tests/`/`tools/` is still caught instead of passing
       silently. */
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
      'no-console': 'off',
      /* Untyped JS: there is no annotation to write, and no type to infer
         one from either. */
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      /* `{ 'index.html': _dropped, ...rest }` (check-site.test.mjs) is the
         destructure-to-drop-a-key idiom - the `^_` prefix this rule already
         supports for exactly that case, not a blanket off. */
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ]
    }
  },
  {
    /* Narrower than the block above: every `no-require-imports` finding is
       in a `.js` CommonJS file (60 sites, measured), never a `.mjs` one, so
       scoping the turn-off to `*.js` still catches a future `.mjs` tool that
       reaches for `require` by mistake (issues/phase-8, B9-N11). */
    files: ['tests/**/*.js', 'tools/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' }
  }
);
