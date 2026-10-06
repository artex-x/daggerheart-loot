/* The real adapter's mapping, over a stub supabase-js client - layer 1's
   "ports against fake clients". The client itself meets the hosted test
   project in the E2E layer (docs/specs/COVERAGE.md, "Test layers"). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImportRow, ListOp } from '../lib/cloudLists.js';
import { RETURN_KEY, type Redirect } from './redirect.js';
import {
  createCloud,
  IMPORT_TIMEOUT_MS,
  ITEMS_PER_CALL,
  READ_PAGE,
  WRITE_TIMEOUT_MS
} from './supabase.js';

const { client, createClient, rows } = vi.hoisted(() => {
  /* `from('user_prefs')`'s builder: `select().eq().maybeSingle()` and
     `upsert()`. */
  const rows = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn()
  };
  rows.select.mockImplementation(() => rows);
  rows.eq.mockImplementation(() => rows);
  const client = {
    auth: {
      exchangeCodeForSession: vi.fn(),
      getSession: vi.fn(),
      getUserIdentities: vi.fn(),
      signInWithOAuth: vi.fn(),
      linkIdentity: vi.fn(),
      unlinkIdentity: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn<(table: string) => typeof rows>(() => rows),
    channel: vi.fn(),
    removeChannel: vi.fn(() => Promise.resolve('ok'))
  };
  /* `rpc()` answers what the test set, through a builder with
     `abortSignal()`: an abort answers as postgrest-js does, `status: 0`. */
  const signalled = (answer: unknown) => {
    const settled = (): Promise<unknown> => Promise.resolve(answer);
    return {
      then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
        settled().then(ok, fail),
      abortSignal: (signal: AbortSignal) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            resolve({ data: null, error: { code: '', message: 'AbortError' }, status: 0 });
          });
          settled().then(resolve, reject);
        })
    };
  };
  const facade = { ...client, rpc: (...args: unknown[]) => signalled(client.rpc(...args)) };
  return { client, createClient: vi.fn(() => facade), rows };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient,
  REALTIME_SUBSCRIBE_STATES: { SUBSCRIBED: 'SUBSCRIBED' }
}));

const USER = {
  id: 'u1',
  email: 'gm1@example.test',
  app_metadata: { provider: 'google' }
};
const IDS = [
  { identity_id: 'i1', provider: 'google', identity_data: { email: 'gm1@example.test' } },
  { identity_id: 'i2', provider: 'discord', identity_data: {} },
  { identity_id: 'i3', provider: 'email', identity_data: { email: 'gm1@example.test' } }
];

type Win = NonNullable<Parameters<typeof createCloud>[3]>;

let store: Map<string, string>;
let win: Win;
type Show = (e: PageTransitionEvent) => void;

/* The `pageshow` listeners the stub window holds. */
let shows: Set<Show>;
const pageshow = (persisted: boolean): void => {
  for (const fn of [...shows]) fn(new PageTransitionEvent('pageshow', { persisted }));
};

beforeEach(() => {
  vi.clearAllMocks();
  store = new Map();
  shows = new Set();
  win = {
    location: { href: 'https://example.test/loot/index.html#/lists', hash: '#/lists' },
    sessionStorage: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => {
        store.set(k, v);
      },
      removeItem: (k) => {
        store.delete(k);
      }
    },
    history: { replaceState: vi.fn() },
    addEventListener: ((type: string, fn: Show) => {
      if (type === 'pageshow') shows.add(fn);
    }) as Win['addEventListener'],
    removeEventListener: ((type: string, fn: Show) => {
      if (type === 'pageshow') shows.delete(fn);
    }) as Win['removeEventListener']
  };
  client.auth.getSession.mockResolvedValue({ data: { session: { user: USER } }, error: null });
  client.auth.getUserIdentities.mockResolvedValue({ data: { identities: IDS }, error: null });
  client.auth.signOut.mockResolvedValue({ error: null });
  rows.select.mockImplementation(() => rows);
  rows.eq.mockImplementation(() => rows);
});

const make = (redirect: Redirect | null = null) =>
  createCloud('https://x.test', 'k', redirect, win);
const redirect = (over: Partial<Redirect> = {}): Redirect => ({
  code: null,
  error: null,
  kind: 'link',
  provider: 'discord',
  action: null,
  ...over
});

describe('createCloud', () => {
  it('builds a PKCE client that leaves the address alone', () => {
    make();
    expect(createClient).toHaveBeenCalledWith('https://x.test', 'k', {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true
      },
      global: { fetch: expect.any(Function) as unknown }
    });
  });

  it('maps the session, with a provider other than Google or Discord as null', async () => {
    const { auth } = make();
    expect(await auth.session()).toEqual({
      userId: 'u1',
      email: 'gm1@example.test',
      provider: 'google'
    });
    client.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u2', app_metadata: { provider: 'email' } } } },
      error: null
    });
    expect(await auth.session()).toEqual({ userId: 'u2', email: '', provider: null });
    client.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    expect(await auth.session()).toBeNull();
    client.auth.getSession.mockRejectedValueOnce(new Error('offline'));
    expect(await auth.session()).toBeNull();
  });

  it('lists Google and Discord identities in the server order, email or not', async () => {
    const { auth } = make();
    expect(await auth.identities()).toEqual([
      { id: 'i1', provider: 'google', email: 'gm1@example.test' },
      { id: 'i2', provider: 'discord', email: '' }
    ]);
  });

  it('answers no identities signed out, without asking the server', async () => {
    const { auth } = make();
    client.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    expect(await auth.identities()).toEqual([]);
    client.auth.getSession.mockRejectedValueOnce(new Error('offline'));
    expect(await auth.identities()).toEqual([]);
    expect(client.auth.getUserIdentities).not.toHaveBeenCalled();
  });

  it('answers null when a signed-in read fails or throws', async () => {
    const { auth } = make();
    client.auth.getUserIdentities.mockResolvedValueOnce({
      data: null,
      error: { code: 'x' }
    });
    expect(await auth.identities()).toBeNull();
    client.auth.getUserIdentities.mockRejectedValueOnce(new Error('offline'));
    expect(await auth.identities()).toBeNull();
  });

  it('exchanges a returned code before it answers the session', async () => {
    const order: string[] = [];
    let finish: (v: unknown) => void = () => undefined;
    client.auth.exchangeCodeForSession.mockImplementation(
      () =>
        new Promise((r) => {
          finish = r;
        })
    );
    client.auth.getSession.mockImplementation(() => {
      order.push('getSession');
      return Promise.resolve({ data: { session: { user: USER } }, error: null });
    });
    const { auth } = make(redirect({ code: 'abc' }));
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
    const answer = auth.session();
    await Promise.resolve();
    expect(order).toEqual([]);
    order.push('exchanged');
    finish({ data: {}, error: null });
    expect((await answer)?.userId).toBe('u1');
    expect(order).toEqual(['exchanged', 'getSession']);
    expect(await auth.redirectResult()).toEqual({
      kind: 'link',
      provider: 'discord',
      result: { ok: true },
      action: null
    });
  });

  it('reports a refused exchange, and a thrown one, as the redirect result', async () => {
    client.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: {},
      error: { code: 'identity_already_exists' }
    });
    expect(await make(redirect({ code: 'a' })).auth.redirectResult()).toEqual({
      kind: 'link',
      provider: 'discord',
      result: { ok: false, error: 'alreadyLinked' },
      action: null
    });
    client.auth.exchangeCodeForSession.mockRejectedValueOnce(new Error('offline'));
    const thrown = make(redirect({ code: 'b', kind: 'signIn', provider: null }));
    expect(await thrown.auth.redirectResult()).toEqual({
      kind: 'signIn',
      provider: null,
      result: { ok: false, error: 'failed' },
      action: null
    });
    expect(await thrown.auth.identities()).toHaveLength(2);
  });

  it('reports the error parameters of a redirect, and nothing without one', async () => {
    expect(
      await make(redirect({ error: 'identity_already_exists' })).auth.redirectResult()
    ).toEqual({
      kind: 'link',
      provider: 'discord',
      result: { ok: false, error: 'alreadyLinked' },
      action: null
    });
    expect(await make(redirect({ error: 'access_denied' })).auth.redirectResult()).toEqual({
      kind: 'link',
      provider: 'discord',
      result: { ok: false, error: 'failed' },
      action: null
    });
    expect(await make(redirect()).auth.redirectResult()).toBeNull();
    expect(await make().auth.redirectResult()).toBeNull();
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('saves the way back before it leaves for the provider', async () => {
    client.auth.signInWithOAuth.mockImplementation(() => {
      expect(JSON.parse(store.get(RETURN_KEY) ?? '')).toMatchObject({
        hash: '#/lists',
        kind: 'signIn',
        provider: 'google'
      });
      return Promise.resolve({ data: {}, error: null });
    });
    const started = make().auth.signIn('google');
    await vi.waitFor(() => {
      expect(shows.size).toBe(1);
    });
    pageshow(true);
    expect(await started).toEqual({ ok: true });
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://example.test/loot/?auth-callback=1' }
    });
  });

  it('links with the same way back, and maps a refusal', async () => {
    win.location.hash = '';
    client.auth.linkIdentity.mockResolvedValueOnce({
      data: {},
      error: { code: 'identity_already_exists' }
    });
    expect(await make().auth.link('discord')).toEqual({ ok: false, error: 'alreadyLinked' });
    expect(JSON.parse(store.get(RETURN_KEY) ?? '')).toMatchObject({
      hash: '#/account',
      kind: 'link',
      provider: 'discord'
    });
    client.auth.linkIdentity.mockResolvedValueOnce({ data: {}, error: { code: 'other' } });
    expect(await make().auth.link('discord')).toEqual({ ok: false, error: 'failed' });
    client.auth.signInWithOAuth.mockRejectedValueOnce(new Error('offline'));
    expect(await make().auth.signIn('discord')).toEqual({ ok: false, error: 'failed' });
  });

  it('unlinks a known identity, and refuses the last, an unknown and a failed one', async () => {
    const { auth } = make();
    client.auth.unlinkIdentity.mockResolvedValueOnce({ data: {}, error: null });
    expect(await auth.unlink('i2')).toEqual({ ok: true });
    expect(client.auth.unlinkIdentity).toHaveBeenCalledWith(IDS[1]);
    expect(await auth.unlink('nope')).toEqual({ ok: false, error: 'failed' });
    client.auth.unlinkIdentity.mockResolvedValueOnce({
      data: null,
      error: { code: 'single_identity_not_deletable' }
    });
    expect(await auth.unlink('i1')).toEqual({ ok: false, error: 'lastIdentity' });
    client.auth.unlinkIdentity.mockResolvedValueOnce({ data: null, error: { code: 'x' } });
    expect(await auth.unlink('i1')).toEqual({ ok: false, error: 'failed' });
    client.auth.unlinkIdentity.mockRejectedValueOnce(new Error('offline'));
    expect(await auth.unlink('i1')).toEqual({ ok: false, error: 'failed' });
    client.auth.getUserIdentities.mockResolvedValueOnce({
      data: { identities: [IDS[0]] },
      error: null
    });
    expect(await auth.unlink('i1')).toEqual({ ok: false, error: 'lastIdentity' });
    client.auth.getUserIdentities.mockResolvedValueOnce({ data: null, error: { code: 'x' } });
    expect(await auth.unlink('i1')).toEqual({ ok: false, error: 'failed' });
  });

  it('signs out here by default, everywhere on request, and reports a refusal', async () => {
    const { auth } = make();
    expect(await auth.signOut()).toEqual({ ok: true });
    expect(client.auth.signOut).toHaveBeenLastCalledWith({ scope: 'local' });
    expect(await auth.signOut('global')).toEqual({ ok: true });
    expect(client.auth.signOut).toHaveBeenLastCalledWith({ scope: 'global' });
    client.auth.signOut.mockResolvedValueOnce({ error: { code: 'x' } });
    expect(await auth.signOut('global')).toEqual({ ok: false, error: 'failed' });
    client.auth.signOut.mockRejectedValueOnce(new Error('offline'));
    expect(await auth.signOut()).toEqual({ ok: false, error: 'failed' });
  });

  it('deletes the account, then clears this browser whatever that answers', async () => {
    const { auth } = make();
    client.rpc.mockResolvedValueOnce({ data: null, error: null });
    client.auth.signOut.mockRejectedValueOnce(new Error('user not found'));
    expect(await auth.deleteAccount()).toEqual({ ok: true });
    expect(client.rpc).toHaveBeenCalledWith('delete_account');
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    client.rpc.mockResolvedValueOnce({ data: null, error: { code: '28000' } });
    expect(await auth.deleteAccount()).toEqual({ ok: false, error: 'failed' });
    client.rpc.mockRejectedValueOnce(new Error('offline'));
    expect(await auth.deleteAccount()).toEqual({ ok: false, error: 'failed' });
  });

  it('forwards every auth change as a session, and unsubscribes', () => {
    const unsubscribe = vi.fn();
    let emit: (e: string, s: unknown) => void = () => undefined;
    client.auth.onAuthStateChange.mockImplementation((cb: typeof emit) => {
      emit = cb;
      return { data: { subscription: { unsubscribe } } };
    });
    const seen: unknown[] = [];
    const off = make().auth.onChange((s) => seen.push(s));
    emit('SIGNED_IN', { user: USER });
    emit('SIGNED_OUT', null);
    expect(seen).toEqual([
      { userId: 'u1', email: 'gm1@example.test', provider: 'google' },
      null
    ]);
    off();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('keeps a started redirect pending until the page comes back from the cache', async () => {
    client.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    client.auth.linkIdentity.mockResolvedValue({ data: {}, error: null });
    for (const start of [
      (c: ReturnType<typeof make>) => c.auth.signIn('google'),
      (c: ReturnType<typeof make>) => c.auth.link('discord')
    ]) {
      let answer: unknown = 'pending';
      void start(make()).then((r) => (answer = r));
      await vi.waitFor(() => {
        expect(shows.size).toBe(1);
      });
      await new Promise((r) => setTimeout(r, 0));
      expect(answer).toBe('pending');
      pageshow(false);
      await new Promise((r) => setTimeout(r, 0));
      expect(answer).toBe('pending');
      pageshow(true);
      await vi.waitFor(() => {
        expect(answer).toEqual({ ok: true });
      });
      expect(shows.size).toBe(0);
    }
  });

  it('answers a refused start at once, listening for nothing', async () => {
    client.auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: { code: 'x' } });
    expect(await make().auth.signIn('google')).toEqual({ ok: false, error: 'failed' });
    expect(shows.size).toBe(0);
  });

  it('hands a given store to the client', () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    createCloud('https://x.test', 'k', null, win, storage);
    expect(createClient).toHaveBeenLastCalledWith('https://x.test', 'k', {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        storage
      },
      global: { fetch: expect.any(Function) as unknown }
    });
  });

  it('defaults to the real window', async () => {
    client.auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: null });
    const cloud = createCloud('https://x.test', 'k', null);
    const started = cloud.auth.signIn('google');
    await vi.waitFor(() => {
      expect(client.auth.signInWithOAuth).toHaveBeenCalled();
    });
    await new Promise((r) => setTimeout(r, 0));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(await started).toEqual({ ok: true });
  });
});

