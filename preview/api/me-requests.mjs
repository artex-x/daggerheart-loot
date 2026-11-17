/*
  The account API's purchase requests and notices (docs/specs/CONTRACTS.md section 6,
  "Account API"): the owner's pending requests of one list and of every list, a decision
  (accept, accept what the list holds, decline), the read mark, the notices' hide, and a
  request to another reader's shared list. Every call is one the app makes
  (`ports/supabase.ts`, `requests`): the reads of `purchase_requests` and `list_notices`, and
  the functions `apply_purchase_request`, `decline_purchase_request`, `mark_list_read` and
  `create_purchase_request`. The rows are read by `lib/requests.ts`.

  An operation takes `(ctx, input)` as me-lists.mjs describes.
*/
import {
  noticeOf,
  readApplied,
  readRequestHeads,
  readRequests,
  requestRefusal
} from '../../app/src/lib/requests.ts';
import {
  arrayField,
  bad,
  boolField,
  call,
  confirmed,
  cursorOf,
  idsField,
  intField,
  limitReached,
  meError,
  needed,
  notFound,
  pageOf,
  pg,
  unavailable,
  uuidField
} from './me.mjs';

/** The most notices one hide takes: the bulk cap; 100 ids are about 3.7 kB of address. */
const NOTICES_MAX = 100;
/** The most lines of one request: the `request_lines` default limit. */
const LINES_MAX = 100;
const QTY_MAX = 99;
const ITEM_KEY = /^[A-Za-z0-9_-]{1,64}$/;

/** The most notices the first page of a list's requests carries; 150 rows are about 50 kB. */
const NOTICES_READ = 150;

const HEAD = 'id,list_id,audience,created_at,expires_at,read_at';
/* A pending line has no applied_quantity, and the short names keep 10 requests of 100 lines
   under ME_READ_MAX; `unpacked` gives the rows the names `readRequests` reads. */
const PENDING_LINES = 'l:purchase_request_lines(k:item_key,q:quantity,p:price_coins)';
const DECIDED =
  'id,list_id,audience,status,created_at,decided_at,' +
  'purchase_request_lines(item_key,quantity,price_coins,applied_quantity)';
const NOTICE = 'id,list_id,item_key,hid,kind,name,created_at,read_at';

/** Returns the rows of a pending read with the column names of `purchase_request_lines`. */
const unpacked = (rows) =>
  Array.isArray(rows)
    ? rows.map((r) => {
        if (r === null || typeof r !== 'object' || !Array.isArray(r.l)) return r;
        const { l, ...head } = r;
        return {
          ...head,
          purchase_request_lines: l.map((x) => ({
            item_key: x?.k,
            quantity: x?.q,
            price_coins: x?.p,
            applied_quantity: null
          }))
        };
      })
    : rows;

const smallerLimit = () =>
  meError(
    422,
    'answer_too_large',
    'The page of requests is too large for the API. Send a smaller limit.'
  );

/** Returns a head of the answer; a pending request past `expires_at` is `expired`. */
const headOf = (h, now) => ({
  id: h.id,
  list_id: h.listId,
  audience: h.audience,
  created_at: h.createdAt,
  read_at: h.readAt,
  expires_at: h.expiresAt,
  expired: Date.parse(h.expiresAt) <= now
});

const lineOf = (l) => ({
  key: l.item,
  quantity: l.qty,
  price_coins: l.price,
  applied_quantity: l.applied
});

/** Returns the `next` cursor of a page read with `limit + 1` rows. */
const nextOf = (rows, limit) => (rows.length > limit ? cursorOf(rows[limit - 1].id) : null);
const after = (from) => (from ? `&id=gt.${from}` : '');

