/*
  The account API's print sets (docs/specs/CONTRACTS.md section 6, "Account API"): the cards
  of one print sheet stored as a set through `create_print_set`, as «Печать» stores them
  (`state/app.svelte.ts` `print`), from a list of cards or from one of the reader's lists. The
  reader prints at the set's page `<site>p/<id>`: the fit is measured in a browser, so the
  API makes no print file.
*/
import { entryOrder } from '../../app/src/lib/cloudLists.ts';
import { PRINT_MAX, appUrl, printSetHash } from '../../app/src/lib/hash.ts';
import { PRINT_SET_ID, printSetEntries } from '../../app/src/lib/printSet.ts';
import {
  UUID,
  arrayField,
  bad,
  call,
  intField,
  limitReached,
  meError,
  needed,
  notFound,
  pg,
  unavailable,
  uuidField
} from './me.mjs';

const Q_MAX = 99;
const PRINT_K = /^[a-z0-9_]{1,32}$/;

/** Returns the entries of `cards` (`[{ id, count? }]`): a catalog id is `k`, a homebrew item's
 *  uuid `h`, a count over 1 `q`. An id the catalog does not hold is 400. */
function entriesOfCards(body, facts) {
  const entries = arrayField(body, 'cards', 1, PRINT_MAX, (x) => {
    if (x === null || typeof x !== 'object' || Array.isArray(x)) {
      throw bad('Each item of the field cards must be an object.');
    }
    const count = intField(x, 'count', 1, Q_MAX) ?? 1;
    const q = count > 1 ? { q: count } : {};
    if (typeof x.id === 'string' && UUID.test(x.id.toLowerCase())) {
      return { h: x.id.toLowerCase(), ...q };
    }
    if (typeof x.id === 'string' && PRINT_K.test(x.id) && facts.has(x.id)) {
      return { k: x.id, ...q };
    }
    throw bad(
      `The card id ${JSON.stringify(String(x.id).slice(0, 64))} is neither a catalog record id nor a homebrew item uuid.`
    );
  });
  const keys = entries.map((e) => ('k' in e ? 'k:' + e.k : 'h:' + e.h));
  if (new Set(keys).size !== keys.length) throw bad('The field cards names a card twice.');
  return { entries, cut: 0, skipped: 0 };
}

/** Returns the entries «Печать» stores for a list: its entries in list order, each count
 *  over 1 as `q`, the first 180 (`cut` counts the rest); an entry with no record is left out
 *  and counted in `skipped`, as the press leaves out an id with no record. */
async function entriesOfList(ctx, id, facts) {
  const rows = needed(
    await pg(
      ctx,
      'GET',
      `lists?id=eq.${id}&select=id,list_entries(id,item_key,source,hb_item,position,quantity)`
    ),
    () =>
      meError(
        422,
        'answer_too_large',
        'The list is too large for the API. Print it in the app.'
      )
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) throw notFound('The list');
  const records = [];
  const qty = {};
  let skipped = 0;
  for (const e of [...row.list_entries].sort(entryOrder)) {
    if (e.source === 'homebrew' && typeof e.hb_item === 'string') {
      records.push({ id: e.item_key, src: 'homebrew', hid: e.hb_item });
    } else if (e.source !== 'homebrew' && facts.has(e.item_key)) {
      records.push({ id: e.item_key });
    } else {
      skipped++;
      continue;
    }
    qty[e.item_key] = e.quantity;
  }
  return { ...printSetEntries(records, qty), skipped };
}

async function createPrintSet(ctx, { body }) {
  if ((body.cards === undefined) === (body.list_id === undefined)) {
    throw bad('Send cards or list_id, one of the two.');
  }
  const facts = await ctx.service.catalogFacts();
  const listId = uuidField(body, 'list_id');
  const { entries, cut, skipped } =
    listId === undefined
      ? entriesOfCards(body, facts)
      : await entriesOfList(ctx, listId, facts);
  if (!entries.length) throw bad('The list holds no card to print.');
  const r = await call(ctx, 'create_print_set', { p_entries: entries });
  if (!r.ok) {
    const { code, message } = r.error ?? {};
    if (code === 'P0001' && /^limit: /.test(String(message))) throw limitReached(message);
    if (code === '22023') throw bad('The account refused the cards.');
    throw unavailable();
  }
  if (typeof r.value !== 'string' || !PRINT_SET_ID.test(r.value)) throw unavailable();
  const site = { base: ctx.site };
  return {
    status: 201,
    body: {
      format: 'daggerheart-loot/api-print-set',
      version: 1,
      id: r.value,
      link: appUrl(site, printSetHash(r.value), 'ru'),
      link_en: appUrl(site, printSetHash(r.value), 'en'),
      cards: entries.length,
      cut,
      skipped
    }
  };
}

/** The print operations by operationId (openapi.json). */
export const PRINT_OPS = { createPrintSet };
