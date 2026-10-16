/* The real adapter over the real auth-js, postgrest-js, realtime-js and storage-js, with
   only `fetch` stubbed: what supabase.test.ts's constructor stubs cannot show - the
   addresses, the storage keys and the headers the packages themselves derive from the
   options (docs/specs/COVERAGE.md, the row of this file). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Redirect } from './redirect.js';
import { createCloud } from './supabase.js';

const REF = 'abcdefghijklmnopqrst';
const ORIGIN = `https://${REF}.supabase.co`;
const KEY = 'sb_publishable_test';
const STORAGE_KEY = `sb-${REF}-auth-token`;

const USER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'gm1@example.test',
  app_metadata: { provider: 'google' },
  user_metadata: {},
  created_at: '2026-10-16T00:00:00Z'
};
const tokenAnswer = (access: string) => ({
  access_token: access,
  refresh_token: 'refresh-' + access,
  token_type: 'bearer',
  expires_in: 3600,
  user: USER
});

let store: Map<string, string>;
const memory = () => ({
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  }
});

let sent: { url: string; init: RequestInit | undefined }[];
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });

beforeEach(() => {
  store = new Map();
  sent = [];
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    sent.push({ url, init });
    if (url.startsWith(ORIGIN + '/auth/v1/token'))
      return Promise.resolve(json(tokenAnswer('B')));
    return Promise.resolve(json([]));
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const headerOf = (request: (typeof sent)[number] | undefined, name: string) =>
  new Headers(request?.init?.headers).get(name);

describe('the account clients from the real packages', () => {
  it("sends a stored session's token, the key and the tab id with a PostgREST read", async () => {
    store.set(
      STORAGE_KEY,
      JSON.stringify({
        ...tokenAnswer('A'),
        expires_at: Math.floor(Date.now() / 1000) + 3600
      })
    );
    const cloud = createCloud(ORIGIN, KEY, null, window, memory());
    expect(await cloud.prefs.load()).toEqual({ ok: true, prefs: null });
    const read = sent.find((r) => r.url.startsWith(ORIGIN + '/rest/v1/user_prefs?'));
    expect(read?.url).toBe(`${ORIGIN}/rest/v1/user_prefs?select=prefs&user_id=eq.${USER.id}`);
    expect(headerOf(read, 'apikey')).toBe(KEY);
    expect(headerOf(read, 'Authorization')).toBe('Bearer A');
    expect(headerOf(read, 'x-dhloot-tab')).toMatch(/^[0-9a-f-]{36}$/);
    expect(sent.filter((r) => r.url.includes('/auth/v1/'))).toEqual([]);
  });

  it('exchanges a redirect code with the stored verifier and stores the session under the same key', async () => {
    store.set(STORAGE_KEY + '-code-verifier', JSON.stringify('verifier-1'));
    const redirect: Redirect = {
      code: 'code-1',
      error: null,
      kind: 'signIn',
      provider: 'google',
      action: null
    };
    const cloud = createCloud(ORIGIN, KEY, redirect, window, memory());
    expect(await cloud.auth.redirectResult()).toEqual({
      kind: 'signIn',
      provider: 'google',
      result: { ok: true },
      action: null
    });
    const exchange = sent.find((r) => r.url.startsWith(ORIGIN + '/auth/v1/'));
    expect(exchange?.url).toBe(ORIGIN + '/auth/v1/token?grant_type=pkce');
    expect(exchange?.init?.method).toBe('POST');
    expect(JSON.parse(exchange?.init?.body as string)).toEqual({
      auth_code: 'code-1',
      code_verifier: 'verifier-1'
    });
    expect(headerOf(exchange, 'apikey')).toBe(KEY);
    expect(headerOf(exchange, 'Authorization')).toBe('Bearer ' + KEY);
    expect(headerOf(exchange, 'x-dhloot-tab')).toBeNull();
    const saved = JSON.parse(store.get(STORAGE_KEY) ?? 'null') as { access_token?: string };
    expect(saved.access_token).toBe('B');
    expect(store.has(STORAGE_KEY + '-code-verifier')).toBe(false);
    expect(await cloud.auth.session()).toEqual({
      userId: USER.id,
      email: USER.email,
      provider: 'google'
    });
  });

  it('leaves a verifier under the same key when a Google or a Discord sign-in starts', async () => {
    /* jsdom does not navigate to another origin: `location.assign` reports
       "not implemented" and returns, so the start completes and waits for `pageshow`. */
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const cloud = createCloud(ORIGIN, KEY, null, window, memory());
      const verifiers: (string | undefined)[] = [];
      for (const provider of ['google', 'discord'] as const) {
        void cloud.auth.signIn(provider);
        await vi.waitFor(() => {
          const now = store.get(STORAGE_KEY + '-code-verifier');
          expect(now).toBeDefined();
          expect(now).not.toBe(verifiers.at(-1));
          verifiers.push(now);
        });
      }
      expect(verifiers).toHaveLength(2);
      expect(sent).toEqual([]);
    } finally {
      quiet.mockRestore();
    }
  });
});

describe('the package versions', () => {
  /* A split version installs a second copy, and the old and the new bundle share one
     stored session (docs/decisions/2026-09-24-the-account-client-loads-after-first-paint-a.md). */
  it("pins the four packages at supabase-js's version", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(import.meta.dirname, '..', '..', '..', 'package.json'), 'utf8')
    ) as {
      devDependencies: Record<string, string>;
    };
    const dev = pkg.devDependencies;
    const four = ['auth-js', 'postgrest-js', 'realtime-js', 'storage-js'].map(
      (name) => dev['@supabase/' + name]
    );
    expect(dev['@supabase/supabase-js']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(four).toEqual(Array(4).fill(dev['@supabase/supabase-js']));
  });
});