describe('the preferences row', () => {
  const P = { lang: 'en', view: 'grid', printBw: true, printCompact: false } as const;

  it('reads and writes nothing signed out, without touching the table', async () => {
    const { prefs } = make();
    client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await prefs.load()).toEqual({ ok: false });
    expect(await prefs.save(P)).toBe(false);
    client.auth.getSession.mockRejectedValue(new Error('offline'));
    expect(await prefs.load()).toEqual({ ok: false });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("reads the user's own row, dropping an invalid field", async () => {
    const { prefs } = make();
    rows.maybeSingle.mockResolvedValueOnce({
      data: { prefs: { lang: 'en', view: 'tiles', printBw: true } },
      error: null
    });
    expect(await prefs.load()).toEqual({ ok: true, prefs: { lang: 'en', printBw: true } });
    expect(client.from).toHaveBeenCalledWith('user_prefs');
    expect(rows.select).toHaveBeenCalledWith('prefs');
    expect(rows.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('answers no row as null, and a failed or thrown read as not ok', async () => {
    const { prefs } = make();
    rows.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await prefs.load()).toEqual({ ok: true, prefs: null });
    rows.maybeSingle.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    expect(await prefs.load()).toEqual({ ok: false });
    rows.maybeSingle.mockRejectedValueOnce(new Error('offline'));
    expect(await prefs.load()).toEqual({ ok: false });
  });

  it('replaces the whole row on save, and reports a refusal', async () => {
    const { prefs } = make();
    rows.upsert.mockResolvedValueOnce({ data: null, error: null });
    expect(await prefs.save(P)).toBe(true);
    expect(client.from).toHaveBeenCalledWith('user_prefs');
    expect(rows.upsert).toHaveBeenCalledWith(
      { user_id: 'u1', prefs: P },
      { onConflict: 'user_id' }
    );
    rows.upsert.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    expect(await prefs.save(P)).toBe(false);
    rows.upsert.mockRejectedValueOnce(new Error('offline'));
    expect(await prefs.save(P)).toBe(false);
  });
});

describe('the lists', () => {
  type Call = [string, unknown[]];

  /* One PostgREST query: every builder method records itself, and awaiting
     it answers `answer` (or throws it). */
  function query(answer: unknown) {
    const calls: Call[] = [];
    const q: Record<string, unknown> = {};
    for (const m of [
      'select',
      'upsert',
      'update',
      'delete',
      'eq',
      'in',
      'order',
      'gt',
      'limit'
    ]) {
      q[m] = (...args: unknown[]) => {
        calls.push([m, args]);
        return q;
      };
    }
    q['then'] = (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
      (answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer)).then(
        ok,
        fail
      );
    return { q, calls };
  }
  const answers = (...each: unknown[]) => {
    const made = each.map(query);
    for (const m of made)
      client.from.mockImplementationOnce(() => m.q as unknown as typeof rows);
    return made.map((m) => m.calls);
  };
  const entry = (id: string, key: string, position: number) => ({
    id,
    item_key: key,
    source: 'official' as const,
    hb_item: null,
    position,
    quantity: 1,
    price_coins: null,
    player_note: '',
    gm_note: ''
  });
  const LIST = {
    id: 'l1',
    name: 'К',
    money_mode: 'bag' as const,
    player_note: '',
    gm_note: ''
  };

  it('reads every list with its entries in one query, sorted by position then id', async () => {
    const [calls] = answers({
      data: [
        {
          ...LIST,
          list_entries: [entry('b', 'q2', 1), entry('c', 'q3', 0), entry('a', 'q1', 1)]
        }
      ],
      error: null,
      status: 200
    });
    const read = await make().lists.list();
    expect(client.from).toHaveBeenCalledWith('lists');
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      ['select', [SELECT]],
      ['order', ['updated_at', { ascending: false }]],
      ['order', ['id']]
    ]);
    expect(read.ok && read.lists[0]?.list_entries.map((e) => e.id)).toEqual(['c', 'a', 'b']);
    expect(read.ok && 'kept' in read).toBe(false);
  });

  it('reads the list and entry limits beside the lists: a failed limit read as undefined, no limit as null', async () => {
    answers({ data: [], error: null, status: 200 });
    client.rpc
      .mockImplementationOnce(() => Promise.resolve({ data: 50, error: null, status: 200 }))
      .mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const read = await make().lists.list();
    expect(read).toEqual({ ok: true, lists: [], listLimit: 50, entryLimit: undefined });
    expect(read.ok && read.entryLimit).toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith('my_limit', { p_key: 'lists_per_owner' });
    expect(client.rpc).toHaveBeenCalledWith('my_limit', { p_key: 'entries_per_list' });
  });

  it('answers a limit read refused by the database as undefined, and a null answer as null', async () => {
    answers({ data: [], error: null, status: 200 });
    client.rpc
      .mockImplementationOnce(() =>
        Promise.resolve({ data: null, error: { code: '42501' }, status: 401 })
      )
      .mockImplementationOnce(() => Promise.resolve({ data: null, error: null, status: 200 }));
    const read = await make().lists.list();
    expect(read.ok && read.listLimit).toBeUndefined();
    expect(read.ok && read.entryLimit).toBeNull();
  });

  const SELECT =
    'id,name,money_mode,player_note,gm_note,created_at,updated_at,revision,legacy_fingerprint,' +
    'list_entries(id,item_key,source,hb_item,position,quantity,price_coins,player_note,gm_note)';
  const ORDERED = [
    ['order', ['updated_at', { ascending: false }]],
    ['order', ['id']]
  ];
  const row = (id: string, revision: number) => ({
    ...LIST,
    id,
    revision,
    updated_at: '2026-10-02T00:00:00Z',
    list_entries: []
  });
  const limits = () =>
    client.rpc
      .mockImplementationOnce(() => Promise.resolve({ data: 7, error: null, status: 200 }))
      .mockImplementationOnce(() => Promise.resolve({ data: 7, error: null, status: 200 }));

  it('re-reads with nothing changed by the head read alone, every list kept', async () => {
    limits();
    const [head] = answers({
      data: [
        { id: 'l1', revision: 3 },
        { id: 'l2', revision: 5 }
      ],
      error: null,
      status: 200
    });
    const read = await make().lists.list({ l1: 3, l2: 5 });
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(head).toEqual([['select', ['id,revision']], ...ORDERED]);
    expect(read).toEqual({
      ok: true,
      lists: [],
      kept: ['l1', 'l2'],
      listLimit: 7,
      entryLimit: 7
    });
  });

  it('re-reads one changed list by its id, the others kept, and a list it does not hold', async () => {
    limits();
    const [, changed] = answers(
      {
        data: [
          { id: 'l1', revision: 4 },
          { id: 'l2', revision: 5 },
          { id: 'l3', revision: 1 }
        ],
        error: null,
        status: 200
      },
      { data: [row('l1', 4), row('l3', 1)], error: null, status: 200 }
    );
    const read = await make().lists.list({ l1: 3, l2: 5, gone: 2 });
    expect(changed).toEqual([['select', [SELECT]], ...ORDERED, ['in', ['id', ['l1', 'l3']]]]);
    expect(read.ok && read.lists.map((l) => l.id)).toEqual(['l1', 'l3']);
    expect(read.ok && read.kept).toEqual(['l2']);
  });

  it('reads every list in full when more than 50 changed', async () => {
    limits();
    const known = Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [`l${String(i)}`, 1])
    );
    const [, full] = answers(
      {
        data: Object.keys(known).map((id) => ({ id, revision: 2 })),
        error: null,
        status: 200
      },
      { data: [row('l0', 2)], error: null, status: 200 }
    );
    const read = await make().lists.list(known);
    expect(full).toEqual([['select', [SELECT]], ...ORDERED]);
    expect(read.ok && 'kept' in read).toBe(false);
  });

  it('answers not ok to a failed head read or a failed changed read', async () => {
    limits();
    answers(
      { data: null, error: { code: '42501' }, status: 401 },
      { data: [{ id: 'l1', revision: 4 }], error: null, status: 200 },
      new Error('offline')
    );
    const { lists } = make();
    expect(await lists.list({ l1: 3 })).toEqual({ ok: false });
    expect(await lists.list({ l1: 3 })).toEqual({ ok: false });
  });

  it('answers not ok to an error, a thrown read and no rows', async () => {
    answers({ data: null, error: { code: '42501' }, status: 401 }, new Error('offline'), {
      data: null,
      error: null,
      status: 200
    });
    const { lists } = make();
    expect(await lists.list()).toEqual({ ok: false });
    expect(await lists.list()).toEqual({ ok: false });
    expect(await lists.list()).toEqual({ ok: false });
  });

  const OPS: ListOp[] = [
    { op: 'create', list: LIST, entries: [entry('e1', 'ci1', 0)] },
    { op: 'update', id: 'l1', patch: { name: 'x' } }
  ];

  it('sends the writes as given in one apply_list_writes call', async () => {
    client.rpc.mockResolvedValueOnce({
      data: [{ ok: true }, { ok: true }],
      error: null,
      status: 200
    });
    expect(await make().lists.apply(OPS)).toEqual({
      ok: true,
      results: [{ ok: true }, { ok: true }]
    });
    expect(client.rpc).toHaveBeenCalledWith('apply_list_writes', { p_ops: OPS });
  });

  it('makes no call for no writes', async () => {
    expect(await make().lists.apply([])).toEqual({ ok: true, results: [] });
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('maps each write: ok, a limit with its value or none, a refusal, and P0002 as gone', async () => {
    const six: ListOp[] = Array.from({ length: 6 }, () => ({ op: 'remove', id: 'l1' }));
    client.rpc.mockResolvedValueOnce({
      data: [
        { ok: true },
        { ok: false, code: 'P0001', message: 'limit: lists_per_owner', details: '50' },
        { ok: false, code: 'P0001', message: 'limit: entries_per_list', details: null },
        {
          ok: false,
          code: '42501',
          message: 'apply_list_writes: the id belongs to another list'
        },
        { ok: false, code: '23505', message: 'duplicate' },
        { ok: false, code: 'P0002', message: 'apply_list_writes: the list or entry is gone' }
      ],
      error: null,
      status: 200
    });
    expect(await make().lists.apply(six)).toEqual({
      ok: true,
      results: [
        { ok: true },
        { ok: false, error: 'limit', key: 'lists_per_owner', value: 50 },
        { ok: false, error: 'limit', key: 'entries_per_list', value: null },
        { ok: false, error: 'refused' },
        { ok: false, error: 'refused' },
        { ok: false, error: 'gone' }
      ]
    });
  });

  it('refuses an answer that is not one result per write', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: [{ ok: true }], error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: null, status: 200 });
    const { lists } = make();
    expect(await lists.apply(OPS)).toEqual({ ok: false, error: 'refused' });
    expect(await lists.apply(OPS)).toEqual({ ok: false, error: 'refused' });
  });

  /* The call's own answer: a lapsed session, a passing server fault and no
     answer are waited out; a statement timeout or a defect is a fault. */
  const CALL: [string, unknown, string][] = [
    ['401', { error: { code: '', message: 'JWT expired' }, status: 401 }, 'network'],
    ['PGRST301', { error: { code: 'PGRST301', message: 'x' }, status: 401 }, 'network'],
    ['PGRST303', { error: { code: 'PGRST303', message: 'x' }, status: 401 }, 'network'],
    ['28000', { error: { code: '28000', message: 'not signed in' }, status: 403 }, 'network'],
    ['500 40001', { error: { code: '40001', message: 'x' }, status: 500 }, 'network'],
    ['500 40P01', { error: { code: '40P01', message: 'x' }, status: 500 }, 'network'],
    ['500 PGRST001', { error: { code: 'PGRST001', message: 'x' }, status: 500 }, 'network'],
    ['502', { error: { message: 'bad gateway' }, status: 502 }, 'network'],
    ['503 PGRST000', { error: { code: 'PGRST000', message: 'x' }, status: 503 }, 'network'],
    ['504 PGRST003', { error: { code: 'PGRST003', message: 'x' }, status: 504 }, 'network'],
    [
      'status 0',
      { error: { code: '', message: 'TypeError: fetch failed' }, status: 0 },
      'network'
    ],
    ['thrown', new Error('offline'), 'network'],
    ['500 57014', { error: { code: '57014', message: 'x' }, status: 500 }, 'fault'],
    ['500 XX000', { error: { code: 'XX000', message: 'x' }, status: 500 }, 'fault'],
    ['500 P0003', { error: { code: 'P0003', message: 'x' }, status: 500 }, 'fault'],
    ['500 22023', { error: { code: '22023', message: 'x' }, status: 500 }, 'fault'],
    ['500 23505', { error: { code: '23505', message: 'x' }, status: 500 }, 'fault'],
    ['500 42883', { error: { code: '42883', message: 'x' }, status: 500 }, 'fault'],
    ['500 57P01', { error: { code: '57P01', message: 'x' }, status: 500 }, 'network'],
    ['500 57P03', { error: { code: '57P03', message: 'x' }, status: 500 }, 'network'],
    ['500 55P03', { error: { code: '55P03', message: 'x' }, status: 500 }, 'network'],
    ['500 53400', { error: { code: '53400', message: 'x' }, status: 500 }, 'network'],
    ['500 58030', { error: { code: '58030', message: 'x' }, status: 500 }, 'network'],
    ['404 PGRST202', { error: { code: 'PGRST202', message: 'x' }, status: 404 }, 'network'],
    ['400 22023', { error: { code: '22023', message: 'x' }, status: 400 }, 'refused'],
    [
      '400 a limit',
      {
        error: { code: 'P0001', message: 'limit: lists_per_owner', details: '50' },
        status: 400
      },
      'refused'
    ],
    ['409 23505', { error: { code: '23505', message: 'duplicate' }, status: 409 }, 'refused']
  ];

  it.each(CALL)('reads a call answered %s', async (_name, answer, error) => {
    if (answer instanceof Error) client.rpc.mockRejectedValueOnce(answer);
    else client.rpc.mockResolvedValueOnce({ data: null, ...(answer as object) });
    expect(await make().lists.apply(OPS)).toEqual({ ok: false, error });
  });

  it('moves a browser list through move_legacy_list and reads the row it answers', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: [{ id: 'l9', inserted: true }], error: null, status: 200 })
      .mockResolvedValueOnce({
        data: [{ id: 'l9', inserted: false }],
        error: null,
        status: 200
      });
    const { lists } = make();
    expect(await lists.move('l1', '{"ids":[],"name":"К"}')).toEqual({
      ok: true,
      id: 'l9',
      inserted: true
    });
    expect(client.rpc).toHaveBeenCalledWith('move_legacy_list', {
      p_id: 'l1',
      p_canonical: '{"ids":[],"name":"К"}'
    });
    expect(await lists.move('l2', '{"ids":[],"name":"К"}')).toEqual({
      ok: true,
      id: 'l9',
      inserted: false
    });
  });

  it('refuses a move answer with no row or a row of the wrong shape', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: [], error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: null, status: 200 })
      .mockResolvedValueOnce({ data: [{ id: 5, inserted: true }], error: null, status: 200 });
    const { lists } = make();
    for (let i = 0; i < 3; i++) {
      expect(await lists.move('l1', '{}')).toEqual({ ok: false, error: 'refused' });
    }
  });

  /* `move` is read by `writeOf`, not by `apply`'s fault rule: a lapsed session and
     a row deleted during the move are retried on the next load. */
  const MOVE: [string, unknown, string][] = [
    ['400 22023', { error: { code: '22023', message: 'not a list' }, status: 400 }, 'refused'],
    ['404 PGRST202', { error: { code: 'PGRST202', message: 'x' }, status: 404 }, 'refused'],
    ['401', { error: { code: '', message: 'JWT expired' }, status: 401 }, 'network'],
    ['PGRST303', { error: { code: 'PGRST303', message: 'x' }, status: 401 }, 'network'],
    [
      '403 28000',
      { error: { code: '28000', message: 'not signed in' }, status: 403 },
      'network'
    ],
    ['500 40001', { error: { code: '40001', message: 'deleted' }, status: 500 }, 'network'],
    ['500 40P01', { error: { code: '40P01', message: 'x' }, status: 500 }, 'network'],
    ['500 57014', { error: { code: '57014', message: 'x' }, status: 500 }, 'network'],
    ['thrown', new Error('offline'), 'network']
  ];

  it.each(MOVE)('reads a move answered %s', async (_name, answer, error) => {
    if (answer instanceof Error) client.rpc.mockRejectedValueOnce(answer);
    else client.rpc.mockResolvedValueOnce({ data: null, ...(answer as object) });
    expect(await make().lists.move('l1', '{}')).toEqual({ ok: false, error });
  });

  it('makes a fresh v4 id', () => {
    const { lists } = make();
    const id = lists.newId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(lists.newId()).not.toBe(id);
  });
});

