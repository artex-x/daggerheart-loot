/* The provider redirect's way back: what `takeRedirect` reads, keeps and
   cleans, over a stub window. */
import { describe, expect, it, vi } from 'vitest';
import {
  callbackUrl,
  RETURN_KEY,
  RETURN_MS,
  saveReturn,
  takeRedirect,
  type RedirectWindow
} from './redirect.js';

const NOW = 1_800_000_000_000;
const PAGE = 'https://example.test/loot/';

function stubWin(href: string, stored: Record<string, string> = {}) {
  const store = new Map(Object.entries(stored));
  const replaceState =
    vi.fn<(data: unknown, unused: string, url?: string | URL | null) => void>();
  const win: RedirectWindow = {
    location: { href, hash: new URL(href).hash },
    sessionStorage: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => {
        store.set(k, v);
      },
      removeItem: (k) => {
        store.delete(k);
      }
    },
    history: { replaceState }
  };
  return { win, store, replaceState, landed: () => String(replaceState.mock.calls[0]?.[2]) };
}

function throwingWin(href: string): RedirectWindow {
  const boom = (): never => {
    throw new Error('SecurityError');
  };
  return {
    location: { href, hash: '' },
    sessionStorage: { getItem: boom, setItem: boom, removeItem: boom },
    history: { replaceState: vi.fn() }
  };
}

const record = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({
    hash: '#/lists',
    kind: 'link',
    provider: 'discord',
    at: NOW - 1000,
    ...over
  });

describe('callbackUrl', () => {
  it('is the page without index.html, its query or its hash, plus the flag', () => {
    expect(callbackUrl(PAGE + 'index.html?as=x#/account')).toBe(PAGE + '?auth-callback=1');
    expect(callbackUrl(PAGE + '#/roll/std')).toBe(PAGE + '?auth-callback=1');
  });
});

describe('saveReturn', () => {
  it('stores the record with the time it was made', () => {
    const { win, store } = stubWin(PAGE);
    saveReturn(win, { hash: '#/lists', kind: 'signIn', provider: 'google' }, NOW);
    expect(JSON.parse(store.get(RETURN_KEY) ?? '')).toEqual({
      hash: '#/lists',
      kind: 'signIn',
      provider: 'google',
      at: NOW
    });
  });

  it('ignores a storage that throws', () => {
    expect(() => {
      saveReturn(throwingWin(PAGE), { hash: '#/a', kind: 'signIn', provider: 'google' });
    }).not.toThrow();
  });
});

describe('takeRedirect', () => {
  it('answers null and touches nothing without the callback flag', () => {
    const { win, store, replaceState } = stubWin(PAGE + '?code=abc#/lists', {
      [RETURN_KEY]: record()
    });
    expect(takeRedirect(win, NOW)).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
    expect(store.has(RETURN_KEY)).toBe(true);
  });

  it('reads the code, takes the record and returns to its page', () => {
    const { win, store, landed } = stubWin(PAGE + '?auth-callback=1&code=abc', {
      [RETURN_KEY]: record()
    });
    expect(takeRedirect(win, NOW)).toEqual({
      code: 'abc',
      error: null,
      kind: 'link',
      provider: 'discord'
    });
    expect(store.has(RETURN_KEY)).toBe(false);
    expect(landed()).toBe(PAGE + '#/lists');
  });

  it('prefers error_code to error, drops every callback parameter and keeps the rest', () => {
    const { win, landed } = stubWin(
      PAGE +
        '?as=gm1&auth-callback=1&error=server_error&error_code=identity_already_exists' +
        '&error_description=x',
      { [RETURN_KEY]: record() }
    );
    const r = takeRedirect(win, NOW);
    expect(r?.error).toBe('identity_already_exists');
    expect(r?.code).toBeNull();
    expect(landed()).toBe(PAGE + '?as=gm1#/lists');
  });

  it('reads an error from the hash without routing it', () => {
    const { win, landed } = stubWin(
      PAGE + '?auth-callback=1#error=access_denied&error_description=cancelled'
    );
    expect(takeRedirect(win, NOW)).toEqual({
      code: null,
      error: 'access_denied',
      kind: 'signIn',
      provider: null
    });
    expect(landed()).toBe(PAGE + '#/account');
  });

  it('reads a hash of tokens as parameters and drops it', () => {
    const { win, landed } = stubWin(PAGE + '?auth-callback=1#access_token=t&code=c');
    expect(takeRedirect(win, NOW)?.code).toBe('c');
    expect(landed()).toBe(PAGE + '#/account');
  });

  it('opens the account page with no record', () => {
    const { win, landed } = stubWin(PAGE + '?auth-callback=1&code=abc#/roll/std');
    expect(takeRedirect(win, NOW)?.kind).toBe('signIn');
    expect(landed()).toBe(PAGE + '#/account');
  });

  it.each([
    ['a stale record', { at: NOW - RETURN_MS - 1 }],
    ['a record from the future', { at: NOW + 1 }],
    ['a record with no time', { at: 'soon' }],
    ['a foreign hash', { hash: 'https://evil.test/' }],
    ['a hash that is not text', { hash: 42 }],
    ['an overlong hash', { hash: '#/' + 'x'.repeat(2046) }],
    ['a bad kind', { kind: 'steal' }],
    ['a bad provider', { provider: 'github' }]
  ])('refuses %s, removes it and opens the account page', (_label, over) => {
    const { win, store, landed } = stubWin(PAGE + '?auth-callback=1&code=abc', {
      [RETURN_KEY]: record(over)
    });
    expect(takeRedirect(win, NOW)).toEqual({
      code: 'abc',
      error: null,
      kind: 'signIn',
      provider: null
    });
    expect(store.has(RETURN_KEY)).toBe(false);
    expect(landed()).toBe(PAGE + '#/account');
  });

  it.each([
    ['not JSON', '{'],
    ['not an object', '7'],
    ['null', 'null']
  ])('refuses a record that is %s', (_label, raw) => {
    const { win, landed } = stubWin(PAGE + '?auth-callback=1&code=abc', { [RETURN_KEY]: raw });
    expect(takeRedirect(win, NOW)?.provider).toBeNull();
    expect(landed()).toBe(PAGE + '#/account');
  });

  it('reads a storage that throws as no record', () => {
    const win = throwingWin(PAGE + '?auth-callback=1&code=abc');
    expect(takeRedirect(win, NOW)).toEqual({
      code: 'abc',
      error: null,
      kind: 'signIn',
      provider: null
    });
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', PAGE + '#/account');
  });

  it('defaults to the real window and clock', () => {
    expect(takeRedirect()).toBeNull();
  });
});
