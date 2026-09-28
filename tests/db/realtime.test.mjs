/*
  Live updates through Realtime Broadcast from the database, with real
  WebSocket clients through the local gateway. A list change sends one
  message per list per transaction, with the final revision, to the
  owner's topic and to each active share's topic; a stopped share sends a
  null revision once; a refused write and a rolled-back transaction send
  nothing; only the policies decide who joins, and no client sends. The
  deferred trigger fires at commit, so these cases commit (commitAs) and
  delete their rows after. docs/specs/FEATURES.md, "Account and browser
  lists"; docs/decisions/2026-09-25-share-topics-use-topic-key-and-carry-only-a.md.
*/
import { after, afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  applySql,
  commitAs,
  connect,
  jwtFor,
  messagesTo,
  realtimePartition,
  realtimePolicies
} from './roles.mjs';

const MIGRATION = '20260927120000_realtime.sql';
const read = (dir) =>
  readFileSync(new URL(`../../supabase/${dir}/${MIGRATION}`, import.meta.url), 'utf8');
const RECEIVE_MS = 5000;
const QUIET_MS = 2000;
const uuid = () => crypto.randomUUID();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let sql;
const clients = new Set();

/** Joins `topic` as anon, or as the user of `token`, on a private channel
 * unless `isPrivate` is false. Returns `{ status, got, send }`: `status`
 * is the first answer to the join, `got` the messages received. */
async function listen(topic, { token, isPrivate = true } = {}) {
  const client = createClient(process.env.DHLOOT_API_URL, process.env.DHLOOT_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  clients.add(client);
  if (token) await client.realtime.setAuth(token);
  const channel = client.channel(topic, { config: { private: isPrivate } });
  const got = [];
  const status = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve('NO_ANSWER'), RECEIVE_MS * 2);
    channel.on('broadcast', { event: '*' }, (m) => got.push(m));
    channel.subscribe((s) => {
      if (s === 'CLOSED') return;
      clearTimeout(timer);
      resolve(s);
    });
  });
  const send = (event, payload) => channel.send({ type: 'broadcast', event, payload });
  return { status, got, send };
}

/** Waits until `got` holds `n` messages, at most RECEIVE_MS. */
async function received(got, n = 1) {
  const until = Date.now() + RECEIVE_MS;
  while (got.length < n && Date.now() < until) await pause(50);
  assert.ok(got.length >= n, `received ${got.length} of ${n} messages in ${RECEIVE_MS} ms`);
}

/** Returns a delivered payload without the message id that Realtime adds. */
function bare(message) {
  const { id, ...rest } = message.payload;
  assert.equal(id, message.meta?.id ?? id, 'the payload id is the message id');
  return rest;
}

const rowsOf = (topic) => messagesTo(sql, topic);

/** Commits a world for one case - A's list with five entries and three
 * shares (player and GM active, one revoked) - runs `fn`, then deletes it. */
async function withWorld(fn) {
  const a = uuid();
  const b = uuid();
  const list = uuid();
  const entries = [1, 2, 3, 4, 5].map(() => uuid());
  const share = { player: uuid(), gm: uuid(), revoked: uuid() };
  const topic = { player: uuid(), gm: uuid(), revoked: uuid() };
  await sql.begin(async (tx) => {
    await tx`insert into auth.users (id) values (${a}), (${b})`;
    await tx`insert into public.lists (id, owner_id, name) values (${list}, ${a}, 'L')`;
    for (const [i, e] of entries.entries()) {
      await tx`insert into public.list_entries (id, list_id, item_key, position)
        values (${e}, ${list}, ${'k' + i}, ${i})`;
    }
    await tx`insert into public.list_shares (id, list_id, audience, topic_key, revoked_at) values
      (${share.player}, ${list}, 'player', ${topic.player}, null),
      (${share.gm}, ${list}, 'gm', ${topic.gm}, null),
      (${share.revoked}, ${list}, 'player', ${topic.revoked}, now())`;
  });
  try {
    await fn({ a, b, list, entries, share, topic });
  } finally {
    await sql`delete from auth.users where id in (${a}, ${b})`;
  }
}

const entryOf = (itemKey, position) => ({
  id: uuid(),
  item_key: itemKey,
  source: 'official',
  snapshot: null,
  position,
  quantity: 1,
  price_coins: null,
  player_note: '',
  gm_note: ''
});
const asUser = (id, fn) => commitAs(sql, { role: 'authenticated', sub: id }, fn);
const revisionOf = async (list) =>
  (await sql`select revision::int as r from public.lists where id = ${list}`)[0]?.r ?? null;