describe('the import', () => {
  const ROWS: ImportRow[] = [
    {
      list: { id: 'l1', name: 'К', money_mode: 'coin', player_note: 'p', gm_note: 'g' },
      entries: [
        {
          id: 'e1',
          item_key: 'ci1',
          source: 'official',
          hb_item: null,
          position: 0,
          quantity: 2,
          price_coins: 150,
          player_note: '',
          gm_note: ''
        }
      ]
    },
    {
      list: { id: 'l2', name: 'П', money_mode: 'bag', player_note: '', gm_note: '' },
      entries: []
    }
  ];

  it('sends the rows as given in one import_lists call', async () => {
    client.rpc.mockResolvedValueOnce({ data: 2, error: null, status: 200 });
    expect(await make().lists.import(ROWS)).toEqual({ ok: true });
    expect(client.rpc).toHaveBeenCalledWith('import_lists', { p_lists: ROWS });
  });
  it.each([
    [
      '400 a lists limit',
      {
        error: { code: 'P0001', message: 'limit: lists_per_owner', details: '50' },
        status: 400
      },
      { ok: false, error: 'limit', key: 'lists_per_owner', value: 50 }
    ],
    [
      '400 22023',
      { error: { code: '22023', message: 'import_lists: invalid list' }, status: 400 },
      { ok: false, error: 'refused' }
    ],
    [
      '403 42501',
      {
        error: { code: '42501', message: 'import_lists: the id belongs to another list' },
        status: 403
      },
      { ok: false, error: 'refused' }
    ],
    [
      '403 28000',
      { error: { code: '28000', message: 'import_lists: not signed in' }, status: 403 },
      { ok: false, error: 'network' }
    ],
    [
      'status 0',
      { error: { code: '', message: 'TypeError: fetch failed' }, status: 0 },
      { ok: false, error: 'network' }
    ],
    [
      '503',
      { error: { code: 'PGRST000', message: 'x' }, status: 503 },
      { ok: false, error: 'network' }
    ],
    [
      '500 57014, the statement timeout',
      {
        error: { code: '57014', message: 'canceling statement due to statement timeout' },
        status: 500
      },
      { ok: false, error: 'refused', reason: 'tooSlow' }
    ],
    ['thrown', new Error('offline'), { ok: false, error: 'network' }]
  ])('reads an import answered %s', async (_name, answer, want) => {
    if (answer instanceof Error) client.rpc.mockRejectedValueOnce(answer);
    else client.rpc.mockResolvedValueOnce({ data: null, ...answer });
    expect(await make().lists.import(ROWS)).toEqual(want);
  });

  it('reads a statement timeout as tooSlow for an import only: another write sends it again', async () => {
    const timeout = { data: null, error: { code: '57014', message: 'x' }, status: 500 };
    client.rpc.mockResolvedValueOnce(timeout).mockResolvedValueOnce(timeout);
    const { lists, shares } = make();
    expect(await shares.revoke('s1')).toEqual({ ok: false, error: 'network' });
    expect(await lists.move('l1', '{}')).toEqual({ ok: false, error: 'network' });
  });

  describe('with no answer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('waits past WRITE_TIMEOUT_MS and answers network at IMPORT_TIMEOUT_MS', async () => {
      client.rpc.mockImplementationOnce(() => new Promise<never>(() => undefined));
      let answer: unknown = 'pending';
      void make()
        .lists.import(ROWS)
        .then((a) => {
          answer = a;
        });
      await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS);
      expect(answer).toBe('pending');
      await vi.advanceTimersByTimeAsync(IMPORT_TIMEOUT_MS - WRITE_TIMEOUT_MS - 1);
      expect(answer).toBe('pending');
      await vi.advanceTimersByTimeAsync(1);
      expect(answer).toEqual({ ok: false, error: 'network' });
    });
  });
});

