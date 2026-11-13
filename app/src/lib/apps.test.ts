import { describe, expect, it } from 'vitest';
import { appHost, isAuthorizationId, longDate, newestFirst } from './apps.js';

describe('isAuthorizationId', () => {
  it('takes 32 characters of a-z and 0-9 only', () => {
    expect(isAuthorizationId('a'.repeat(32))).toBe(true);
    expect(isAuthorizationId('0123456789abcdefghijklmnopqrstuv')).toBe(true);
    expect(isAuthorizationId('a'.repeat(31))).toBe(false);
    expect(isAuthorizationId('a'.repeat(33))).toBe(false);
    expect(isAuthorizationId('A'.repeat(32))).toBe(false);
    expect(isAuthorizationId('a'.repeat(31) + '-')).toBe(false);
    expect(isAuthorizationId('')).toBe(false);
  });
});

describe('appHost', () => {
  it('shows the host of an https address and any other address with its scheme', () => {
    expect(appHost('https://claude.ai/api/mcp/auth_callback')).toBe('claude.ai');
    expect(appHost('https://example.org:8443/cb')).toBe('example.org:8443');
    expect(appHost('http://127.0.0.1:53682/cb')).toBe('http://127.0.0.1:53682');
    expect(appHost('cursor://anysphere.cursor-retrieval/oauth/callback')).toBe(
      'cursor://anysphere.cursor-retrieval'
    );
    expect(appHost('myapp:/callback')).toBe('myapp:callback');
    expect(appHost('myapp:')).toBe('myapp:');
  });

  it('answers nothing for an address that does not parse', () => {
    expect(appHost('')).toBe('');
    expect(appHost('not a url')).toBe('');
  });
});

describe('longDate', () => {
  it('writes the long date in the interface language, by UTC', () => {
    expect(longDate('2026-11-12T10:00:00Z', 'ru')).toBe('12 ноября 2026');
    expect(longDate('2026-11-12T10:00:00Z', 'en')).toBe('12 November 2026');
    expect(longDate('2026-01-01T00:30:00+01:00', 'en')).toBe('31 December 2025');
    expect(longDate('nonsense', 'ru')).toBe('');
  });
});

describe('newestFirst', () => {
  it('orders the grants newest first, the same time by name', () => {
    const g = (name: string, grantedAt: string) => ({
      clientId: name,
      name,
      host: '',
      grantedAt
    });
    expect(
      newestFirst([
        g('b', '2026-10-01T00:00:00Z'),
        g('c', '2026-11-01T00:00:00Z'),
        g('a', '2026-10-01T00:00:00Z')
      ]).map((x) => x.name)
    ).toEqual(['c', 'a', 'b']);
  });
});
