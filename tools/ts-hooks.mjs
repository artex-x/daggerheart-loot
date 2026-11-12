/* Lets Node import the app's TypeScript ports (`--import` this file).
 *
 * Node strips erasable types itself but does not map the `.js` specifiers the
 * ports import each other by (the bundler's convention) to their `.ts`
 * sources, and loads a `.ts` file outside a `"type": "module"` package as
 * CommonJS with a warning. docs/DECISIONS.md, "The hosted E2E runs
 * `cloud.contract.ts` under Node's own type stripping". */
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (
      context.parentURL?.endsWith('.ts') &&
      specifier.startsWith('.') &&
      specifier.endsWith('.js')
    ) {
      const ts = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(ts))) return next(ts.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      return next(url, { ...context, format: 'module-typescript' });
    }
    return next(url, context);
  }
});
