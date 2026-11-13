/* The report of a homebrew import (docs/specs/FEATURES.md, "Homebrew"): the lines
 * `HomebrewImport` draws for the errors of a refused file and for what a good file keeps
 * but names, and the refusal behind a file that is not a homebrew file. The read API's file
 * check builds the same lines (docs/specs/CONTRACTS.md section 6), so the panel and the API
 * cannot disagree.
 *
 * Pure module: it is handed the parse's output and the dictionary. */

import type { Dict } from './dict.js';
import {
  BOOK_NAME_MAX,
  CARD_ITEMS_MAX,
  CARD_NAME_MAX,
  CARD_SUB_MAX,
  CARD_TEXT_MAX,
  CARD_URL_MAX,
  CRAFT_MAX,
  DESC_MAX,
  hasName,
  NAME_MAX,
  REFS_MAX,
  SECTIONS_MAX
} from './homebrew.js';
import {
  FILE_BOOKS_MAX,
  FILE_CARDS_MAX,
  FILE_ITEMS_MAX,
  type FileArray,
  type FileError,
  type FileName,
  type FileNote,
  type HomebrewFile,
  type HomebrewParsed
} from './homebrewFile.js';
import type { Lang, ReportLine } from './types.js';

/** The dictionary keys of the refusals of a homebrew file. */
export type HomebrewRefusalKey =
  | 'importNotJson'
  | 'hbImportNotFile'
  | 'hbImportVersion'
  | 'hbImportNoVersion'
  | 'hbImportEmpty';

const POS = { books: 'hbImportPosBook', cards: 'hbImportPosCard', items: 'hbImportPosItem' };
const MANY = {
  books: 'hbImportManyBooks',
  cards: 'hbImportManyCards',
  items: 'hbImportManyItems'
};
const FILE_MAX = { books: FILE_BOOKS_MAX, cards: FILE_CARDS_MAX, items: FILE_ITEMS_MAX };
const TEXTS = ['en', 'ru', 'ende', 'rud', 'ensub', 'rusub'];

/* One pass, so a value that holds `%s` is not filled in again. */
const fill = (template: string, by: Record<string, string | number | undefined>): string =>
  template.replace(/%([fnsv])/g, (m, k: string) => {
    const v = by[k];
    return v === undefined ? m : String(v);
  });

const cut40 = (s: string): string => {
  const cps = Array.from(s);
  return cps.length > 40 ? cps.slice(0, 40).join('') + '...' : s;
};

