/* The report of a lists import (docs/specs/FEATURES.md, "Lists"): the lines `ImportPanel`
 * draws for the errors of a refused file and for the entries a good file leaves out, and
 * the refusal behind a file that is not a lists file. The read API's file check builds the
 * same lines (docs/specs/CONTRACTS.md section 6), so the panel and the API cannot disagree.
 *
 * Pure module: it is handed the parse's output, the dictionary and a name lookup. */

import { ID_PATTERN } from './bundle.js';
import type { BundleError, Parsed, Skipped } from './bundle.js';
import type { Dict } from './dict.js';
import type { ReportLine } from './types.js';

/** Names a catalog record by id in the language on screen; undefined for a record the data
 *  does not know. The panel passes its index, the read API passes none. */
export type NameOf = (id: string) => string | undefined;

/** The dictionary keys of the refusals of a lists file. */
export type ListsRefusalKey =
  'importNotJson' | 'importNotBundle' | 'importVersion' | 'importNoVersion' | 'importEmpty';

const NAME_CUT = 40;

const cut = (s: string): string => {
  const cps = Array.from(s);
  return cps.length > NAME_CUT ? cps.slice(0, NAME_CUT).join('') + '...' : s;
};

/* One pass, so a value that holds `%s` is not filled in again. */
const fill = (template: string, by: Record<string, string | number | undefined>): string =>
  template.replace(/%([flnsv])/g, (m, k: string) => {
    const v = by[k];
    return v === undefined ? m : String(v);
  });

/** Returns a list's name as the report heads it: cut to 40 characters, or the no-name text. */
export const listName = (t: Dict, name: string | null | undefined): string =>
  name ? cut(name) : t.importNoName;

/* The record of an entry, named when the data knows it. */
function where(
  entry: number,
  item: string | undefined,
  t: Dict,
  nameOf: NameOf
): Pick<ReportLine, 'pos' | 'name' | 'item'> {
  const pos = t.importPos.replace('%n', String(entry + 1));
  if (item === undefined) return { pos };
  const name = nameOf(item);
  return name === undefined ? { pos, item } : { pos, name, item };
}

function errorLine(e: BundleError, t: Dict, nameOf: NameOf): ReportLine {
  const f =
    e.field === 'name' && e.list !== null && e.entry === null ? t.importFieldName : e.field;
  const by = { f, v: e.value, n: e.limit, s: e.limit };
  let text: string;
  switch (e.kind) {
    case 'missing':
      text = f === t.importFieldName ? t.importErrName : fill(t.importErrMissing, by);
      break;
    case 'type':
      text =
        e.limit === ID_PATTERN.source
          ? fill(t.importErrId, by)
          : e.field === ''
            ? fill(t.importErrNotObject, by)
            : fill(t.importErrType, by);
      break;
    case 'long':
      text = fill(t.importErrLong, by);
      break;
    case 'range':
      text = fill(t.importErrRange, by);
      break;
    case 'enum':
      text = fill(t.importErrEnum, by);
      break;
    case 'extra':
      text = fill(t.importErrExtra, by);
      break;
    case 'many':
      text = fill(e.field === 'lists' ? t.importErrManyLists : t.importErrManyEntries, by);
      break;
    case 'hbId':
      text = fill(t.importErrHbId, by);
      break;
    case 'snapshot':
      text = t.importErrSnapshot;
      break;
  }
  return {
    ...(e.entry === null ? {} : where(e.entry, e.item, t, nameOf)),
    text,
    ...(e.path ? { path: e.path } : {})
  };
}

/**
 * Returns the line of an entry a good file leaves out: the position and, where `nameOf`
 * knows the record, its name; never the raw id, which an author already has in the file.
 */
export function skipLine(s: Skipped, t: Dict, nameOf: NameOf): ReportLine {
  const name = nameOf(s.id);
  return {
    pos: t.importPos.replace('%n', String(s.entry + 1)),
    ...(name === undefined ? {} : { name }),
    text:
      s.why === 'unknown'
        ? t.importSkipUnknown
        : s.why === 'unheld'
          ? t.importSkipUnheld
          : t.importSkipRepeat.replace('%n', String((s.first ?? 0) + 1))
  };
}

/** One list's block of the error report: its index in the file, its head and its lines. */
export interface ListBlock {
  index: number;
  head: string;
  lines: ReportLine[];
}

/**
 * Returns the error report of a refused lists file: the file's own lines, then one block
 * per list that has errors, in file order.
 *
 * @param errors The errors of the parse.
 * @param names Per list of the file, its name when that is a string, else null.
 * @param t The dictionary of the language on screen.
 * @param nameOf Names a catalog record in that language.
 */
export function listsErrorReport(
  errors: readonly BundleError[],
  names: readonly (string | null)[],
  t: Dict,
  nameOf: NameOf
): { file: ReportLine[]; lists: ListBlock[] } {
  const file = errors.filter((e) => e.list === null).map((e) => errorLine(e, t, nameOf));
  const indexes = errors
    .map((e) => e.list)
    .filter((l, i, all): l is number => l !== null && all.indexOf(l) === i)
    .sort((a, b) => a - b);
  const lists = indexes.map((i) => ({
    index: i,
    head: `${String(i + 1)}. ${listName(t, names[i])}`,
    lines: errors.filter((e) => e.list === i).map((e) => errorLine(e, t, nameOf))
  }));
  return { file, lists };
}

/** Returns the dictionary key (and, for a version, the version as JSON) of the refusal
 *  behind a file the parse did not read as a lists file with errors. */
export function listsRefusal(
  p: Exclude<Extract<Parsed, { ok: false }>, { reason: 'errors' }>
): {
  key: ListsRefusalKey;
  version?: string;
} {
  if (p.reason === 'version') {
    return p.version === undefined
      ? { key: 'importNoVersion' }
      : { key: 'importVersion', version: JSON.stringify(p.version) };
  }
  const keys = {
    notJson: 'importNotJson',
    notBundle: 'importNotBundle',
    empty: 'importEmpty'
  } as const;
  return { key: keys[p.reason] };
}

/**
 * Returns a line as the import panel draws it, as plain text: the position, the name and
 * the item id in parentheses when they exist, a colon, the text, and the JSON path.
 */
export function lineText(l: ReportLine): string {
  let head = '';
  if (l.pos) {
    head = l.pos;
    if (l.name || l.item) {
      head += ', ' + (l.name && l.item ? `${l.name} (${l.item})` : l.item || l.name || '');
    }
    head += ': ';
  }
  return head + l.text + (l.path ? ' ' + l.path : '');
}