before(async () => {
  sql = connect();
  await realtimePartition(sql);
  // The first send after Realtime starts can be lost (measured 2026-09-27
  // on this host): probe until one arrives.
  const probe = `share:${uuid()}`;
  const { status, got } = await listen(probe);
  assert.equal(status, 'SUBSCRIBED');
  const until = Date.now() + 30000;
  while (!got.length && Date.now() < until) {
    await sql`select realtime.send(${sql.json({ revision: 0 })}::jsonb, 'revision', ${probe}, true)`;
    await pause(500);
  }
  assert.ok(got.length, 'Realtime delivered no probe in 30 s');
});

/* Each case's clients leave when it ends, so a refused channel stops
   rejoining before the next case joins its own. */
afterEach(async () => {
  for (const c of clients) {
    await c.removeAllChannels();
    c.realtime.disconnect();
  }
  clients.clear();
});

after(async () => {
  await sql.end();
});

describe('the share topics', () => {
  it("sends an owner's list update to each active share topic once, with the final revision", async () => {
    await withWorld(async ({ a, list, topic }) => {
      const player = await listen(`share:${topic.player}`);
      const revoked = await listen(`share:${topic.revoked}`);
      assert.equal(player.status, 'SUBSCRIBED');
      const before = {
        player: (await rowsOf(`share:${topic.player}`)).length,
        gm: (await rowsOf(`share:${topic.gm}`)).length,
        revoked: (await rowsOf(`share:${topic.revoked}`)).length
      };
      await asUser(a, (tx) => tx`update public.lists set name = 'N' where id = ${list}`);
      const revision = await revisionOf(list);
      await received(player.got);
      await pause(QUIET_MS);
      assert.equal(player.got.length, 1);
      assert.deepEqual(bare(player.got[0]), { revision });
      assert.equal(player.got[0].event, 'revision');
      assert.equal(revoked.got.length, 0);
      const text = JSON.stringify(player.got[0].payload);
      for (const secret of [list, a]) assert.ok(!text.includes(secret), 'an id in the payload');
      assert.equal((await rowsOf(`share:${topic.player}`)).length, before.player + 1);
      assert.equal((await rowsOf(`share:${topic.gm}`)).length, before.gm + 1);
      assert.equal((await rowsOf(`share:${topic.revoked}`)).length, before.revoked);
    });
  });

  it("sends a reorder of five entries once per topic, with the list's final revision", async () => {
    await withWorld(async ({ a, list, entries, topic }) => {
      const player = await listen(`share:${topic.player}`);
      const was = await revisionOf(list);
      const before = (await rowsOf(`share:${topic.player}`)).length;
      const owner = (await rowsOf(`owner:${a}`)).length;
      await asUser(
        a,
        (tx) => tx`select public.reorder_list(${list}, ${[...entries].reverse()}::uuid[])`
      );
      const revision = await revisionOf(list);
      assert.equal(revision, was + 5);
      await received(player.got);
      await pause(QUIET_MS);
      assert.deepEqual(
        player.got.map((m) => bare(m)),
        [{ revision }]
      );
      assert.equal((await rowsOf(`share:${topic.player}`)).length, before + 1);
      const ownerRows = await rowsOf(`owner:${a}`);
      assert.equal(ownerRows.length, owner + 1);
      assert.equal(ownerRows.at(-1).payload.revision, revision);
    });
  });

  it('sends one apply_list_writes call of three writes once per topic, and a refused one not at all', async () => {
    await withWorld(async ({ a, list, entries, topic }) => {
      const t = `share:${topic.player}`;
      const before = {
        share: (await rowsOf(t)).length,
        owner: (await rowsOf(`owner:${a}`)).length
      };
      const ops = [
        { op: 'update', id: list, patch: { name: 'M' } },
        {
          op: 'add',
          list_id: list,
          entries: [entryOf('k9', 9)]
        },
        { op: 'remove_entries', ids: [entries[0]] }
      ];
      const [{ r }] = await asUser(
        a,
        (tx) => tx`select public.apply_list_writes(${tx.json(ops)}::jsonb) as r`
      );
      assert.deepEqual(r, [{ ok: true }, { ok: true }, { ok: true }]);
      const revision = await revisionOf(list);
      assert.deepEqual((await rowsOf(t)).slice(before.share), [
        { event: 'revision', payload: { revision } }
      ]);
      assert.equal((await rowsOf(`owner:${a}`)).length, before.owner + 1);

      const refused = [
        {
          op: 'add',
          list_id: list,
          entries: [entryOf('k1', 10)]
        }
      ];
      const [{ r: r2 }] = await asUser(
        a,
        (tx) => tx`select public.apply_list_writes(${tx.json(refused)}::jsonb) as r`
      );
      assert.equal(r2[0].code, '23505');
      assert.equal((await rowsOf(t)).length, before.share + 1);
      assert.equal((await rowsOf(`owner:${a}`)).length, before.owner + 1);
    });
  });

  it('discards the broadcast of a write refused inside apply_list_writes', async () => {
    await withWorld(async ({ a }) => {
      await sql`insert into public.user_limit_overrides (user_id, key, value)
        values (${a}, 'lists_per_owner', 1)`;
      const t = `owner:${a}`;
      const before = (await rowsOf(t)).length;
      const fresh = uuid();
      // The lists limit, not the entries limit: both entry triggers fire after
      // the insert, and the limit one raises before any touch updates `lists`,
      // so a refused add queues no broadcast to discard.
      const ops = [
        {
          op: 'create',
          list: { id: fresh, name: 'X', money_mode: 'bag', player_note: '', gm_note: '' },
          entries: []
        }
      ];
      const [{ r }] = await asUser(
        a,
        (tx) => tx`select public.apply_list_writes(${tx.json(ops)}::jsonb) as r`
      );
      assert.equal(r[0].code, 'P0001');
      const rows = await rowsOf(t);
      assert.equal(rows.length, before);
      assert.ok(
        !rows.some((row) => row.payload.list === fresh),
        'a row names the refused list'
      );
    });
  });

  it('sends nothing for a rolled-back transaction', async () => {
    await withWorld(async ({ a, list, topic }) => {
      const t = `share:${topic.player}`;
      const before = {
        share: (await rowsOf(t)).length,
        owner: (await rowsOf(`owner:${a}`)).length
      };
      const rollback = new Error('rollback');
      await assert.rejects(
        asUser(a, async (tx) => {
          await tx`update public.lists set name = 'R' where id = ${list}`;
          throw rollback;
        }),
        (err) => err === rollback
      );
      assert.equal((await rowsOf(t)).length, before.share);
      assert.equal((await rowsOf(`owner:${a}`)).length, before.owner);
    });
  });

  it("sends a null revision once when a share is revoked, and to each active share's topic when the list is deleted", async () => {
    await withWorld(async ({ a, list, share, topic }) => {
      const player = await listen(`share:${topic.player}`);
      const before = {
        player: (await rowsOf(`share:${topic.player}`)).length,
        gm: (await rowsOf(`share:${topic.gm}`)).length,
        revoked: (await rowsOf(`share:${topic.revoked}`)).length
      };
      await asUser(a, (tx) => tx`select public.revoke_list_share(${share.player})`);
      await asUser(a, (tx) => tx`select public.revoke_list_share(${share.player})`);
      await received(player.got);
      await pause(QUIET_MS);
      assert.deepEqual(
        player.got.map((m) => bare(m)),
        [{ revision: null }]
      );
      assert.equal((await rowsOf(`share:${topic.player}`)).length, before.player + 1);

      await asUser(a, (tx) => tx`delete from public.lists where id = ${list}`);
      assert.deepEqual((await rowsOf(`share:${topic.gm}`)).slice(before.gm), [
        { event: 'revision', payload: { revision: null } }
      ]);
      assert.equal((await rowsOf(`share:${topic.player}`)).length, before.player + 1);
      assert.equal((await rowsOf(`share:${topic.revoked}`)).length, before.revoked);
      assert.deepEqual((await rowsOf(`owner:${a}`)).at(-1), {
        event: 'list',
        payload: { list, revision: null, by: null }
      });
    });
  });
});

