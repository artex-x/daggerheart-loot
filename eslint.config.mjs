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
      /* The live site and its tooling: an older style, its own rules, a life of
         its own until the cut-over (issue #47). tests/ is what holds them. */
      'app.js',
      'data.js',
      'tests/**',
      'tools/**',
      'i/**'
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
    files: ['**/*.test.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' }
  }
);
