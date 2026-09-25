/* "Edited N ago" for an account list, "Updated N ago" for a shared one.
 *
 * `Intl.RelativeTimeFormat` is an ECMAScript built-in, like the plural rule
 * (docs/specs/I18N.md, "Rules"), so neither language needs a hand-written
 * table. Pure module: the time and the language arrive as arguments. */

import type { Dict } from './dict.js';
import type { Lang } from './types.js';

const MINUTE = 60_000;

const FORMAT: Record<Lang, Intl.RelativeTimeFormat> = {
  ru: new Intl.RelativeTimeFormat('ru', { numeric: 'auto' }),
  en: new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
};

/** Returns when `ms` was, seen from `now`: under a minute (or in the future) "just now",
 *  else minutes, hours, days, months of 30 days or years, in the page language, as an
 *  "edited" or an "updated" text. */
export function agoText(
  ms: number,
  now: number,
  lang: Lang,
  t: Dict,
  kind: 'edited' | 'updated' = 'edited'
): string {
  const minutes = Math.floor((now - ms) / MINUTE);
  if (minutes < 1) return kind === 'edited' ? t.editedNow : t.updatedNow;
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const f = FORMAT[lang];
  const when =
    minutes < 60
      ? f.format(-minutes, 'minute')
      : hours < 24
        ? f.format(-hours, 'hour')
        : days < 30
          ? f.format(-days, 'day')
          : months < 12
            ? f.format(-months, 'month')
            : f.format(-Math.floor(months / 12), 'year');
  return (kind === 'edited' ? t.editedAgo : t.updatedAgo).replace('%s', when);
}