const named = (v: { en?: string; ru?: string }, lang: Lang): string =>
  (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';

/* The bound a `long` or `many` rule names, by the object and the field's last step. */
function limitOf(array: FileArray, field: string): number | undefined {
  const last = field.split('.').at(-1) ?? '';
  const section = field.startsWith('sections');
  switch (last) {
    case 'en':
    case 'ru':
      return array === 'items' ? NAME_MAX : array === 'cards' ? CARD_NAME_MAX : BOOK_NAME_MAX;
    case 'ende':
    case 'rud':
      return array === 'items' ? DESC_MAX : CARD_TEXT_MAX;
    case 'ensub':
    case 'rusub':
      return CARD_SUB_MAX;
    case 'url':
      return CARD_URL_MAX;
    case 'refs':
      return REFS_MAX;
    case 'craft':
    case 'craft_from':
      return CRAFT_MAX;
    case 'items':
      return array === 'cards' ? CARD_ITEMS_MAX : undefined;
    case 'sections':
      return section ? SECTIONS_MAX : undefined;
    default:
      return undefined;
  }
}

/* The value at an error's path in the file, as text cut to 40 characters. */
function valueAt(doc: unknown, path: string): string {
  let v: unknown = doc;
  for (const step of path.match(/[^.[\]]+/g) ?? []) {
    if (v === null || typeof v !== 'object') return '';
    v = (v as Record<string, unknown>)[step];
  }
  if (v === undefined) return '';
  return cut40(typeof v === 'string' ? v : JSON.stringify(v));
}

/* An object's place and its name in the language on screen, when it has one. */
function placeOf(
  array: FileArray,
  index: number,
  names: Record<FileArray, FileName[]>,
  t: Dict,
  lang: Lang
): Pick<ReportLine, 'pos' | 'name'> {
  const pos = t[POS[array] as 'hbImportPosItem'].replace('%n', String(index + 1));
  const n = names[array][index];
  const name = n
    ? named(
        { en: n.en && hasName(n.en) ? n.en : '', ru: n.ru && hasName(n.ru) ? n.ru : '' },
        lang
      )
    : '';
  return name ? { pos, name: t.quoted.replace('%s', cut40(name)) } : { pos };
}

function errorLine(
  e: FileError,
  doc: unknown,
  names: Record<FileArray, FileName[]>,
  t: Dict,
  lang: Lang
): ReportLine {
  const v = valueAt(doc, e.path);
  if (e.array === null || e.index === null) {
    const text =
      e.rule === 'many' && (e.field === 'books' || e.field === 'cards' || e.field === 'items')
        ? t[MANY[e.field] as 'hbImportManyItems'].replace('%n', String(FILE_MAX[e.field]))
        : e.rule === 'extra'
          ? fill(t.importErrExtra, { f: e.field })
          : fill(t.hbImportErrType, { f: e.field });
    return { text, path: e.path };
  }
  const base = e.array + '[' + String(e.index) + ']';
  const f = e.path.length > base.length ? e.path.slice(base.length + 1) : '';
  const last = f.split('.').at(-1) ?? '';
  let text: string;
  if (e.field === 'name') text = t.hbImportErrName;
  else if (f === '') text = fill(t.importErrNotObject, { v });
  else {
    switch (e.rule) {
      case 'required':
        text = fill(t.importErrMissing, { f });
        break;
      case 'extra':
        text = fill(t.importErrExtra, { f });
        break;
      case 'long':
        text = fill(t.importErrLong, { f, n: limitOf(e.array, e.field) });
        break;
      case 'many':
        text = fill(t.hbImportErrMany, { f, n: limitOf(e.array, e.field) });
        break;
      case 'range':
        text = fill(t.hbImportErrRange, { f, v });
        break;
      case 'enum':
        text = f === 'eq.line' ? t.hbImportErrLine : fill(t.hbImportErrEnum, { f, v });
        break;
      case 'pattern':
        text =
          f === 'key'
            ? fill(t.hbImportErrKey, { v })
            : last === 'dmg'
              ? fill(t.hbImportErrDmg, { f, v })
              : TEXTS.includes(last)
                ? fill(t.hbImportErrControl, { f })
                : fill(t.hbImportErrPattern, { f, v });
        break;
      case 'duplicate':
        text =
          f === 'key' ? fill(t.hbImportErrKeyTwice, { v }) : fill(t.hbImportErrTwice, { f });
        break;
      case 'self':
        text = fill(t.hbImportErrSelf, { f });
        break;
      case 'order':
        text = t.hbImportErrOrder;
        break;
      case 'unknown':
        text =
          f === 'book' ? fill(t.hbImportErrBook, { v }) : fill(t.hbImportErrSection, { v });
        break;
      default:
        text = fill(t.hbImportErrType, { f });
    }
  }
  return { ...placeOf(e.array, e.index, names, t, lang), text, path: e.path };
}

/**
 * Returns the lines of a refused homebrew file, one per error.
 *
 * @param errors The errors of the parse.
 * @param doc The file's parsed JSON, which gives the value an error names; null for none.
 * @param names Per array of the file, each object's names.
 * @param t The dictionary of the language on screen.
 * @param lang The language on screen.
 */
export function homebrewErrorLines(
  errors: readonly FileError[],
  doc: unknown,
  names: Record<FileArray, FileName[]>,
  t: Dict,
  lang: Lang
): ReportLine[] {
  return errors.map((e) => errorLine(e, doc, names, t, lang));
}

/**
 * Returns the lines for what a good homebrew file keeps but names: a relation that names
 * nothing, and a held card key of another kind.
 *
 * @param notes The notes of the parse.
 * @param file The parsed file, which gives each object's names.
 * @param t The dictionary of the language on screen.
 * @param lang The language on screen.
 * @param from By a derived key, the key of the chosen file it came from (empty for none).
 */
export function homebrewNoteLines(
  notes: readonly FileNote[],
  file: HomebrewFile,
  t: Dict,
  lang: Lang,
  from: ReadonlyMap<string, string>
): ReportLine[] {
  const names: Record<FileArray, FileName[]> = {
    books: file.books.map((b) => ({ ...b })),
    cards: file.cards.map((c) => ({ ...c })),
    items: file.items.map((i) => ({ ...i }))
  };
  return notes.map((n) =>
    n.kind === 'relation'
      ? {
          ...placeOf(n.array ?? 'items', n.index, names, t, lang),
          text: fill(t.hbImportUnknownRef, { f: n.field, v: from.get(n.id) ?? n.id })
        }
      : { ...placeOf('cards', n.index, names, t, lang), text: t.hbImportKindDiffers }
  );
}

/** Returns the dictionary key (and, for a version, the version as JSON) of the refusal
 *  behind a file the parse did not read as a homebrew file with errors. */
export function homebrewRefusal(
  p: Exclude<Extract<HomebrewParsed, { ok: false }>, { reason: 'errors' }>
): { key: HomebrewRefusalKey; version?: string } {
  if (p.reason === 'version') {
    return p.version === undefined
      ? { key: 'hbImportNoVersion' }
      : { key: 'hbImportVersion', version: JSON.stringify(p.version) };
  }
  return {
    key:
      p.reason === 'notJson'
        ? 'importNotJson'
        : p.reason === 'empty'
          ? 'hbImportEmpty'
          : 'hbImportNotFile'
  };
}