describe('the linked items', () => {
  const ids = (n: number, from = 0) =>
    Array.from(
      { length: n },
      (_, i) => '00000000-0000-4000-8000-' + String(from + i).padStart(12, '0')
    );

  it('reads the items in calls of at most ITEMS_PER_CALL ids, skipping a row with no hid', async () => {
    const all = ids(ITEMS_PER_CALL + 1);
    client.rpc
      .mockResolvedValueOnce({
        data: [{ hid: all[0], item: { id: 'hb_aaaaaaaaaaaaaaaa' } }, { item: {} }],
        error: null,
        status: 200
      })
      .mockResolvedValueOnce({ data: [], error: null, status: 200 });
    expect(await make().lists.items(all)).toEqual({
      ok: true,
      items: [{ hid: all[0], item: { id: 'hb_aaaaaaaaaaaaaaaa' } }]
    });
    expect(client.rpc).toHaveBeenNthCalledWith(1, 'get_homebrew_items', {
      p_ids: all.slice(0, ITEMS_PER_CALL)
    });
    expect(client.rpc).toHaveBeenNthCalledWith(2, 'get_homebrew_items', {
      p_ids: all.slice(ITEMS_PER_CALL)
    });
  });

  it('answers not ok when any call fails or throws, and makes no call for no ids', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: null, error: { code: '42501' }, status: 401 })
      .mockRejectedValueOnce(new Error('offline'));
    const { lists } = make();
    expect(await lists.items(ids(1))).toEqual({ ok: false });
    expect(await lists.items(ids(1))).toEqual({ ok: false });
    expect(await lists.items([])).toEqual({ ok: true, items: [] });
    expect(client.rpc).toHaveBeenCalledTimes(2);
  });
});

describe('the fetch the client is given', () => {
  const URL_ = 'https://x.test';
  const RPC = URL_ + '/rest/v1/rpc/apply_list_writes';
  let sent: [unknown, RequestInit | undefined][];
  let fail: (init: RequestInit | undefined) => boolean;

  beforeEach(() => {
    sent = [];
    fail = () => false;
    vi.stubGlobal('fetch', (input: unknown, init?: RequestInit) => {
      sent.push([input, init]);
      return fail(init)
        ? Promise.reject(new TypeError('Failed to fetch'))
        : Promise.resolve(new Response('[]'));
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const given = (url = URL_) => {
    createCloud(url, 'k', null, win);
    const call = createClient.mock.lastCall as unknown[] | undefined;
    const options = call?.[2] as { global: { fetch: typeof fetch } };
    return options.global.fetch;
  };
  const post = (body: string): RequestInit => ({ method: 'POST', body });
  const flags = () => sent.map(([, init]) => init?.keepalive ?? false);

  it('sends a database write of at most 64 000 bytes with keepalive', async () => {
    const f = given();
    await f(RPC, post('a'.repeat(64_000)));
    await f(new URL(RPC), post('{}'));
    await f(new Request(RPC, { method: 'POST' }), post('{}'));
    expect(flags()).toEqual([true, true, true]);
  });

  it('matches the write when the configured URL has an uppercase host, :443 or a slash', async () => {
    await given('https://X.TEST:443')(RPC, post('{}'));
    await given('https://x.test/')(RPC, post('{}'));
    await given('https://x.test/base')(URL_ + '/base/rest/v1/rpc/x', post('{}'));
    await given('https://x.test/base')(RPC, post('{}'));
    expect(flags()).toEqual([true, true, true, false]);
  });

  it('sends a larger body, a read with no body and an auth request as they are', async () => {
    const f = given();
    await f(RPC, post('a'.repeat(64_001)));
    await f(RPC, post('я'.repeat(32_001)));
    await f(URL_ + '/rest/v1/lists?select=id');
    await f(URL_ + '/auth/v1/token?grant_type=refresh_token', post('{}'));
    expect(flags()).toEqual([false, false, false, false]);
  });

  it('sends a refused keepalive request once more without the flag, and answers that', async () => {
    const f = given();
    fail = (init) => init?.keepalive === true;
    const answer = await f(RPC, post('{}'));
    expect(await answer.text()).toBe('[]');
    expect(flags()).toEqual([true, false]);
  });

  it('does not send an aborted request again', async () => {
    const f = given();
    fail = () => true;
    const abort = new AbortController();
    abort.abort();
    await expect(f(RPC, { ...post('{}'), signal: abort.signal })).rejects.toThrow();
    expect(sent).toHaveLength(1);
  });

  const tabOf = (i: number): string | null => {
    const [input, init] = sent[i] ?? [];
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined)
    );
    return headers.get('x-dhloot-tab');
  };

  it("tags every PostgREST request with the page's tab id, reads and Request inputs too", async () => {
    const f = given();
    await f(RPC, { ...post('{}'), headers: { apikey: 'k' } });
    await f(URL_ + '/rest/v1/lists?select=id', { headers: { apikey: 'k' } });
    await f(new Request(RPC, { method: 'POST', headers: { apikey: 'r' } }));
    const tab = tabOf(0);
    expect(tab).toMatch(/^[0-9a-f-]{36}$/);
    expect([tabOf(1), tabOf(2)]).toEqual([tab, tab]);
    expect(new Headers(sent[0]?.[1]?.headers).get('apikey')).toBe('k');
    expect(new Headers(sent[2]?.[1]?.headers).get('apikey')).toBe('r');
  });

  it('sends an auth request with no tab id', async () => {
    const f = given();
    await f(URL_ + '/auth/v1/token?grant_type=refresh_token', post('{}'));
    expect(sent[0]?.[1]).toEqual(post('{}'));
    expect(tabOf(0)).toBeNull();
  });
});

describe('the live topics', () => {
  type Status = (s: string, err?: Error) => void;
  /* One stub channel per `channel()` call: its broadcast handler and the
     status callback its `subscribe` was given. */
  function channels() {
    const made: {
      topic: string;
      params: unknown;
      message?: (m: { event: string; payload: unknown }) => void;
      status?: Status;
    }[] = [];
    client.channel.mockImplementation((topic: string, params: unknown) => {
      const one: (typeof made)[number] = { topic, params };
      made.push(one);
      const ch = {
        on: (
          _type: string,
          _filter: unknown,
          fn: (m: { event: string; payload: unknown }) => void
        ) => {
          one.message = fn;
          return ch;
        },
        subscribe: (fn: Status) => {
          one.status = fn;
          return ch;
        }
      };
      return ch;
    });
    return made;
  }

  it('joins a private channel and reports a join as live, with each message', () => {
    const made = channels();
    const seen: unknown[] = [];
    make().events.subscribe('share:k', {
      message: (event, payload) => seen.push([event, payload]),
      status: (s) => seen.push(s)
    });
    expect(made[0]?.topic).toBe('share:k');
    expect(made[0]?.params).toEqual({ config: { private: true } });
    made[0]?.status?.('SUBSCRIBED');
    made[0]?.message?.({ event: 'revision', payload: { revision: 2, id: 'm' } });
    expect(seen).toEqual(['live', ['revision', { revision: 2, id: 'm' }]]);
  });

  it.each([
    [
      'CHANNEL_ERROR',
      new Error('MissingPartition: Realtime was unable to find the expected messages partition')
    ],
    ['TIMED_OUT', undefined],
    ['CLOSED', undefined]
  ])(
    'reports %s once as down, removes the channel, and says nothing after it',
    (status, err) => {
      const made = channels();
      const seen: unknown[] = [];
      make().events.subscribe('owner:u1', {
        message: (event) => seen.push(event),
        status: (s) => seen.push(s)
      });
      made[0]?.status?.(status, err);
      made[0]?.status?.('SUBSCRIBED');
      made[0]?.status?.('CLOSED');
      made[0]?.message?.({ event: 'list', payload: {} });
      expect(seen).toEqual(['down']);
      expect(client.removeChannel).toHaveBeenCalledOnce();
    }
  );

  it('removes the channel on leave, and says nothing after it', () => {
    const made = channels();
    const seen: unknown[] = [];
    const leave = make().events.subscribe('owner:u1', {
      message: (event) => seen.push(event),
      status: (s) => seen.push(s)
    });
    leave();
    leave();
    made[0]?.status?.('SUBSCRIBED');
    expect(seen).toEqual([]);
    expect(client.removeChannel).toHaveBeenCalledOnce();
  });

  it("names the page's tab id, one per port", () => {
    const one = make().events.tab;
    expect(one).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(make().events.tab).not.toBe(one);
  });
});

describe('a write with no answer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const NEVER = (): Promise<never> => new Promise<never>(() => undefined);

  it.each([
    [
      'apply',
      (c: ReturnType<typeof make>) => c.lists.apply([{ op: 'remove', id: 'l1' }]),
      { ok: false, error: 'network' }
    ],
    [
      'move',
      (c: ReturnType<typeof make>) => c.lists.move('l1', '{}'),
      { ok: false, error: 'network' }
    ],
    [
      'create',
      (c: ReturnType<typeof make>) => c.shares.create('l1', 'gm'),
      { ok: false, error: 'network' }
    ],
    [
      'revoke',
      (c: ReturnType<typeof make>) => c.shares.revoke('s1'),
      { ok: false, error: 'network' }
    ],
    [
      'clone',
      (c: ReturnType<typeof make>) => c.shares.clone('t1', 'c1'),
      { ok: false, error: 'network' }
    ]
  ])('answers network for %s after WRITE_TIMEOUT_MS', async (_name, call, want) => {
    client.rpc.mockImplementationOnce(NEVER);
    let answer: unknown = 'pending';
    void call(make()).then((a) => {
      answer = a;
    });
    await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS - 1);
    expect(answer).toBe('pending');
    await vi.advanceTimersByTimeAsync(1);
    expect(answer).toEqual(want);
  });

  it('clears the timer once a write answers', async () => {
    client.rpc.mockResolvedValueOnce({ data: [{ ok: true }], error: null, status: 200 });
    const before = vi.getTimerCount();
    expect(await make().lists.apply([{ op: 'remove', id: 'l1' }])).toEqual({
      ok: true,
      results: [{ ok: true }]
    });
    expect(vi.getTimerCount()).toBe(before);
  });
});

