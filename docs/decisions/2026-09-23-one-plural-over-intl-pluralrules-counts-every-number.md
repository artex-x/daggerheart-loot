# 2026-09-23 - One plural() over Intl.PluralRules counts every number beside a word

- Task: `67`, round 2, human decision (option A).
- Decision: one `plural(n, forms, lang)` in `app/src/lib/plural.ts` picks
  the form by the built-in `Intl.PluralRules`. A form set is one dictionary
  string split by `|` (Russian `one|few|many`, English `one|other`, `%n` the
  number), so `Dict` stays `Record<key, string>`. A verb that agrees with
  the count is inside the form: "Выбрана 1 позиция" / "Выбрано 4 позиции".
  Colon forms ("Карточек: %n") stay. Rule: `docs/specs/I18N.md`, "Rules".
- Rejected: an i18n library - outside the approved dependency baseline
  (`I18N.md`, "No i18n framework") for one function; the hand-written rule -
  two copies (the list count in `i18n.ts`, the money words in `money.ts`)
  and no English rule beyond `n === 1`; ICU MessageFormat strings - a
  parser for three keys.