describe('the owner topic', () => {
  it('receives { list, revision, by } on an update, an insert and a delete', async () => {
    await withWorld(async ({ a, list }) => {
      const owner = await listen(`owner:${a}`, { token: jwtFor('authenticated', a) });
      assert.equal(owner.status, 'SUBSCRIBED');
      const other = uuid();
      await asUser(a, (tx) => tx`update public.lists set name = 'U' where id = ${list}`);
      const revision = await revisionOf(list);
      await asUser(
        a,
        (tx) => tx`insert into public.lists (id, owner_id, name) values (${other}, ${a}, 'O')`
      );
      await asUser(a, (tx) => tx`delete from public.lists where id = ${other}`);
      await received(owner.got, 3);
      assert.deepEqual(
        owner.got.map((m) => [m.event, bare(m)]),
        [
          ['list', { list, revision, by: null }],
          ['list', { list: other, revision: 1, by: null }],
          ['list', { list: other, revision: null, by: null }]
        ]
      );
    });
  });

  it('carries the x-dhloot-tab request header as by, and null for a malformed one', async () => {
    await withWorld(async ({ a, list }) => {
      const t = `owner:${a}`;
      const write = (headers) =>
        asUser(a, async (tx) => {
          await tx`select set_config('request.headers', ${headers}, true)`;
          await tx`update public.lists set name = ${uuid()} where id = ${list}`;
        });
      const before = (await rowsOf(t)).length;
      await write('{"x-dhloot-tab":"tab-1"}');
      await write('{"x-dhloot-tab":"bad tab!"}');
      await write('not json');
      assert.deepEqual(
        (await rowsOf(t)).slice(before).map((r) => r.payload.by),
        ['tab-1', null, null]
      );
    });
  });

  it('commits a write, with by null, on a connection whose headers were set in an earlier transaction', async () => {
    await withWorld(async ({ a, list }) => {
      const t = `owner:${a}`;
      const before = (await rowsOf(t)).length;
      await sql.begin(
        (tx) => tx`select set_config('request.headers', '{"x-dhloot-tab":"tab-1"}', true)`
      );
      const seen = await asUser(a, async (tx) => {
        const [{ h }] = await tx`select current_setting('request.headers', true) as h`;
        await tx`update public.lists set name = 'H' where id = ${list}`;
        return h;
      });
      assert.equal(seen, '');
      assert.deepEqual(
        (await rowsOf(t)).slice(before).map((r) => r.payload.by),
        [null]
      );
    });
  });
});