describe('the share links', () => {
  type Call = [string, unknown[]];

  /* One PostgREST query, as in "the lists", with `maybeSingle` for `ownerOf`. */
  function query(answer: unknown) {
    const calls: Call[] = [];
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'maybeSingle']) {
      q[m] = (...args: unknown[]) => {
        calls.push([m, args]);
        return q;
      };
    }
    q['then'] = (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
      (answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer)).then(
        ok,
        fail
      );
    client.from.mockImplementationOnce(() => q as unknown as typeof rows);
    return calls;
  }
  const SHARE = {
    id: 's1',
    audience: 'player',
    token: 't1',
    created_at: '2026-09-20T10:00:00.000Z',
    revoked_at: null
  };

  it('reads the list shares, stopped ones included, by list id', async () => {
    const calls = query({ data: [SHARE], error: null, status: 200 });
    expect(await make().shares.list('l1')).toEqual({ ok: true, shares: [SHARE] });
    expect(client.from).toHaveBeenCalledWith('list_shares');
    expect(calls).toEqual([
      ['select', ['id,audience,token,created_at,revoked_at']],
      ['eq', ['list_id', 'l1']]
    ]);
  });

  it('answers not ok to a failed or thrown shares read', async () => {
    query({ data: null, error: { code: '42501' }, status: 401 });
    query(new Error('offline'));
    const { shares } = make();
    expect(await shares.list('l1')).toEqual({ ok: false });
    expect(await shares.list('l1')).toEqual({ ok: false });
  });

  it('makes a share through the RPC, the row being the first of the answer', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: [{ id: 's1', token: 't1' }], error: null, status: 200 })
      .mockResolvedValueOnce({ data: [], error: null, status: 200 })
      .mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'x' },
        status: 403
      })
      .mockResolvedValueOnce({ data: null, error: { code: 'XX000' }, status: 503 })
      .mockRejectedValueOnce(new Error('offline'));
    const { shares } = make();
    expect(await shares.create('l1', 'gm')).toEqual({ ok: true, id: 's1', token: 't1' });
    expect(client.rpc).toHaveBeenLastCalledWith('create_list_share', {
      p_list: 'l1',
      p_audience: 'gm'
    });
    expect(await shares.create('l1', 'gm')).toEqual({ ok: false, error: 'refused' });
    expect(await shares.create('l1', 'player')).toEqual({ ok: false, error: 'refused' });
    expect(await shares.create('l1', 'player')).toEqual({ ok: false, error: 'network' });
    expect(await shares.create('l1', 'player')).toEqual({ ok: false, error: 'network' });
  });

  it('stops a share and saves a copy through the RPCs', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: null, error: null, status: 204 })
      .mockResolvedValueOnce({ data: 'c1', error: null, status: 200 })
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'P0001', message: 'limit: lists_per_owner', details: '50' },
        status: 400
      });
    const { shares } = make();
    expect(await shares.revoke('s1')).toEqual({ ok: true });
    expect(client.rpc).toHaveBeenLastCalledWith('revoke_list_share', { p_share: 's1' });
    expect(await shares.clone('t1', 'c1')).toEqual({ ok: true });
    expect(client.rpc).toHaveBeenLastCalledWith('clone_shared_list', {
      p_token: 't1',
      p_id: 'c1'
    });
    expect(await shares.clone('t1', 'c1')).toEqual({
      ok: false,
      error: 'limit',
      key: 'lists_per_owner',
      value: 50
    });
  });

  it('reads a shared list, null for a link that opens nothing, not ok on an error', async () => {
    const shared = { audience: 'player', updated_at: 'x', list: {}, entries: [] };
    client.rpc
      .mockResolvedValueOnce({ data: shared, error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: { code: 'XX000' }, status: 503 })
      .mockRejectedValueOnce(new Error('offline'));
    const { shares } = make();
    expect(await shares.read('t1')).toEqual({ ok: true, shared });
    expect(client.rpc).toHaveBeenLastCalledWith('get_shared_list', { p_token: 't1' });
    expect(await shares.read('t1')).toEqual({ ok: true, shared: null });
    expect(await shares.read('t1')).toEqual({ ok: false });
    expect(await shares.read('t1')).toEqual({ ok: false });
  });

  it('names the shown revision as p_since, and reads its unchanged answer', async () => {
    const shared = { audience: 'player', updated_at: 'x', revision: 8, list: {}, entries: [] };
    client.rpc
      .mockResolvedValueOnce({ data: { unchanged: true }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: shared, error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: null, status: 200 });
    const { shares } = make();
    expect(await shares.read('t1', 7)).toEqual({ ok: true, unchanged: true });
    expect(client.rpc).toHaveBeenLastCalledWith('get_shared_list', {
      p_token: 't1',
      p_since: 7
    });
    expect(await shares.read('t1', 7)).toEqual({ ok: true, shared });
    expect(await shares.read('t1', 0)).toEqual({ ok: true, shared: null });
    expect(client.rpc).toHaveBeenLastCalledWith('get_shared_list', {
      p_token: 't1',
      p_since: 0
    });
  });

  const NETWORK = { ok: false, error: 'network' };
  const REFUSED = { ok: false, error: 'refused' };
  const COPY: [string, unknown, unknown][] = [
    [
      'a limit',
      {
        error: { code: 'P0001', message: 'limit: lists_per_owner', details: '50' },
        status: 400
      },
      { ok: false, error: 'limit', key: 'lists_per_owner', value: 50 }
    ],
    [
      'a limit with no value',
      {
        error: { code: 'P0001', message: 'limit: entries_per_list', details: '' },
        status: 400
      },
      { ok: false, error: 'limit', key: 'entries_per_list', value: null }
    ],
    [
      'another P0001',
      { error: { code: 'P0001', message: 'something else' }, status: 400 },
      REFUSED
    ],
    ['23505', { error: { code: '23505', message: 'duplicate' }, status: 409 }, REFUSED],
    ['400 22023', { error: { code: '22023', message: 'unknown link' }, status: 400 }, REFUSED],
    ['404 PGRST202', { error: { code: 'PGRST202', message: 'x' }, status: 404 }, REFUSED],
    [
      'status 0',
      { error: { code: '', message: 'TypeError: fetch failed' }, status: 0 },
      NETWORK
    ],
    ['503 XX000', { error: { code: 'XX000', message: 'x' }, status: 503 }, NETWORK],
    ['500 40001', { error: { code: '40001', message: 'x' }, status: 500 }, NETWORK],
    ['500 57014', { error: { code: '57014', message: 'x' }, status: 500 }, NETWORK],
    ['401', { error: { code: '', message: 'JWT expired' }, status: 401 }, NETWORK],
    ['PGRST301', { error: { code: 'PGRST301', message: 'x' }, status: 401 }, NETWORK],
    ['PGRST303', { error: { code: 'PGRST303', message: 'x' }, status: 401 }, NETWORK],
    ['28000', { error: { code: '28000', message: 'not signed in' }, status: 403 }, NETWORK],
    ['thrown', new Error('offline'), NETWORK],
    ['no error', { error: null, status: 204 }, { ok: true }]
  ];

  it.each(COPY)('reads a copy answered %s', async (_name, answer, want) => {
    if (answer instanceof Error) client.rpc.mockRejectedValueOnce(answer);
    else client.rpc.mockResolvedValueOnce({ data: null, ...(answer as object) });
    expect(await make().shares.clone('t1', 'c1')).toEqual(want);
  });

  it("answers the reader's own list id behind a token", async () => {
    const calls = query({ data: { list_id: 'l1' }, error: null, status: 200 });
    query({ data: null, error: null, status: 200 });
    query({ data: null, error: { code: '42501' }, status: 401 });
    query(new Error('offline'));
    const { shares } = make();
    expect(await shares.ownerOf('t1')).toBe('l1');
    expect(calls).toEqual([
      ['select', ['list_id']],
      ['eq', ['token', 't1']],
      ['maybeSingle', []]
    ]);
    expect(await shares.ownerOf('t1')).toBeNull();
    expect(await shares.ownerOf('t1')).toBeNull();
    expect(await shares.ownerOf('t1')).toBeNull();
  });

  it('asks nothing for the owner signed out', async () => {
    client.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    expect(await make().shares.ownerOf('t1')).toBeNull();
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe('a sign-in that a prompt started', () => {
  it('saves the page and the action to come back to, and reads the action back', async () => {
    client.auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: null });
    const action = { do: 'addToList' as const, key: 'sel', ids: ['ci1'] };
    void make().auth.signIn('google', { hash: '#/tables/eq_weapon', action });
    await vi.waitFor(() => {
      expect(client.auth.signInWithOAuth).toHaveBeenCalled();
    });
    expect(JSON.parse(store.get(RETURN_KEY) ?? '')).toMatchObject({
      hash: '#/tables/eq_weapon',
      kind: 'signIn',
      provider: 'google',
      action
    });
    client.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: null });
    const back = make(redirect({ code: 'c', kind: 'signIn', provider: 'google', action }));
    expect(await back.auth.redirectResult()).toEqual({
      kind: 'signIn',
      provider: 'google',
      result: { ok: true },
      action
    });
    const refused = make(redirect({ error: 'access_denied', action }));
    expect(await refused.auth.redirectResult()).toMatchObject({
      result: { ok: false, error: 'failed' },
      action
    });
  });
});

