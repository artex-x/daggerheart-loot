/* What a record looks like when it leaves the app.
 *
 * Two flavours of the same message. `text/html` carries the name in bold and
 * property labels in italic; `text/plain` carries the same words with no markup
 * at all - deliberately not Markdown, because an app that cannot take rich text
 * should receive readable text rather than stray asterisks.
 *
 * This is a public format in the sense that matters: it is pasted into other
 * people's chats, so changing it changes messages nobody can edit afterwards.
 * `docs/fixtures/share/records.json` was captured off the live app through the
 * clipboard - see tools/capture-share-fixture.mjs - and share.test.ts holds this
 * module to it character for character.
 *
 * Pure: it takes the index as data and returns strings. Nothing here touches a
 * clipboard; that is `ClipboardPort`'s job. */

import { dict } from './dict.js';
import type { Index } from './data.js';
import { descHtml, esc } from './desc.js';
import { descOf, eqLine, nameOf } from './i18n.js';
import type { Lang, Record_ } from './types.js';

/** An attached paragraph: a heading and a body, both of them plain text. */
export interface ShareBlock {
  head: string;
  body: string;
}

/**
 * What travels with a record: the far end of an upgrade chain, and the full text
 * of any rulebook card the description names. Without them the reader gets a
 * name and has to go looking.
 *
 * Forward along the chain only. "Made from" is useful on the card - it shows
 * where a thing comes from - but in a message to players it is the recipe for
 * something already in their hands.
 *
 * `skip` holds ids already present elsewhere in the same message, which is how a
 * copied roll of several records avoids repeating a shared upgrade target.
 */
export function shareBlocks(
  it: Record_,
  index: Index,
  lang: Lang,
  skip: ReadonlySet<string> = new Set()
): ShareBlock[] {
  const t = dict(lang);
  const out: ShareBlock[] = [];

  const into = it.craft ? index.byId.get(it.craft) : undefined;
  if (into && !skip.has(into.id)) {
    out.push({
      head: `${t.craftInto}: ${nameOf(into, lang)}`,
      body: descOf(into, lang) || ''
    });
  }

  for (const key of it.refs ?? []) {
    const r = index.refs[key];
    if (!r) continue;
    out.push(
      lang === 'ru'
        ? { head: `${r.ru} · ${r.rusub}`, body: r.rud }
        : { head: `${r.en} · ${r.ensub}`, body: r.ende }
    );
  }
  return out;
}

/**
 * The name as it reads outside the app.
 *
 * A bare name loses the Item/Consumable badge that the card shows, so for a
 * consumable it is spelled out - the one place the suffix appears.
 */
export function shareName(it: Record_, lang: Lang): string {
  const t = dict(lang);
  return nameOf(it, lang) + (it.kind === 'consumable' ? ` (${t.cons.toLowerCase()})` : '');
}

function statLine(it: Record_, lang: Lang): string {
  const t = dict(lang);
  return eqLine(it, lang, { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore });
}

/**
 * Both flavours of the message.
 *
 * Equipment leads with its stat line, tight under the name: the numbers belong
 * to the heading rather than to the prose, and someone scanning a pasted message
 * reads them before the feature. Attached blocks are italic rather than bold -
 * bold stays reserved for names, so a wall of pasted entries still reads as a
 * list - and each gets a blank line, because flush against the description they
 * ran together.
 *
 * `extra` is appended after the derived blocks. It exists for the note a list
 * entry carries: the note belongs to the list, and this module does not know
 * what a list is.
 */
export function share(
  it: Record_,
  index: Index,
  lang: Lang,
  opts: { skip?: ReadonlySet<string>; extra?: readonly ShareBlock[] } = {}
): { text: string; html: string } {
  const name = shareName(it, lang);
  const stats = statLine(it, lang);
  const desc = descOf(it, lang) || '';
  const blocks = [...shareBlocks(it, index, lang, opts.skip), ...(opts.extra ?? [])];

  const text =
    name +
    (stats ? '\n' + stats : '') +
    (desc ? '\n\n' + desc : '') +
    blocks.map((b) => `\n\n${b.head}\n${b.body}`).join('');

  const html =
    '<b>' +
    esc(name) +
    '</b>' +
    (stats ? '<br>' + esc(stats) : '') +
    (desc ? '<br><br>' + descHtml(it, lang) : '') +
    blocks
      .map((b) => '<br><br><i>' + esc(b.head) + '</i><br>' + esc(b.body).replace(/\n/g, '<br>'))
      .join('');

  return { text, html };
}