async function listRequests(ctx, { params, query }) {
  const id = params.list_id;
  const { limit, after: from } = pageOf(query);
  const first = from === null;
  const [list, page, notices] = await Promise.all([
    pg(ctx, 'GET', `lists?id=eq.${id}&select=id`),
    pg(
      ctx,
      'GET',
      `purchase_requests?list_id=eq.${id}&status=eq.pending&select=${HEAD},${PENDING_LINES}` +
        `&order=id.asc&limit=${String(limit + 1)}${after(from)}`
    ),
    first
      ? pg(
          ctx,
          'GET',
          `list_notices?list_id=eq.${id}&select=${NOTICE}&order=created_at.desc,id.asc` +
            `&limit=${String(NOTICES_READ + 1)}`
        )
      : null
  ]);
  const held = needed(list);
  if (!Array.isArray(held) || !held.length) throw notFound('The list');
  const rows = readRequests(unpacked(needed(page, smallerLimit)));
  if (rows === null) throw unavailable();
  /* Notices past the read or its byte cap never cost the requests: the page answers
     notices_more, and the client hides the notices it has shown, then reads again. */
  let read = null;
  let more = null;
  if (notices) {
    read = notices.big ? null : needed(notices);
    if (read !== null && !Array.isArray(read)) throw unavailable();
    more = read === null || read.length > NOTICES_READ;
    if (read !== null) read = read.slice(0, NOTICES_READ);
  }
  const now = ctx.now();
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-requests',
      version: 1,
      list_id: id,
      requests: rows
        .slice(0, limit)
        .map((r) => ({ ...headOf(r, now), lines: r.lines.map(lineOf) })),
      notices:
        read === null
          ? null
          : read
              .map(noticeOf)
              .filter((n) => n !== null)
              .map((n) => ({
                id: n.id,
                key: n.itemKey,
                record_id: n.hid,
                kind: n.kind,
                name: { ru: n.name.ru, en: n.name.en },
                created_at: n.createdAt,
                read_at: n.readAt
              })),
      notices_more: more,
      next: nextOf(rows, limit)
    }
  };
}

async function listMyRequests(ctx, { query }) {
  const { limit, after: from } = pageOf(query);
  const first = from === null;
  const [page, unread] = await Promise.all([
    pg(
      ctx,
      'GET',
      `purchase_requests?status=eq.pending&select=${HEAD}` +
        `&order=id.asc&limit=${String(limit + 1)}${after(from)}`
    ),
    /* One read of every list's unread count, as «Новое в списке (N)» counts them. */
    first
      ? pg(
          ctx,
          'GET',
          'lists?select=id,list_notices(count)&list_notices.read_at=is.null&order=id.asc'
        )
      : null
  ]);
  const heads = readRequestHeads(needed(page, smallerLimit));
  if (heads === null) throw unavailable();
  let counts = null;
  if (unread) {
    const lists = needed(unread, () =>
      meError(422, 'answer_too_large', 'The notice counts are too large for the API.')
    );
    if (!Array.isArray(lists)) throw unavailable();
    counts = lists
      .map((l) => ({ list_id: l.id, count: Number(l.list_notices?.[0]?.count ?? 0) }))
      .filter((c) => c.count > 0);
  }
  const now = ctx.now();
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-pending-requests',
      version: 1,
      requests: heads.slice(0, limit).map((h) => headOf(h, now)),
      unread_notices: counts,
      next: nextOf(heads, limit)
    }
  };
}

/** Returns the error of a refused request function (`lib/requests.ts` `requestRefusal`); a
 *  decided request answers its decision through `decided`. */
async function refusedDecision(ctx, id, r, want) {
  const { code, message } = r.error ?? {};
  const known = requestRefusal(code, message);
  if (known === 'gone') throw notFound('The request');
  if (known === 'decided') return decision(ctx, id, want);
  if (known === 'expired') {
    throw meError(
      409,
      'conflict',
      'The request expired before a decision. The players can send it again.',
      { status: 'expired' }
    );
  }
  throw unavailable();
}

/**
 * Reads a decided request and answers it, or throws: a request decided the other way is 409
 * `conflict` with its `status`, so a retry of the same decision answers as the first call did.
 */
async function decision(ctx, id, want) {
  const rows = needed(await pg(ctx, 'GET', `purchase_requests?id=eq.${id}&select=${DECIDED}`));
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) throw notFound('The request');
  if (row.status !== want) {
    throw meError(
      409,
      'conflict',
      row.status === 'pending'
        ? 'The request is still pending.'
        : `The request was ${String(row.status)} already.`,
      { status: row.status }
    );
  }
  const lines = (Array.isArray(row.purchase_request_lines) ? row.purchase_request_lines : [])
    .map((l) => ({
      key: l.item_key,
      quantity: l.quantity,
      price_coins: l.price_coins ?? null,
      applied_quantity: l.applied_quantity ?? null
    }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-request',
      version: 1,
      id: row.id,
      list_id: row.list_id,
      audience: row.audience,
      status: row.status,
      created_at: row.created_at,
      decided_at: row.decided_at,
      taken: lines.reduce((n, l) => n + (l.applied_quantity ?? 0), 0),
      lines
    }
  };
}