describe('the purchase requests', () => {
  type Call = [string, unknown[]];
  const LIST = '00000000-0000-4000-8000-000000000101';

  /* One PostgREST query: `select().eq()`, a keyset page's `gt().order().limit()`, then the
     answer. */
  function query(answer: unknown) {
    const calls: Call[] = [];
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'gt', 'order', 'limit']) {
      q[m] = (...args: unknown[]) => {
        calls.push([m, args]);
        return q;
      };
    }
    q['then'] = (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
      (answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer)).then(
        ok,
        fail
      );
    client.from.mockImplementationOnce(() => q as unknown as typeof rows);
    return calls;
  }
  const ROW = {
    id: 'r1',
    list_id: LIST,
    audience: 'player',
    created_at: '2026-09-27T10:00:00+00:00',
    expires_at: '2026-09-27T11:00:00+00:00',
    read_at: null,
    purchase_request_lines: [
      { item_key: 'q1', quantity: 1, price_coins: null, applied_quantity: null },
      { item_key: 'ci1', quantity: 2, price_coins: 150, applied_quantity: null }
    ]
  };

  it("reads the owner's pending requests with their lines in one select", async () => {
    const calls = query({ data: [ROW], error: null, status: 200 });
    expect(await make().requests.list()).toEqual({
      ok: true,
      requests: [
        {
          id: 'r1',
          listId: LIST,
          audience: 'player',
          createdAt: ROW.created_at,
          expiresAt: ROW.expires_at,
          readAt: null,
          lines: [
            { item: 'ci1', qty: 2, price: 150, applied: null },
            { item: 'q1', qty: 1, price: null, applied: null }
          ]
        }
      ]
    });
    expect(client.from).toHaveBeenCalledWith('purchase_requests');
    expect(calls).toEqual([
      [
        'select',
        [
          'id,list_id,audience,created_at,expires_at,read_at,' +
            'purchase_request_lines(item_key,quantity,price_coins,applied_quantity)'
        ]
      ],
      ['eq', ['status', 'pending']],
      ['order', ['id']],
      ['limit', [READ_PAGE]]
    ]);
  });

  it('reads every request past the row cap in keyset pages by id, a fresh query per page', async () => {
    const page = Array.from({ length: READ_PAGE }, (_, i) => ({
      ...ROW,
      id: 'r' + String(i).padStart(4, '0')
    }));
    const first = query({ data: page, error: null, status: 200 });
    const second = query({ data: [{ ...ROW, id: 'r9999' }], error: null, status: 200 });
    const read = await make().requests.list();
    expect(client.from).toHaveBeenCalledTimes(2);
    expect(first).not.toContainEqual(['gt', expect.anything()]);
    expect(second).toEqual([
      ['select', [expect.any(String)]],
      ['eq', ['status', 'pending']],
      ['gt', ['id', 'r0999']],
      ['order', ['id']],
      ['limit', [READ_PAGE]]
    ]);
    expect(read.ok && read.requests.length).toBe(READ_PAGE + 1);
  });

  it('answers not ok when a later page fails', async () => {
    query({
      data: Array.from({ length: READ_PAGE }, (_, i) => ({ ...ROW, id: 'r' + String(i) })),
      error: null,
      status: 200
    });
    query({ data: null, error: { code: '57014' }, status: 500 });
    expect(await make().requests.list()).toEqual({ ok: false });
  });

  it("pages by PostgREST's row cap as supabase/config.toml sets it", () => {
    const toml = readFileSync(
      resolve(import.meta.dirname, '..', '..', '..', 'supabase', 'config.toml'),
      'utf8'
    );
    expect(/^max_rows = (\d+)$/m.exec(toml)?.[1]).toBe(String(READ_PAGE));
  });

  it('answers not ok to a failed, thrown or malformed read', async () => {
    query({ data: null, error: { code: '42501' }, status: 401 });
    query(new Error('offline'));
    query({ data: { not: 'rows' }, error: null, status: 200 });
    const { requests } = make();
    for (let i = 0; i < 3; i++) expect(await requests.list()).toEqual({ ok: false });
  });

  it('sends the id, the token and the lines to create_purchase_request', async () => {
    client.rpc.mockResolvedValueOnce({ data: null, error: null, status: 204 });
    const lines = [{ item: 'ci1', qty: 2 }];
    expect(await make().requests.send('r1', 't1', lines)).toEqual({ ok: true });
    expect(client.rpc).toHaveBeenCalledWith('create_purchase_request', {
      p_id: 'r1',
      p_token: 't1',
      p_lines: lines
    });
  });

  it.each([
    ['P0002 at HTTP 500', { code: 'P0002', message: 'request: unknown link' }, 500, 'gone'],
    ['a stale item', { code: '22023', message: 'request: stale' }, 400, 'stale'],
    ['bad lines', { code: '22023', message: 'request: bad lines' }, 400, 'refused'],
    ['a decided answer', { code: '22023', message: 'request: decided' }, 400, 'refused'],
    ['a lapsed session', { code: 'PGRST303', message: 'JWT expired' }, 401, 'network'],
    ['a deadlock', { code: '40P01', message: 'deadlock detected' }, 500, 'network'],
    ['no answer', { code: '', message: 'AbortError' }, 0, 'network']
  ])('answers a send refused with %s', async (_name, error, status, want) => {
    client.rpc.mockResolvedValueOnce({ data: null, error, status });
    expect(await make().requests.send('r1', 't1', [{ item: 'ci1', qty: 1 }])).toEqual({
      ok: false,
      error: want
    });
  });

  it('answers a limit of a send with its key and the value, and a throw as network', async () => {
    client.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'P0001', message: 'limit: request_rate', details: '5' },
        status: 400
      })
      .mockRejectedValueOnce(new Error('offline'));
    const { requests } = make();
    expect(await requests.send('r1', 't1', [{ item: 'ci1', qty: 1 }])).toEqual({
      ok: false,
      error: 'limit',
      key: 'request_rate',
      value: 5
    });
    expect(await requests.send('r1', 't1', [{ item: 'ci1', qty: 1 }])).toEqual({
      ok: false,
      error: 'network'
    });
  });

  it('applies through apply_purchase_request and reads its answer', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: { applied: true, taken: 3 }, error: null, status: 200 })
      .mockResolvedValueOnce({
        data: { short: [{ item: 'cc1', want: 9, have: 5 }] },
        error: null,
        status: 200
      })
      .mockResolvedValueOnce({ data: { applied: 'yes' }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: { short: [] }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: { short: [{ item: 'cc1' }] }, error: null, status: 200 })
      .mockRejectedValueOnce(new Error('offline'));
    const { requests } = make();
    expect(await requests.apply('r1', true)).toEqual({ ok: true, taken: 3 });
    expect(client.rpc).toHaveBeenLastCalledWith('apply_purchase_request', {
      p_id: 'r1',
      p_clamp: true
    });
    expect(await requests.apply('r1', false)).toEqual({
      ok: false,
      error: 'short',
      short: [{ item: 'cc1', want: 9, have: 5 }]
    });
    for (let i = 0; i < 3; i++) {
      expect(await requests.apply('r1', false)).toEqual({ ok: false, error: 'refused' });
    }
    expect(await requests.apply('r1', false)).toEqual({ ok: false, error: 'network' });
  });

  it.each([
    ['decided', { code: '22023', message: 'request: decided' }, 400, 'decided'],
    ['expired', { code: '22023', message: 'request: expired' }, 400, 'expired'],
    [
      'the owner message of 42501',
      { code: '42501', message: 'request: not the owner of the request' },
      403,
      'gone'
    ],
    ['P0002 at HTTP 500', { code: 'P0002', message: 'x' }, 500, 'gone'],
    ['another 42501', { code: '42501', message: 'permission denied' }, 401, 'network'],
    ['another 42501 at 403', { code: '42501', message: 'permission denied' }, 403, 'refused'],
    ['a stale answer', { code: '22023', message: 'request: stale' }, 400, 'refused'],
    ['a limit', { code: 'P0001', message: 'limit: x', details: '1' }, 400, 'refused'],
    ['a deadlock', { code: '40P01', message: 'deadlock detected' }, 500, 'network']
  ])('answers an apply and a decline refused with %s', async (_name, error, status, want) => {
    client.rpc
      .mockResolvedValueOnce({ data: null, error, status })
      .mockResolvedValueOnce({ data: null, error, status });
    const { requests } = make();
    expect(await requests.apply('r1', false)).toEqual({ ok: false, error: want });
    expect(await requests.decline('r1')).toEqual({ ok: false, error: want });
  });

  it('declines through decline_purchase_request', async () => {
    client.rpc
      .mockResolvedValueOnce({ data: null, error: null, status: 204 })
      .mockRejectedValueOnce(new Error('offline'));
    const { requests } = make();
    expect(await requests.decline('r1')).toEqual({ ok: true });
    expect(client.rpc).toHaveBeenLastCalledWith('decline_purchase_request', { p_id: 'r1' });
    expect(await requests.decline('r1')).toEqual({ ok: false, error: 'network' });
  });

  it("marks a list's rows read through mark_list_read", async () => {
    client.rpc
      .mockResolvedValueOnce({ data: null, error: null, status: 204 })
      .mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'mark_list_read: not the owner of the list' },
        status: 403
      })
      .mockRejectedValueOnce(new Error('offline'));
    const { requests } = make();
    expect(await requests.markRead(LIST)).toEqual({ ok: true });
    expect(client.rpc).toHaveBeenLastCalledWith('mark_list_read', { p_list: LIST });
    expect(await requests.markRead(LIST)).toMatchObject({ ok: false });
    expect(await requests.markRead(LIST)).toEqual({ ok: false, error: 'network' });
  });

  describe('with no answer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      [
        'send',
        (c: ReturnType<typeof make>) => c.requests.send('r1', 't1', [{ item: 'ci1', qty: 1 }])
      ],
      ['apply', (c: ReturnType<typeof make>) => c.requests.apply('r1', false)],
      ['decline', (c: ReturnType<typeof make>) => c.requests.decline('r1')]
    ])('answers network for %s after WRITE_TIMEOUT_MS', async (_name, call) => {
      client.rpc.mockImplementationOnce(() => new Promise<never>(() => undefined));
      let answer: unknown = 'pending';
      void call(make()).then((a) => {
        answer = a;
      });
      await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS - 1);
      expect(answer).toBe('pending');
      await vi.advanceTimersByTimeAsync(1);
      expect(answer).toEqual({ ok: false, error: 'network' });
    });
  });
});

