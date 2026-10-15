/* The text edits behind the formatting toolbar (docs/specs/FEATURES.md, "Consistency
 * rules", rule 18): each takes the box's value and selection and returns the replacement
 * and the selection after it, so the field applies it in one step. Pure module. */

/** A button of the formatting toolbar, in the order the toolbar draws them. */
export type MarkupTool = 'bold' | 'italic' | 'ul' | 'ol' | 'table';

/** Replace `value.slice(from, to)` with `text`, then select `sel`. */
export interface MarkupEdit {
  from: number;
  to: number;
  text: string;
  sel: [number, number];
}

type Mark = '**' | '*';

/* The star runs that hold the mark: bold sits in a run of 2 or 3, italic in a run of 1 or 3. */
const holds = (mark: Mark, n: number): boolean =>
  mark === '**' ? n === 2 || n === 3 : n === 1 || n === 3;

const starsBefore = (s: string, at: number): number => {
  let n = 0;
  while (s[at - 1 - n] === '*') n += 1;
  return n;
};

const starsAfter = (s: string, at: number): number => {
  let n = 0;
  while (s[at + n] === '*') n += 1;
  return n;
};

/** Returns the edit of Bold (`**`) or Italic (`*`): it removes the mark around a selection
 *  that holds it, else wraps the selection's non-blank part; with no selection it inserts
 *  the mark twice with the caret between. A selection over several lines wraps each line.
 *  Null, no edit, when an end of the selection touches stars that do not wrap it: a wrap
 *  there would leave stars as text. */
export function toggleMark(
  value: string,
  start: number,
  end: number,
  mark: Mark
): MarkupEdit | null {
  const m = mark.length;
  if (start === end)
    return { from: start, to: end, text: mark + mark, sel: [start + m, start + m] };
  const picked = value.slice(start, end);
  if (picked.includes('\n')) {
    const text = picked
      .split('\n')
      .map((line) => {
        const core = line.trim();
        if (!core) return line;
        const lead = line.slice(0, line.indexOf(core));
        return lead + mark + core + mark + line.slice(lead.length + core.length);
      })
      .join('\n');
    return { from: start, to: end, text, sel: [start, start + text.length] };
  }
  const core = picked.trim();
  if (!core) return { from: end, to: end, text: mark + mark, sel: [end + m, end + m] };
  const s = start + picked.indexOf(core);
  const e = s + core.length;
  const before = starsBefore(value, s);
  const after = starsAfter(value, e);
  if (holds(mark, before) && holds(mark, after)) {
    return { from: s - m, to: e + m, text: core, sel: [s - m, e - m] };
  }
  const lead = starsAfter(core, 0);
  const tail = starsBefore(core, core.length);
  if (core.length - 2 * m > 0 && holds(mark, lead) && holds(mark, tail)) {
    const text = core.slice(m, core.length - m);
    return { from: s, to: e, text, sel: [s, s + text.length] };
  }
  if (before || after || lead || tail) return null;
  return { from: s, to: e, text: mark + core + mark, sel: [s + m, e + m] };
}

const PREFIX = { ul: /^- /, ol: /^\d{1,3}\. / } as const;

/** Returns the edit of a list button over the whole lines the selection touches: it
 *  removes the prefix when every non-empty line has it, else writes `- ` or `1. `, `2. `
 *  on each non-empty line in place of the other kind's prefix. */
export function toggleList(
  value: string,
  start: number,
  end: number,
  kind: 'ul' | 'ol'
): MarkupEdit {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  /* A selection that ends at a line's start leaves that line out. */
  const last = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const nl = value.indexOf('\n', last);
  const to = nl === -1 ? value.length : nl;
  const lines = value.slice(from, to).split('\n');
  const filled = lines.filter((l) => l !== '');
  const own = PREFIX[kind];
  const other = PREFIX[kind === 'ul' ? 'ol' : 'ul'];
  let text: string;
  if (filled.length && filled.every((l) => own.test(l))) {
    text = lines.map((l) => l.replace(own, '')).join('\n');
  } else {
    let n = 0;
    text = lines
      .map((l) => {
        if (l === '' && filled.length) return l;
        n += 1;
        const bare = l.replace(own, '').replace(other, '');
        return (kind === 'ul' ? '- ' : String(n) + '. ') + bare;
      })
      .join('\n');
  }
  const sel: [number, number] =
    start === end ? [from + text.length, from + text.length] : [from, from + text.length];
  return { from, to, text, sel };
}

/** Returns the edit of the table button: a 2-column head, the separator and one empty row
 *  after the line that holds the selection's end, with the first head cell selected. */
export function insertTable(
  value: string,
  _start: number,
  end: number,
  head: readonly [string, string]
): MarkupEdit {
  const nl = value.indexOf('\n', end);
  const at = nl === -1 ? value.length : nl;
  const line = value.slice(value.lastIndexOf('\n', at - 1) + 1, at);
  const next = nl === -1 ? '' : value.slice(nl + 1).split('\n', 1)[0];
  const lead = line === '' ? '' : '\n';
  const trail = next ? '\n' : '';
  const text = `${lead}| ${head[0]} | ${head[1]} |\n|---|---|\n|  |  |${trail}`;
  const h = at + lead.length + 2;
  return { from: at, to: at, text, sel: [h, h + head[0].length] };
}

/** Returns whether the value after `edit` stays within `maxlength` UTF-16 units, as the
 *  attribute counts them. */
export function fits(value: string, edit: MarkupEdit, maxlength: number): boolean {
  return value.length - (edit.to - edit.from) + edit.text.length <= maxlength;
}
