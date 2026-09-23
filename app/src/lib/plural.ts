/* How a count agrees with its word.
 *
 * `Intl.PluralRules` is an ECMAScript built-in, so the rule costs no
 * dependency and no hand-written copy of the Russian last-digit rule
 * (docs/DECISIONS.md, "One plural() over Intl.PluralRules counts every number
 * beside a word"; docs/specs/I18N.md, "Rules").
 *
 * Pure module: the language arrives as an argument. */

import type { Lang } from './types.js';

const RULES: Record<Lang, Intl.PluralRules> = {
  ru: new Intl.PluralRules('ru'),
  en: new Intl.PluralRules('en')
};

/* Russian `other` is for fractions only; a count is an integer. */
const INDEX: Record<Lang, Partial<Record<Intl.LDMLPluralRule, number>>> = {
  ru: { one: 0, few: 1, many: 2 },
  en: { one: 0 }
};

/** Returns the form of `forms` ("one|few|many" in Russian, "one|other"
 *  in English) that agrees with `n`, with `%n` replaced by `n`. */
export function plural(n: number, forms: string, lang: Lang): string {
  const f = forms.split('|');
  const last = f.length - 1;
  const i = Math.min(INDEX[lang][RULES[lang].select(n)] ?? last, last);
  return String(f[i]).replaceAll('%n', String(n));
}