describe('the homebrew rows', () => {
  type Call = [string, unknown[]];
  const NEVER = Symbol('never');

  /* One PostgREST query: every builder method records itself; awaiting it answers
     `answer` (or throws it); NEVER answers only when its abort signal fires, as
     postgrest-js does, with `status: 0`. */
  function query(answer: unknown) {
    const calls: Call[] = [];
    const q: Record<string, unknown> = {};
    let signal: AbortSignal | null = null;
    for (const m of ['select', 'upsert', 'update', 'delete', 'eq', 'maybeSingle']) {
      q[m] = (...args: unknown[]) => {
        calls.push([m, args]);
        return q;
      };
    }
    q['abortSignal'] = (s: AbortSignal) => {
      calls.push(['abortSignal', []]);
      signal = s;
      return q;
    };
    q['then'] = (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) => {
      const settled =
        answer === NEVER
          ? new Promise((resolve) => {
              signal?.addEventListener('abort', () => {
                resolve({ data: null, error: { code: '', message: 'AbortError' }, status: 0 });
              });
            })
          : answer instanceof Error
            ? Promise.reject(answer)
            : Promise.resolve(answer);
      return settled.then(ok, fail);
    };
    client.from.mockImplementationOnce(() => q as unknown as typeof rows);
    return calls;
  }
  const answer = (data: unknown, status = 200) => ({ data, error: null, status });
  const failed = (code: string, status: number, message = '', details?: string) => ({
    data: null,
    error: { code, message, ...(details === undefined ? {} : { details }) },
    status
  });
  const BOOK = {
    id: 'b1',
    key: 'hb_alderworkshopaaa',
    content: { ru: 'Мастерская Ольхи' },
    revision: 1,
    created_at: '2026-09-30T10:00:00+00:00',
    updated_at: '2026-09-30T10:00:00+00:00'
  };
  const CONTENT = { kind: 'item' as const, ru: 'Кольцо' };
  const ITEM = {
    id: 'i1',
    key: 'hb_engravedringaaaa',
    book_id: 'b1',
    content: CONTENT,
    revision: 3,
    created_at: '2026-09-30T10:00:00+00:00',
    updated_at: '2026-09-30T11:00:00+00:00'
  };
  const CARD = {
    id: 'c1',
    key: 'hb_aldersetaaaaaaaa',
    kind: 'set' as const,
    book_id: null,
    content: { ru: 'Комплект Ольхи' },
    revision: 2,
    created_at: '2026-09-30T10:00:00+00:00',
    updated_at: '2026-09-30T11:00:00+00:00'
  };

  it('reads the three tables and the item, source and card limits', async () => {
    const books = query(answer([BOOK]));
    const items = query(answer([ITEM]));
    const cards = query(answer([CARD]));
    const LIMITS: Record<string, number> = {
      homebrew_items_per_owner: 100,
      homebrew_books_per_owner: 20,
      homebrew_cards_per_owner: 90
    };
    for (let i = 0; i < 3; i++)
      client.rpc.mockImplementationOnce((_: string, a: { p_key: string }) =>
        Promise.resolve(answer(LIMITS[a.p_key]))
      );
    expect(await make().homebrew.load()).toEqual({
      ok: true,
      books: [BOOK],
      items: [ITEM],
      cards: [CARD],
      itemLimit: 100,
      bookLimit: 20,
      cardLimit: 90
    });
    expect(client.from.mock.calls.map((c) => c[0])).toEqual([
      'homebrew_books',
      'homebrew_items',
      'homebrew_cards'
    ]);
    expect(books).toEqual([['select', ['id,key,content,revision,created_at,updated_at']]]);
    expect(items).toEqual([
      ['select', ['id,key,book_id,content,revision,created_at,updated_at']]
    ]);
    expect(cards).toEqual([
      ['select', ['id,key,kind,book_id,content,revision,created_at,updated_at']]
    ]);
    expect(client.rpc).toHaveBeenCalledWith('my_limit', { p_key: 'homebrew_items_per_owner' });
  });

  it('reads no limit as null, and a limit read that fails or throws as undefined', async () => {
    const cloud = make();
    for (const [limit, read] of [
      [Promise.resolve(answer(null)), null],
      [Promise.resolve(failed('PGRST202', 404)), undefined],
      [Promise.reject(new Error('offline')), undefined]
    ] as const) {
      limit.catch(() => undefined);
      query(answer([]));
      query(answer([]));
      query(answer([]));
      for (let i = 0; i < 3; i++) client.rpc.mockImplementationOnce(() => limit);
      const got = await cloud.homebrew.load();
      expect(got.ok && [got.itemLimit, got.bookLimit, got.cardLimit]).toEqual([
        read,
        read,
        read
      ]);
    }
  });

  it('answers not ok signed out, to an error of a read, to no rows and to a throw', async () => {
    const cloud = make();
    client.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    expect(await cloud.homebrew.load()).toEqual({ ok: false });
    expect(client.from).not.toHaveBeenCalled();
    for (const [b, i, c] of [
      [failed('42501', 401), answer([]), answer([])],
      [answer([]), failed('PGRST000', 503), answer([])],
      [answer([]), answer([]), failed('PGRST000', 503)],
      [answer(null), answer([]), answer([])],
      [answer([]), answer([]), answer(null)],
      [new Error('offline'), answer([]), answer([])]
    ]) {
      query(b);
      query(i);
      query(c);
      client.rpc.mockResolvedValueOnce(answer(100));
      expect(await cloud.homebrew.load()).toEqual({ ok: false });
    }
  });

  it('creates a row by upsert on its id, ignoring a duplicate, and reads each refusal', async () => {
    const cloud = make();
    const book = { id: 'b1', key: BOOK.key, content: BOOK.content };
    const calls = query(answer(null, 201));
    expect(await cloud.homebrew.createBook(book)).toEqual({ ok: true });
    expect(client.from).toHaveBeenLastCalledWith('homebrew_books');
    expect(calls).toEqual([
      ['upsert', [book, { onConflict: 'id', ignoreDuplicates: true }]],
      ['abortSignal', []]
    ]);
    const item = { id: 'i1', key: ITEM.key, book_id: null, content: CONTENT };
    const cases: [unknown, unknown][] = [
      [
        failed('P0001', 400, 'limit: homebrew_items_per_owner', '100'),
        { ok: false, error: 'limit', key: 'homebrew_items_per_owner', value: 100 }
      ],
      [failed('23505', 409), { ok: false, error: 'refused' }],
      [failed('23514', 400), { ok: false, error: 'refused' }],
      [failed('', 0), { ok: false, error: 'network' }],
      [failed('PGRST000', 503), { ok: false, error: 'network' }]
    ];
    for (const [a, want] of cases) {
      query(a);
      expect(await cloud.homebrew.createItem(item)).toEqual(want);
    }
    expect(client.from).toHaveBeenLastCalledWith('homebrew_items');
  });

  it('updates by id and revision and answers the new revision', async () => {
    const calls = query(answer([{ revision: 4 }]));
    expect(
      await make().homebrew.updateItem('i1', { content: CONTENT, book_id: 'b1' }, 3)
    ).toEqual({ ok: true, revision: 4 });
    expect(client.from).toHaveBeenCalledWith('homebrew_items');
    expect(calls).toEqual([
      ['update', [{ content: CONTENT, book_id: 'b1' }]],
      ['eq', ['id', 'i1']],
      ['eq', ['revision', 3]],
      ['select', ['revision']],
      ['abortSignal', []]
    ]);
  });

  it('writes a forced update without the revision', async () => {
    const calls = query(answer([{ revision: 2 }]));
    expect(await make().homebrew.updateBook('b1', { ru: 'Новое' }, null)).toEqual({
      ok: true,
      revision: 2
    });
    expect(client.from).toHaveBeenCalledWith('homebrew_books');
    expect(calls).toEqual([
      ['update', [{ content: { ru: 'Новое' } }]],
      ['eq', ['id', 'b1']],
      ['select', ['revision']],
      ['abortSignal', []]
    ]);
  });

  it('reads the row when no row matched: the patch held is ok, another row a conflict, none gone', async () => {
    const cloud = make();
    const patch = { content: { ...CONTENT, ru: 'Кольцо II' }, book_id: 'b1' };
    /* jsonb gives the keys back in its own order. */
    const held = { revision: 5, content: { ru: 'Кольцо II', kind: 'item' }, book_id: 'b1' };
    query(answer([]));
    const read = query(answer(held));
    expect(await cloud.homebrew.updateItem('i1', patch, 3)).toEqual({ ok: true, revision: 5 });
    expect(read).toEqual([
      ['select', ['revision,content,book_id']],
      ['eq', ['id', 'i1']],
      ['abortSignal', []],
      ['maybeSingle', []]
    ]);
    query(answer([]));
    query(answer({ ...held, book_id: null }));
    expect(await cloud.homebrew.updateItem('i1', patch, 3)).toEqual({
      ok: false,
      error: 'conflict'
    });
    query(answer([]));
    query(answer(null));
    expect(await cloud.homebrew.updateItem('i1', patch, 3)).toEqual({
      ok: false,
      error: 'gone'
    });
    query(answer([]));
    query(failed('PGRST000', 503));
    expect(await cloud.homebrew.updateItem('i1', patch, 3)).toEqual({
      ok: false,
      error: 'network'
    });
    query(answer([]));
    const bookRead = query(answer({ revision: 2, content: { ru: 'Новое' } }));
    expect(await cloud.homebrew.updateBook('b1', { ru: 'Новое' }, 1)).toEqual({
      ok: true,
      revision: 2
    });
    expect(bookRead[0]).toEqual(['select', ['revision,content']]);
  });

  it('reads a refused update and a thrown one', async () => {
    const cloud = make();
    query(failed('23514', 400));
    expect(
      await cloud.homebrew.updateItem('i1', { content: CONTENT, book_id: null }, 1)
    ).toEqual({
      ok: false,
      error: 'refused'
    });
    query(new Error('offline'));
    expect(await cloud.homebrew.updateBook('b1', { ru: 'a' }, 1)).toEqual({
      ok: false,
      error: 'network'
    });
  });

  it('removes a row by id', async () => {
    const cloud = make();
    const book = query(answer(null, 204));
    expect(await cloud.homebrew.removeBook('b1')).toEqual({ ok: true });
    expect(book).toEqual([
      ['delete', []],
      ['eq', ['id', 'b1']],
      ['abortSignal', []]
    ]);
    const item = query(answer(null, 204));
    expect(await cloud.homebrew.removeItem('i1')).toEqual({ ok: true });
    expect(item).toEqual([
      ['delete', []],
      ['eq', ['id', 'i1']],
      ['abortSignal', []]
    ]);
    expect(client.from.mock.calls.map((c) => c[0])).toEqual([
      'homebrew_books',
      'homebrew_items'
    ]);
  });

  it('creates, updates and removes a card on homebrew_cards', async () => {
    const cloud = make();
    const row = {
      id: 'c1',
      key: CARD.key,
      kind: 'set' as const,
      book_id: null,
      content: CARD.content
    };
    const created = query(answer(null, 201));
    expect(await cloud.homebrew.createCard(row)).toEqual({ ok: true });
    expect(created).toEqual([
      ['upsert', [row, { onConflict: 'id', ignoreDuplicates: true }]],
      ['abortSignal', []]
    ]);
    const updated = query(answer([{ revision: 3 }]));
    const patch = { content: { ru: 'Комплект Ольхи II' }, book_id: 'b1' };
    expect(await cloud.homebrew.updateCard('c1', patch, 2)).toEqual({ ok: true, revision: 3 });
    expect(updated).toEqual([
      ['update', [patch]],
      ['eq', ['id', 'c1']],
      ['eq', ['revision', 2]],
      ['select', ['revision']],
      ['abortSignal', []]
    ]);
    query(answer([]));
    const held = query(answer(null));
    expect(await cloud.homebrew.updateCard('c1', patch, 2)).toEqual({
      ok: false,
      error: 'gone'
    });
    expect(held[0]).toEqual(['select', ['revision,content,book_id']]);
    query(failed('P0001', 400, 'limit: homebrew_cards_per_owner', '100'));
    expect(await cloud.homebrew.createCard(row)).toEqual({
      ok: false,
      error: 'limit',
      key: 'homebrew_cards_per_owner',
      value: 100
    });
    const removed = query(answer(null, 204));
    expect(await cloud.homebrew.removeCard('c1')).toEqual({ ok: true });
    expect(removed).toEqual([
      ['delete', []],
      ['eq', ['id', 'c1']],
      ['abortSignal', []]
    ]);
    expect(new Set(client.from.mock.calls.map((c) => c[0]))).toEqual(
      new Set(['homebrew_cards'])
    );
  });

  it('makes a fresh id and a key of the key shape', () => {
    const { homebrew } = make();
    expect(homebrew.newId()).toMatch(/^[0-9a-f-]{36}$/);
    const [a, b] = [homebrew.newKey(), homebrew.newKey()];
    expect(a).toMatch(/^hb_[a-z2-7]{16}$/);
    expect(a).not.toBe(b);
  });

  describe('with no answer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      [
        'createBook',
        (c: ReturnType<typeof make>) =>
          c.homebrew.createBook({ id: 'b', key: BOOK.key, content: BOOK.content })
      ],
      [
        'updateBook',
        (c: ReturnType<typeof make>) => c.homebrew.updateBook('b', BOOK.content, 1)
      ],
      ['removeBook', (c: ReturnType<typeof make>) => c.homebrew.removeBook('b')],
      [
        'createItem',
        (c: ReturnType<typeof make>) =>
          c.homebrew.createItem({ id: 'i', key: ITEM.key, book_id: null, content: CONTENT })
      ],
      [
        'updateItem',
        (c: ReturnType<typeof make>) =>
          c.homebrew.updateItem('i', { content: CONTENT, book_id: null }, null)
      ],
      ['removeItem', (c: ReturnType<typeof make>) => c.homebrew.removeItem('i')]
    ])('answers network for %s after WRITE_TIMEOUT_MS', async (_name, call) => {
      query(NEVER);
      let got: unknown = 'pending';
      void call(make()).then((a) => {
        got = a;
      });
      await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS - 1);
      expect(got).toBe('pending');
      await vi.advanceTimersByTimeAsync(1);
      expect(got).toEqual({ ok: false, error: 'network' });
    });

    it('answers network when the read after a missed update gets no answer', async () => {
      query(answer([]));
      query(NEVER);
      let got: unknown = 'pending';
      void make()
        .homebrew.updateItem('i', { content: CONTENT, book_id: null }, 1)
        .then((a) => {
          got = a;
        });
      await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS - 1);
      expect(got).toBe('pending');
      await vi.advanceTimersByTimeAsync(1);
      expect(got).toEqual({ ok: false, error: 'network' });
    });
  });
});