async function acceptRequest(ctx, { params, body }) {
  const id = params.request_id;
  const clamp = boolField(body, 'clamp') === true;
  const r = await call(ctx, 'apply_purchase_request', { p_id: id, p_clamp: clamp });
  if (!r.ok) return refusedDecision(ctx, id, r, 'applied');
  const applied = readApplied(r.value);
  if (applied === null) throw unavailable();
  if (!applied.ok) {
    throw meError(
      409,
      'short',
      clamp
        ? 'The list holds none of the items the request asks for. The list did not change; the request is now read and expires within the hour. Decline it, or add stock first.'
        : 'The list holds less than the request asks for. The list did not change; the request is now read and expires within the hour. Show the reader short, then send clamp: true to take what the list holds, or decline.',
      { short: applied.short.map((s) => ({ key: s.item, want: s.want, have: s.have })) }
    );
  }
  return decision(ctx, id, 'applied');
}

async function declineRequest(ctx, { params }) {
  const id = params.request_id;
  const r = await call(ctx, 'decline_purchase_request', { p_id: id });
  if (!r.ok) return refusedDecision(ctx, id, r, 'declined');
  return decision(ctx, id, 'declined');
}

async function markListRead(ctx, { params }) {
  const r = await call(ctx, 'mark_list_read', { p_list: params.list_id });
  if (!r.ok) throw r.error?.code === '42501' ? notFound('The list') : unavailable();
  return { status: 204 };
}

async function hideNotices(ctx, { body }) {
  const ids = idsField(body, 'ids', 1, NOTICES_MAX);
  confirmed(body, ids.length);
  /* A notice already gone deletes nothing: a retry answers each id as hidden. */
  const r = await pg(ctx, 'DELETE', `list_notices?id=in.(${ids.join(',')})`);
  if (!r.ok) throw unavailable();
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-results',
      version: 1,
      results: ids.map((id) => ({ id, result: 'ok' }))
    }
  };
}

async function sendRequest(ctx, { params, body }) {
  const token = params.token;
  const id = uuidField(body, 'id') ?? crypto.randomUUID();
  const lines = arrayField(body, 'lines', 1, LINES_MAX, (x) => {
    if (x === null || typeof x !== 'object' || Array.isArray(x)) {
      throw bad('Each item of the field lines must be an object.');
    }
    if (typeof x.key !== 'string' || !ITEM_KEY.test(x.key)) {
      throw bad("Each line's key must be an entry key of the shared list.");
    }
    const quantity = intField(x, 'quantity', 1, QTY_MAX);
    if (quantity === undefined) throw bad("Each line's quantity is required.");
    return { key: x.key, quantity };
  });
  if (new Set(lines.map((l) => l.key)).size !== lines.length) {
    throw bad('The field lines names a key twice.');
  }
  /* The app sends no request to the reader's own list (`requestToken` is null when
     `view.mine`): the owner changes the list itself. */
  const own = needed(
    await pg(ctx, 'GET', `list_shares?token=eq.${token}&revoked_at=is.null&select=list_id`)
  );
  if (Array.isArray(own) && own.length) {
    throw meError(
      409,
      'conflict',
      "The shared list is the reader's own list. Change it with update_list_entry or remove_from_list."
    );
  }
  const r = await call(ctx, 'create_purchase_request', {
    p_id: id,
    p_token: token,
    p_lines: lines.map((l) => ({ item: l.key, qty: l.quantity }))
  });
  if (!r.ok) {
    const { code, message } = r.error ?? {};
    const known = requestRefusal(code, message);
    if (known === 'gone') throw notFound('The shared list');
    if (known === 'stale') {
      throw meError(
        409,
        'conflict',
        'An item of the request is not in the shared list any more. Read the shared list again.'
      );
    }
    if (code === 'P0001' && /^limit: /.test(String(message))) throw limitReached(message);
    if (code === '22023') throw bad('The account refused the lines.');
    throw unavailable();
  }
  return {
    status: 201,
    body: {
      format: 'daggerheart-loot/api-sent-request',
      version: 1,
      id,
      lines
    }
  };
}

/** The request operations by operationId (openapi.json). */
export const REQUEST_OPS = {
  listRequests,
  acceptRequest,
  declineRequest,
  markListRead,
  hideNotices,
  sendRequest,
  listMyRequests
};
