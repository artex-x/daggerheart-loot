/* The real adapter's mapping, over a stub supabase-js client - layer 1's
   "ports against fake clients". The client itself meets the hosted test
   project in the E2E layer (docs/specs/COVERAGE.md, "Test layers"). */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RETURN_KEY, type Redirect } from './redirect.js';
import { createCloud } from './supabase.js';

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
    from: vi.fn(() => rows)
  };
  return { client, createClient: vi.fn(() => client), rows };
});

vi.mock('@supabase/supabase-js', () => ({ createClient }));

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
      }
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
      result: { ok: true }
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
      result: { ok: false, error: 'alreadyLinked' }
    });
    client.auth.exchangeCodeForSession.mockRejectedValueOnce(new Error('offline'));
    const thrown = make(redirect({ code: 'b', kind: 'signIn', provider: null }));
    expect(await thrown.auth.redirectResult()).toEqual({
      kind: 'signIn',
      provider: null,
      result: { ok: false, error: 'failed' }
    });
    expect(await thrown.auth.identities()).toHaveLength(2);
  });

  it('reports the error parameters of a redirect, and nothing without one', async () => {
    expect(
      await make(redirect({ error: 'identity_already_exists' })).auth.redirectResult()
    ).toEqual({
      kind: 'link',
      provider: 'discord',
      result: { ok: false, error: 'alreadyLinked' }
    });
    expect(await make(redirect({ error: 'access_denied' })).auth.redirectResult()).toEqual({
      kind: 'link',
      provider: 'discord',
      result: { ok: false, error: 'failed' }
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
      }
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
