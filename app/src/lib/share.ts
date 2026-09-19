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

import { dict, type Dict } from './dict.js';
import { setBonusOf, setOf, type Index } from './data.js';
import { descHtml, esc } from './desc.js';
import { descOf, eqLine, nameOf, namesOf } from './i18n.js';
import type { ListEntryMeta, ListShape } from './listLink.js';
import { moneyMode, priceText } from './money.js';
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
 * The upgrade's body carries only the lines of its description that this
 * record's own description does not already carry: a chain's rungs repeat
 * the features they keep, and a message should say only what the next rung adds.
 *
 * A set's shared bonus is not a record, so `skip` never drops it: it is written
 * under each member, also when both members are in one message.
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
    const own = new Set(descOf(it, lang).split('\n'));
    out.push({
      head: `${t.craftInto}: ${nameOf(into, lang)}`,
      body: descOf(into, lang)
        .split('\n')
        .filter((line) => line && !own.has(line))
        .join('\n')
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

  const members = setOf(index, it);
  if (members.length) {
    const bonus = setBonusOf(index, it);
    out.push({
      head: `${t.setLabel}: ${namesOf(members, lang)}`,
      body: !bonus
        ? ''
        : lang === 'ru'
          ? `${bonus.ru}: ${bonus.rud}`
          : `${bonus.en}: ${bonus.ende}`
    });
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

/** A record's name, safe to use as a downloaded or shared file's name - the
 *  live `safeFileName` (app.js 1713-1715): strip the characters Windows and
 *  macOS both refuse in a filename, keep everything else. The bare name, not
 *  `shareName`'s consumable suffix - live's own `safeFileName` calls `nameOf`
 *  directly, not `nameForShare`. */
export function imageFileName(it: Record_, lang: Lang): string {
  return nameOf(it, lang).replace(/[\\/:*?"<>|]/g, '') + '.png';
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
 *
 * `suffix` is appended to the name itself, inside the bold run - the live
 * `itemLine` (app.js 1313-1318) is one bold run of name plus quantity plus
 * price, not a name followed by separate runs.
 */
export function share(
  it: Record_,
  index: Index,
  lang: Lang,
  opts: {
    skip?: ReadonlySet<string>;
    extra?: readonly ShareBlock[] | undefined;
    suffix?: string;
  } = {}
): { text: string; html: string } {
  const name = shareName(it, lang) + (opts.suffix ?? '');
  const stats = statLine(it, lang);
  const desc = descOf(it, lang) || '';
  const blocks = [...shareBlocks(it, index, lang, opts.skip), ...(opts.extra ?? [])];

  const text =
    name +
    (stats ? '\n' + stats : '') +
    (desc ? '\n\n' + desc : '') +
    blocks.map((b) => '\n\n' + b.head + (b.body ? '\n' + b.body : '')).join('');

  const html =
    '<b>' +
    esc(name) +
    '</b>' +
    (stats ? '<br>' + esc(stats) : '') +
    (desc ? '<br><br>' + descHtml(it, lang) : '') +
    blocks
      .map(
        (b) =>
          '<br><br><i>' +
          esc(b.head) +
          '</i>' +
          (b.body ? '<br>' + esc(b.body).replace(/\n/g, '<br>') : '')
      )
      .join('');

  return { text, html };
}

/**
 * A whole roll as one message.
 *
 * A roll offers several options and the player picks one, so the GM wants to
 * paste them together with the OR spelled out rather than send them one at a
 * time. Every record in the roll is in the skip set, so a craft chain or a
 * rulebook card that two of them share is written once rather than repeated
 * under each.
 */
export function shareRoll(
  items: readonly Record_[],
  index: Index,
  lang: Lang,
  or: string
): { text: string; html: string } {
  const skip = new Set(items.map((it) => it.id));
  const parts = items.map((it) => share(it, index, lang, { skip }));
  return {
    text: parts.map((p) => p.text).join(`\n\n— ${or} —\n\n`),
    html: parts.map((p) => p.html).join(`<br><br><b>— ${or} —</b><br><br>`)
  };
}

/**
 * A ticked selection as one message - `selAsText`/`selAsHtml` in app.js
 * (1961-1966).
 *
 * A set, not alternatives: unlike `shareRoll`, there is no `skip` and no OR
 * between entries. A roll offers options a player picks one of; a selection
 * is a list of things somebody is actually taking, so a craft target two of
 * them share is written out under each rather than once for the group.
 */
export function shareSelection(
  items: readonly Record_[],
  index: Index,
  lang: Lang
): { text: string; html: string } {
  const parts = items.map((it) => share(it, index, lang));
  return {
    text: parts.map((p) => p.text).join('\n\n'),
    html: parts.map((p) => p.html).join('<br><br>')
  };
}

/**
 * The one block `contextNote` attaches (app.js 568-573): while a list is
 * open, copying one of its entries appends the players' note it carries
 * there. The GM's own note never travels - it stays with the list. Lives
 * here, not on the list page, so the roll card and the record modal can pass
 * the same thing the list page's own rows do.
 */
export function entryNoteBlock(meta: ListEntryMeta, t: Dict): ShareBlock[] {
  return meta.note ? [{ head: t.noteHead, body: meta.note }] : [];
}

/** Returns the count that follows a name in copied text and on a print card. */
export function qtySuffix(qty: number | undefined): string {
  return qty && qty > 1 ? ` ×${String(qty)}` : '';
}

/**
 * A whole list as one message - the live `listAsText`/`listAsHtml` (app.js
 * 1609-1647). The list's own note (the players' one; the GM's stays home)
 * sits right under the name as a preamble, then every known entry, each
 * carrying its quantity and price in the same bold run as its name
 * (`itemLine`), its derived blocks, and its own note last.
 */
export function shareList(
  list: ListShape,
  index: Index,
  lang: Lang,
  t: Dict
): { text: string; html: string } {
  const skip = new Set(list.ids);
  const mode = moneyMode(list);

  const noteText = list.note ? `\n\n${t.noteHead}\n${list.note}` : '';
  const noteHtml = list.note
    ? '<br><br><i>' + esc(t.noteHead) + '</i><br>' + esc(list.note).replace(/\n/g, '<br>')
    : '';

  const parts = list.ids
    .map((id): Record_ | undefined => index.byId.get(id))
    .filter((it): it is Record_ => it != null)
    .map((it) => {
      const meta: ListEntryMeta = list.meta?.[it.id] ?? {};
      const suffix =
        qtySuffix(meta.qty) + (meta.gold ? ` — ${priceText(meta.gold, mode, lang)}` : '');
      return share(it, index, lang, { skip, suffix, extra: entryNoteBlock(meta, t) });
    });

  return {
    text: [list.name + noteText, ...parts.map((p) => p.text)].join('\n\n'),
    html: ['<b>' + esc(list.name) + '</b>' + noteHtml, ...parts.map((p) => p.html)].join(
      '<br><br>'
    )
  };
}
