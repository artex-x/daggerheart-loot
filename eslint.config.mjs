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
      /* Живой сайт и его инструменты: старый стиль, свои правила, отдельная
         жизнь до переезда (issue #47). Их держат тесты в tests/. */
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
      /* `any` - ошибка, а не предупреждение: план это прямо требует */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },
  {
    /* У .svelte свой парсер, и типовые правила работают только если он передаёт
       разбор дальше в @typescript-eslint. Без `parser` здесь весь набор
       strictTypeChecked падает на первом же компоненте. */
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
    /* ---------- граница слоёв ----------
       `src/lib` - чистая логика. Она обязана работать без браузера: её гоняют
       юнит-тесты, и её же однажды придётся звать из скрипта сборки. Один
       `document.querySelector`, просочившийся сюда, превращает модуль в кусок
       представления, и заметить это можно будет только когда тест упадёт в
       среде без DOM. Дешевле запретить. */
    files: ['app/src/lib/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'src/lib - чистая логика, без DOM' },
        { name: 'document', message: 'src/lib - чистая логика, без DOM' },
        { name: 'location', message: 'адрес приходит параметром, а не из location' },
        { name: 'localStorage', message: 'хранилище - через порт, не напрямую' },
        { name: 'navigator', message: 'src/lib - чистая логика, без DOM' },
        { name: 'fetch', message: 'сети нет: данные приходят параметром' }
      ],
      'no-restricted-imports': ['error', { patterns: ['svelte', 'svelte/*', '*.svelte'] }]
    }
  },
  {
    /* Конфиги в корне лежат вне tsconfig, и типовые правила к ним неприменимы:
       сервис проектов их просто не видит. */
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
