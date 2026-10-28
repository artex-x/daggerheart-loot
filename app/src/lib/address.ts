/* The two forms of one address (docs/specs/ROUTES.md, "Path form").
 *
 * The app keeps its route key as the `#/...` string that `hash.ts` parses and
 * builds; the address bar and every rendered link show the path form. This
 * module converts between the two and is the only place that knows the
 * language prefix.
 *
 * No imports but a type, and erasable TypeScript only: the browser driver and
 * the Node tools load this file directly, as they do `markup.ts`. */

import type { Lang } from './types.js';

/** Returns the path form of the route key `hash` in `lang`: `/en/` before an English
 *  address, except a record, which keeps its card path `/i/en/<id>`. */
export function pathOf(hash: string, lang: Lang): string {
  const rest = hash.replace(/^#\/?/, '');
  if (lang !== 'en') return '/' + rest;
  if (rest.startsWith('i/')) return '/i/en/' + rest.slice(2);
  return '/en/' + rest;
}

const EN_ROOT = /^\/en(?:\/(?:index\.html)?)?$/;

/**
 * Returns the route key and the language that a page address names.
 *
 * A fragment that starts with `#/` is the old form and wins; its language comes
 * from an English root path alone, so `<site>en/#/...` stays English. `lang` null
 * means the address names no language. `parses`, when given, lets one trailing
 * `/` drop only where the address without it parses and the one with it does not.
 */
export function addressOf(
  pathname: string,
  fragment: string,
  parses?: (hash: string) => boolean
): { hash: string; lang: Lang | null } {
  if (fragment.startsWith('#/')) {
    return { hash: fragment, lang: EN_ROOT.test(pathname) ? 'en' : null };
  }
  if (EN_ROOT.test(pathname)) return { hash: '#/', lang: 'en' };
  let lang: Lang = 'ru';
  let rest = pathname === '/index.html' ? '' : pathname.replace(/^\//, '');
  if (rest.startsWith('en/')) {
    lang = 'en';
    rest = rest.slice(3);
  } else if (rest.startsWith('i/en/')) {
    lang = 'en';
    rest = 'i/' + rest.slice(5);
  }
  const hash = '#/' + rest;
  if (parses && hash.length > 2 && hash.endsWith('/') && !parses(hash)) {
    const cut = hash.slice(0, -1);
    if (parses(cut)) return { hash: cut, lang };
  }
  return { hash, lang };
}