describe('the homebrew import and the bulk move', () => {
  const ROWS = {
    books: [{ id: 'b1', key: 'hb_bookbbbbbbbbbbbb', content: { ru: 'Источник' }, names: true }],
    cards: [],
    items: [
      {
        id: 'i1',
        key: 'hb_itemcccccccccccc',
        book: 'hb_bookbbbbbbbbbbbb',
        content: { kind: 'item' as const, ru: 'Предмет' }
      }
    ],
    update: false
  };
  const COUNTS = {
    books_created: 1,
    cards_created: 0,
    cards_updated: 0,
    cards_skipped: 0,
    items_created: 1,
    items_updated: 0,
    items_skipped: 0
  };

  it('sends the rows in one import_homebrew call and reads the counts', async () => {
    client.rpc.mockResolvedValueOnce({ data: COUNTS, error: null, status: 200 });
    expect(await make().homebrew.import(ROWS)).toEqual({ ok: true, counts: COUNTS });
    expect(client.rpc).toHaveBeenCalledWith('import_homebrew', {
      p_books: ROWS.books,
      p_cards: [],
      p_items: ROWS.items,
      p_update: false
    });
  });

  it('reads the seven counts of an answer that holds an eighth key', async () => {
    client.rpc.mockResolvedValueOnce({
      data: { ...COUNTS, books_updated: 2 },
      error: null,
      status: 200
    });
    expect(await make().homebrew.import(ROWS)).toEqual({ ok: true, counts: COUNTS });
  });

  it.each([
    ['a count missing', { ...COUNTS, items_skipped: undefined }],
    ['a count that is not a whole number', { ...COUNTS, items_created: 1.5 }],
    ['a negative count', { ...COUNTS, cards_created: -1 }],
    ['an array', [COUNTS]],
    ['null', null]
  ])('reads an answer with %s as refused', async (_name, data) => {
    client.rpc.mockResolvedValueOnce({ data, error: null, status: 200 });
    expect(await make().homebrew.import(ROWS)).toEqual({ ok: false, error: 'refused' });
  });

  it.each([
    [
      '400 an item limit',
      {
        error: { code: 'P0001', message: 'limit: homebrew_items_per_owner', details: '100' },
        status: 400
      },
      { ok: false, error: 'limit', key: 'homebrew_items_per_owner', value: 100 }
    ],
    [
      '400 22023',
      { error: { code: '22023', message: 'import_homebrew: no source x' }, status: 400 },
      { ok: false, error: 'refused' }
    ],
    [
      '400 23514, a check',
      { error: { code: '23514', message: 'homebrew_books_content_check' }, status: 400 },
      { ok: false, error: 'refused' }
    ],
    [
      '403 28000',
      { error: { code: '28000', message: 'import_homebrew: not signed in' }, status: 403 },
      { ok: false, error: 'network' }
    ],
    [
      '500 57014, the statement timeout',
      { error: { code: '57014', message: 'canceling statement' }, status: 500 },
      { ok: false, error: 'refused', reason: 'tooSlow' }
    ],
    ['thrown', new Error('offline'), { ok: false, error: 'network' }]
  ])('reads an import answered %s', async (_name, answer, want) => {
    if (answer instanceof Error) client.rpc.mockRejectedValueOnce(answer);
    else client.rpc.mockResolvedValueOnce({ data: null, ...answer });
    expect(await make().homebrew.import(ROWS)).toEqual(want);
  });

  const MOVE = [{ id: 'i1', revision: 3 }];

  it('sends a move in one move_homebrew_items call', async () => {
    client.rpc.mockResolvedValueOnce({ data: 1, error: null, status: 200 });
    expect(await make().homebrew.moveItems(MOVE, 'b1', 'hb_sectaaaaaaaaaaaa')).toEqual({
      ok: true
    });
    expect(client.rpc).toHaveBeenCalledWith('move_homebrew_items', {
      p_items: MOVE,
      p_book: 'b1',
      p_section: 'hb_sectaaaaaaaaaaaa'
    });
  });

  it.each([
    [
      'a conflict',
      {
        error: { code: 'P0001', message: 'move_homebrew_items: conflict i1' },
        status: 400
      },
      { ok: false, error: 'conflict' }
    ],
    [
      'a deleted source, P0002 with HTTP 500',
      { error: { code: 'P0002', message: 'move_homebrew_items: no source' }, status: 500 },
      { ok: false, error: 'gone' }
    ],
    [
      'the statement timeout, never network',
      { error: { code: '57014', message: 'canceling statement' }, status: 500 },
      { ok: false, error: 'refused' }
    ],
    [
      '400 22023',
      { error: { code: '22023', message: 'move_homebrew_items: an item twice' }, status: 400 },
      { ok: false, error: 'refused' }
    ],
    [
      '403 28000',
      { error: { code: '28000', message: 'move_homebrew_items: not signed in' }, status: 403 },
      { ok: false, error: 'network' }
    ],
    [
      '503',
      { error: { code: 'PGRST000', message: 'x' }, status: 503 },
      { ok: false, error: 'network' }
    ],
    ['thrown', new Error('offline'), { ok: false, error: 'network' }]
  ])('reads a move answered %s', async (_name, answer, want) => {
    if (answer instanceof Error) client.rpc.mockRejectedValueOnce(answer);
    else client.rpc.mockResolvedValueOnce({ data: null, ...answer });
    expect(await make().homebrew.moveItems(MOVE, null, null)).toEqual(want);
  });
});

describe('the item read and the change log', () => {
  type Call = [string, unknown[]];
  const LIST = '00000000-0000-4000-8000-000000000201';
  const HID = '00000000-0000-4000-8000-000000000511';

  /* One PostgREST query of `list_notices`: every builder call, then the answer. */
  function query(answer: unknown) {
    const calls: Call[] = [];
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'delete', 'eq', 'in', 'order', 'limit', 'abortSignal']) {
      q[m] = (...args: unknown[]) => {
        calls.push([m, m === 'abortSignal' ? [] : args]);
        return q;
      };
    }
    q['then'] = (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
      (answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer)).then(
        ok,
        fail
      );
    client.from.mockImplementationOnce(() => q as unknown as typeof rows);
    return calls;
  }
  const NOTICE = {
    id: '00000000-0000-4000-8000-000000000681',
    list_id: LIST,
    item_key: 'hb_emberaxeaaaaaaaa',
    hid: HID,
    kind: 'changed',
    name: { en: 'Ember Axe', ru: 'Топор' },
    created_at: '2026-10-07T10:00:00+00:00',
    read_at: null
  };

  it('reads one item by its id signed out too, an unknown id as null, a failure as not ok', async () => {
    client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    client.rpc
      .mockResolvedValueOnce({ data: { hid: HID }, error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: null, status: 200 })
      .mockResolvedValueOnce({ data: null, error: { code: '22P02' }, status: 400 })
      .mockRejectedValueOnce(new Error('offline'));
    const { lists } = make();
    expect(await lists.item(HID)).toEqual({ ok: true, item: { hid: HID } });
    expect(client.rpc).toHaveBeenLastCalledWith('get_homebrew_item', { p_id: HID });
    expect(await lists.item(HID)).toEqual({ ok: true, item: null });
    expect(await lists.item(HID)).toEqual({ ok: false });
    expect(await lists.item(HID)).toEqual({ ok: false });
  });

  it('reads every list cut at the row cap, or one list, newest first', async () => {
    const all = query({ data: [NOTICE], error: null, status: 200 });
    const { requests } = make();
    expect(await requests.notices()).toEqual({ ok: true, notices: [NOTICE] });
    expect(client.from).toHaveBeenLastCalledWith('list_notices');
    expect(all).toEqual([
      ['select', ['id,list_id,item_key,hid,kind,name,created_at,read_at']],
      ['order', ['created_at', { ascending: false }]],
      ['order', ['id']],
      ['limit', [READ_PAGE]]
    ]);
    const one = query({ data: [], error: null, status: 200 });
    expect(await requests.notices(LIST)).toEqual({ ok: true, notices: [] });
    expect(one[1]).toEqual(['eq', ['list_id', LIST]]);
  });

  it('answers not ok signed out, on an error and on a throw', async () => {
    query({ data: null, error: { code: '42501' }, status: 401 });
    query(new Error('offline'));
    const { requests } = make();
    expect(await requests.notices()).toEqual({ ok: false });
    expect(await requests.notices()).toEqual({ ok: false });
    client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await requests.notices()).toEqual({ ok: false });
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it('hides notices by list and ids', async () => {
    const calls = query({ data: null, error: null, status: 204 });
    query(new Error('offline'));
    const { requests } = make();
    expect(await requests.hideNotices(LIST, ['n1', 'n2'])).toEqual({ ok: true });
    expect(calls).toEqual([
      ['delete', []],
      ['eq', ['list_id', LIST]],
      ['in', ['id', ['n1', 'n2']]],
      ['abortSignal', []]
    ]);
    expect(await requests.hideNotices(LIST, ['n1'])).toEqual({ ok: false, error: 'network' });
  });

  it('hides 120 notices in three deletes of at most 50 ids, ok only when all are ok', async () => {
    const ids = Array.from({ length: 120 }, (_, i) => `n${String(i)}`);
    const chunks = [0, 1, 2].map(() => query({ data: null, error: null, status: 204 }));
    const { requests } = make();
    expect(await requests.hideNotices(LIST, ids)).toEqual({ ok: true });
    expect(client.from).toHaveBeenCalledTimes(3);
    expect(
      chunks.map((c) => (c.find(([m]) => m === 'in')?.[1] as [string, string[]])[1])
    ).toEqual([ids.slice(0, 50), ids.slice(50, 100), ids.slice(100)]);

    client.from.mockClear();
    query({ data: null, error: null, status: 204 });
    query(new Error('offline'));
    expect(await requests.hideNotices(LIST, ids)).toEqual({ ok: false, error: 'network' });
    expect(client.from).toHaveBeenCalledTimes(2);
  });
});