describe('who may join and send', () => {
  it("lets anon and a signed-in user join a share topic, and refuses a malformed one and every other owner's topic", async () => {
    await withWorld(async ({ a, b }) => {
      assert.equal((await listen(`share:${uuid()}`)).status, 'SUBSCRIBED');
      assert.equal(
        (await listen(`share:${uuid()}`, { token: jwtFor('authenticated', a) })).status,
        'SUBSCRIBED'
      );
      assert.equal((await listen('share:not-a-uuid')).status, 'CHANNEL_ERROR');
      assert.equal((await listen(`owner:${a}`)).status, 'CHANNEL_ERROR');
      assert.equal(
        (await listen(`owner:${a}`, { token: jwtFor('authenticated', b) })).status,
        'CHANNEL_ERROR'
      );
      assert.equal(
        (await listen(`owner:${a}`, { token: jwtFor('authenticated', a) })).status,
        'SUBSCRIBED'
      );
    });
  });

  it('delivers no message that a client sends on a private share channel', async () => {
    const topic = `share:${uuid()}`;
    const sender = await listen(topic);
    const reader = await listen(topic);
    assert.equal(reader.status, 'SUBSCRIBED');
    await sender.send('revision', { revision: 99 });
    await pause(QUIET_MS);
    assert.equal(reader.got.length, 0);
    await sql`select realtime.send(${sql.json({ revision: 1 })}::jsonb, 'revision', ${topic}, true)`;
    await received(reader.got);
    assert.deepEqual(bare(reader.got[0]), { revision: 1 });
  });

  it('delivers no database send to a public channel of a share topic', async () => {
    const topic = `share:${uuid()}`;
    const open = await listen(topic, { isPrivate: false });
    const closed = await listen(topic);
    assert.equal(open.status, 'SUBSCRIBED');
    await sql`select realtime.send(${sql.json({ revision: 2 })}::jsonb, 'revision', ${topic}, true)`;
    await received(closed.got);
    await pause(QUIET_MS);
    assert.equal(open.got.length, 0);
  });
});

describe('the realtime policies', () => {
  it('are named after the migration and gone after its reversal', async () => {
    const names = async () =>
      (await realtimePolicies(sql))
        .split('\n')
        .map((l) => l.split(' ')[0])
        .filter(Boolean);
    assert.deepEqual(await names(), [
      'dhloot_owner_topic_receive',
      'dhloot_share_topics_receive'
    ]);
    try {
      await applySql(sql, read('reversals'));
      assert.deepEqual(await names(), []);
    } finally {
      await applySql(sql, read('migrations'));
    }
    assert.deepEqual(await names(), [
      'dhloot_owner_topic_receive',
      'dhloot_share_topics_receive'
    ]);
  });
});
