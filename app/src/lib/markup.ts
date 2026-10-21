/* The formatted text of every long text field: a line-based Markdown subset
 * (docs/specs/FEATURES.md, "Records", "Formatted text").
 *
 * One source line is one block, so a record's line breaks stay as they are;
 * CommonMark would join two lines into one paragraph. The parse returns data:
 * the app renders it with Svelte elements and never writes the source as HTML.
 *
 * No imports and erasable TypeScript only: the build tools and the preview
 * host load this file directly (docs/decisions/, 2026-10-15, "Descriptions use
 * a line-based Markdown subset parsed by one module"). */

export type MarkupInline = { t: 'text'; v: string } | { t: 'b' | 'i'; c: MarkupInline[] };

export type MarkupBlock =
  | { t: 'p'; c: MarkupInline[] }
  | { t: 'ul'; items: MarkupInline[][] }
  | { t: 'ol'; start: number; items: MarkupInline[][] }
  | { t: 'table'; head: MarkupInline[][]; rows: MarkupInline[][][] };

const SEPARATOR = /^\|(\s*:?-{3,}:?\s*\|)+\s*$/;
const NUMBERED = /^(\d{1,3})\. /;
const PUNCT = /[!-/:-@[-`{-~]/;
const SPACE = /\s/;

type Kind = 'b' | 'i';
interface Span {
  kind: Kind;
  /** Whether a later run closes it; an unmatched span stays text. */
  matched: boolean;
  /** The run that opened it. */
  run: Run;
}
interface Run {
  /** Stars in the run. */
  n: number;
  /** The next character is not a space, and the previous one is not a space. */
  canOpen: boolean;
  canClose: boolean;
  /** Spans this run closes, innermost first. */
  closes: Kind[];
  /** Spans this run opens, outermost first. */
  opens: Span[];
}
type Token = { text: string } | { run: Run };

const starsOf = (kind: Kind): number => (kind === 'b' ? 2 : 1);

/** Returns the tokens of one line: text and star runs, escapes resolved. */
function tokenize(line: string): Token[] {
  const out: Token[] = [];
  let text = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i] ?? '';
    const next = line[i + 1] ?? '';
    if (ch === '\\' && PUNCT.test(next)) {
      text += next;
      i += 2;
      continue;
    }
    if (ch !== '*') {
      text += ch;
      i += 1;
      continue;
    }
    let n = 0;
    while (line[i + n] === '*') n += 1;
    const before = line[i - 1];
    const after = line[i + n];
    if (text) out.push({ text });
    text = '';
    /* A run longer than three is text: no span of the subset needs it. */
    const marks = n <= 3;
    out.push({
      run: {
        n,
        canOpen: marks && after !== undefined && !SPACE.test(after),
        canClose: marks && before !== undefined && !SPACE.test(before),
        closes: [],
        opens: []
      }
    });
    i += n;
  }
  if (text) out.push({ text });
  return out;
}

/** Matches the star runs of `tokens`: each closer takes the nearest open span of its kind. */
function match(tokens: readonly Token[]): void {
  const stack: Span[] = [];
  for (const tok of tokens) {
    if (!('run' in tok)) continue;
    const run = tok.run;
    let left: Kind[] = run.n === 1 ? ['i'] : run.n === 2 ? ['b'] : ['b', 'i'];
    if (run.canClose) {
      for (;;) {
        let k = stack.length - 1;
        while (k >= 0 && !left.includes(stack[k]?.kind ?? 'i')) k -= 1;
        const span = stack[k];
        if (!span) break;
        /* `***a** b*`: the spans of one `***` run hold no text between them, so the one
           this closer finds becomes the inner one, and the other stays open. */
        if (k < stack.length - 1 && stack.slice(k + 1).every((s) => s.run === span.run)) {
          stack.splice(k, 1);
          stack.push(span);
          const opens = span.run.opens;
          opens.splice(opens.indexOf(span), 1);
          opens.push(span);
          k = stack.length - 1;
        }
        /* Spans opened inside the one that closes stay text. */
        stack.length = k;
        span.matched = true;
        run.closes.push(span.kind);
        left = left.filter((kind) => kind !== span.kind);
      }
    }
    if (run.canOpen) {
      for (const kind of left) {
        const span = { kind, matched: false, run };
        run.opens.push(span);
        stack.push(span);
      }
    }
  }
}

/** Returns the inline tree of one line, an unmatched star run kept as text. */
function inline(line: string): MarkupInline[] {
  if (!line.includes('*') && !line.includes('\\')) return line ? [{ t: 'text', v: line }] : [];
  const tokens = tokenize(line);
  match(tokens);
  const root: MarkupInline[] = [];
  const nodes: MarkupInline[][] = [root];
  const add = (v: string): void => {
    const into = nodes[nodes.length - 1] ?? root;
    const last = into[into.length - 1];
    if (last?.t === 'text') last.v += v;
    else if (v) into.push({ t: 'text', v });
  };
  for (const tok of tokens) {
    if (!('run' in tok)) {
      add(tok.text);
      continue;
    }
    const run = tok.run;
    for (const kind of run.closes) {
      const c = nodes.pop() ?? [];
      (nodes[nodes.length - 1] ?? root).push({ t: kind, c });
    }
    const opened = run.opens.filter((s) => s.matched);
    const used = [...run.closes, ...opened.map((s) => s.kind)];
    const stars = run.n - used.reduce((sum, kind) => sum + starsOf(kind), 0);
    if (stars > 0) add('*'.repeat(stars));
    opened.forEach(() => nodes.push([]));
  }
  return root;
}

/** Returns the cells of a table line: split on an unescaped `|`, the outer pipes dropped. */
function cells(line: string): string[] {
  const out: string[] = [];
  let cell = '';
  for (let i = 1; i < line.length; i += 1) {
    const ch = line[i] ?? '';
    if (ch === '\\' && PUNCT.test(line[i + 1] ?? '')) {
      cell += ch + (line[i + 1] ?? '');
      i += 1;
    } else if (ch === '|') {
      out.push(cell);
      cell = '';
    } else cell += ch;
  }
  if (cell.trim()) out.push(cell);
  return out.map((c) => c.trim());
}

/** Returns the block tree of `src`: one block per source line, consecutive items in one list. */
export function parseMarkup(src: string): MarkupBlock[] {
  const lines = src.split('\n');
  const out: MarkupBlock[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const last = out[out.length - 1];
    if (line.startsWith('|') && SEPARATOR.test(lines[i + 1] ?? '')) {
      const head = cells(line);
      const rows: MarkupInline[][][] = [];
      i += 2;
      while (i < lines.length && (lines[i] ?? '').startsWith('|')) {
        const row = cells(lines[i] ?? '').slice(0, head.length);
        while (row.length < head.length) row.push('');
        rows.push(row.map(inline));
        i += 1;
      }
      i -= 1;
      out.push({ t: 'table', head: head.map(inline), rows });
      continue;
    }
    if (line.startsWith('- ')) {
      const item = inline(line.slice(2));
      if (last?.t === 'ul') last.items.push(item);
      else out.push({ t: 'ul', items: [item] });
      continue;
    }
    const num = NUMBERED.exec(line);
    if (num) {
      const item = inline(line.slice(num[0].length));
      if (last?.t === 'ol') last.items.push(item);
      else out.push({ t: 'ol', start: Number(num[1]), items: [item] });
      continue;
    }
    out.push({ t: 'p', c: inline(line) });
  }
  return out;
}

/** Returns `c` after one space, as the text that follows a lead such as a set bonus's
 *  name: the space joins the first text node, so the text reads as one run. */
export function afterLead(c: readonly MarkupInline[]): MarkupInline[] {
  const [first, ...rest] = c;
  return first?.t === 'text'
    ? [{ t: 'text', v: ' ' + first.v }, ...rest]
    : [{ t: 'text', v: ' ' }, ...c];
}

/* Returns `n` with `tail` added to its deepest last text, or null when it ends in no text. */
function withTail(n: MarkupInline, tail: string): MarkupInline | null {
  if (n.t === 'text') return { t: 'text', v: n.v + tail };
  const last = n.c[n.c.length - 1];
  const glued = last ? withTail(last, tail) : null;
  return glued ? { t: n.t, c: [...n.c.slice(0, -1), glued] } : null;
}

/** Returns `c` with each text node of spaces only between two marked runs joined to the
 *  last text of the run before it, at every depth. Between Svelte's anchor comments Chrome
 *  drops a space-only text node from a button's name ("Свет:Потратьте", measured
 *  2026-10-16); a space at the end of a text it keeps. */
export function glueSpaces(c: readonly MarkupInline[]): MarkupInline[] {
  const out: MarkupInline[] = [];
  c.forEach((n, k) => {
    const prev = out[out.length - 1];
    const next = c[k + 1];
    if (
      n.t === 'text' &&
      /^ +$/.test(n.v) &&
      prev !== undefined &&
      prev.t !== 'text' &&
      next !== undefined &&
      next.t !== 'text'
    ) {
      const glued = withTail(prev, n.v);
      if (glued) {
        out[out.length - 1] = glued;
        return;
      }
    }
    out.push(n.t === 'text' ? n : { t: n.t, c: glueSpaces(n.c) });
  });
  return out;
}

/** Returns the text of an inline tree with no markers. */
export function inlineText(c: readonly MarkupInline[]): string {
  return c.map((n) => (n.t === 'text' ? n.v : inlineText(n.c))).join('');
}

/** Returns the lines of `src` as they read with no markup, list marks and cell bars kept. */
function plainLines(src: string): string[] {
  const out: string[] = [];
  for (const b of parseMarkup(src)) {
    if (b.t === 'p') out.push(inlineText(b.c));
    else if (b.t === 'ul') for (const item of b.items) out.push('- ' + inlineText(item));
    else if (b.t === 'ol')
      b.items.forEach((item, k) => out.push(String(b.start + k) + '. ' + inlineText(item)));
    else for (const row of [b.head, ...b.rows]) out.push(row.map(inlineText).join(' | '));
  }
  return out;
}

/** Returns the plain projection of `src`: markers and escapes removed, one line per
 *  source line, `- ` and `N. ` kept, a table row as its cells joined by ` | `. */
export function markupText(src: string): string {
  return plainLines(src).join('\n');
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inlineHtml(c: readonly MarkupInline[]): string {
  return c
    .map((n) => (n.t === 'text' ? esc(n.v) : `<${n.t}>${inlineHtml(n.c)}</${n.t}>`))
    .join('');
}

/** Returns the flat HTML the clipboard takes: `<b>`, `<i>` and `<br>` only, a list item
 *  marked `• ` or `N. `, a table row as its cells joined by ` | `, every text escaped. */
export function markupHtml(src: string): string {
  const out: string[] = [];
  for (const b of parseMarkup(src)) {
    if (b.t === 'p') out.push(inlineHtml(b.c));
    else if (b.t === 'ul') for (const item of b.items) out.push('• ' + inlineHtml(item));
    else if (b.t === 'ol')
      b.items.forEach((item, k) => out.push(String(b.start + k) + '. ' + inlineHtml(item)));
    else for (const row of [b.head, ...b.rows]) out.push(row.map(inlineHtml).join(' | '));
  }
  return out.join('<br>');
}
