/* A record's description, parsed once.
 *
 * The source is plain text with two conventions: a line beginning "- " is a list
 * item, and a line may open with a short property label followed by a colon.
 * Both the card and the clipboard need that structure, and they need it
 * rendered differently - the card draws a real `<ul>`, the clipboard cannot
 * (a list does not survive inside a `<span>`, and a browser closes a `<p>`
 * before one, losing the card's formatting for everything after it).
 *
 * So the parse lives here and returns data. The card renders it with Svelte
 * markup, which is why nothing in the new app has to inject HTML into the page;
 * `descHtml` builds the flat string the clipboard takes.
 *
 * Pure, and the label rule is deliberately conservative - see `splitLabel`. */

import type { Lang, Record_ } from './types.js';
import { descOf } from './i18n.js';

/** A label is a short property name, not every colon in the prose. */
const LABEL_MAX = 34;
/** Inside a list item the head is the name of an option, which runs longer. */
const LABEL_MAX_IN_LIST = 40;

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** One line: an optional property label, and the rest of it. */
export interface Line {
  label: string;
  body: string;
}

/**
 * Splits a property label off the head of a line, if there is one to split.
 *
 * Loot descriptions are full of "The GM decides: ..." and marking that up would
 * be noise rather than structure, so the head has to look like a name: short,
 * free of sentence punctuation, at most four words. Inside a list item the colon
 * separates the name of an option instead - "Calamity (Failure, Fear)" - where a
 * comma is legitimate, so only the length is checked there.
 */
export function splitLabel(line: string, inList = false): Line {
  const i = line.indexOf(': ');
  if (i < 0) return { label: '', body: line };
  const head = line.slice(0, i);
  const ok = inList
    ? head.length <= LABEL_MAX_IN_LIST
    : head.length <= LABEL_MAX && !/[,.;]/.test(head) && head.split(' ').length <= 4;
  return ok ? { label: head, body: line.slice(i + 1) } : { label: '', body: line };
}

/** Only equipment and Vault of Ages print named properties, so only they get labels. */
export function hasLabels(it: Record_): boolean {
  return !!it.eq || it.src === 'voa';
}

export type DescPart =
  { kind: 'line'; label: string; body: string } | { kind: 'list'; items: Line[] };

/**
 * The description as parts a component can render: runs of plain lines, and
 * runs of consecutive list items gathered into one list.
 */
export function descParts(it: Record_, lang: Lang): DescPart[] {
  const named = hasLabels(it);
  const read = (line: string, inList: boolean): Line =>
    named ? splitLabel(line, inList) : { label: '', body: line };

  const out: DescPart[] = [];
  for (const line of (descOf(it, lang) || '').split('\n')) {
    if (line.startsWith('- ')) {
      const last = out.at(-1);
      if (last?.kind === 'list') last.items.push(read(line.slice(2), true));
      else out.push({ kind: 'list', items: [read(line.slice(2), true)] });
      continue;
    }
    const { label, body } = read(line, false);
    out.push({ kind: 'line', label, body });
  }
  return out;
}

/** A single line as HTML, with the label in italics. */
export function lineHtml(line: string, inList = false): string {
  const { label, body } = splitLabel(line, inList);
  return label ? '<i>' + esc(label) + ':</i>' + esc(body) : esc(line);
}

/**
 * The description flattened for the clipboard: one run of lines, list items
 * marked with a bullet rather than wrapped in a real list.
 */
export function descHtml(it: Record_, lang: Lang): string {
  const named = hasLabels(it);
  const lab = (line: string, inList = false): string =>
    named ? lineHtml(line, inList) : esc(line);
  return (descOf(it, lang) || '')
    .split('\n')
    .map((l) => (l.startsWith('- ') ? '• ' + lab(l.slice(2), true) : lab(l)))
    .join('<br>');
}
