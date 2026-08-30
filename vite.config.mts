import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/* Всё, что нужно, чтобы собранная страница открывалась из папки: данные едут
   отдельным классическим скриптом (из file:// `fetch` к локальному файлу
   запрещён), а точка входа перестаёт быть модулем.
   docs/specs/META.md, раздел 4, и docs/specs/CONTRACTS.md, раздел 4. */
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
    /* Vite вешает на точку входа `type="module"` даже когда формат iife.
       Из папки такой скрипт не грузится вовсе - Chrome запрещает модули по
       file://, - и заметить это на Pages нельзя: там он работает. Поэтому тег
       переписывается на классический, а проверяет это tools/smoke-file-url.mjs. */
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin /g, '<script defer ')
        .replace(/<script type="module" /g, '<script defer ');
    }
  };
}

/* Живой сайт пока лежит в корне репозитория, поэтому у нового приложения свой
   корень: собирается `app/`, кладётся в `dist/`, и до переезда (issue #47,
   фаза 7) одно другому не мешает. */
export default defineConfig({
  root: 'app',
  publicDir: false,
  /* Относительный base, а не '/daggerheart-loot/'. На GitHub Pages он работает
     ровно так же, а абсолютный ломает все адреса ресурсов при открытии из
     папки - см. docs/specs/META.md, раздел 4. */
  base: './',
  plugins: [svelte(), fileUrlBuild()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    /* Один классический бандл вместо модулей: Chrome не грузит ES-модули по
       file://, а страница должна открываться из папки. Отсюда же отказ от
       разделения на чанки - грузить второй файл всё равно нечем. */
    rollupOptions: {
      output: { format: 'iife', entryFileNames: 'assets/app.js' }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      reporter: ['text-summary'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 }
    }
  }
});
