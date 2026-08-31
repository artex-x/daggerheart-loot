/* Ports exist so these cases can be tested at all. Each one here is a way the
   browser says no, and every one of them is a thing that actually happens to
   somebody: a private window, a page opened from a folder, an older browser, a
   share sheet dismissed on purpose. */
import { describe, expect, it, vi } from 'vitest';
import { browserClipboard, fakeClipboard } from './clipboard.js';
import { browserCompress, plainCompress } from './compress.js';
import { nativeDrag } from './drag.js';
import { hashRouter, memoryRouter } from './router.js';
import { browserShare } from './share.js';
import { brokenStorage, browserStorage, memoryStorage } from './storage.js';
import { browserData, fakeData, noData } from './data.js';
import { browserEnv, fakeEnv } from './index.js';

describe('storage that works', () => {
  it('round-trips a value', () => {
    const s = memoryStorage();
    expect(s.set('k', 'v')).toBe(true);
    expect(s.get('k')).toBe('v');
    s.remove('k');
    expect(s.get('k')).toBeNull();
  });

  it('answers null for a key nobody wrote', () => {
    expect(memoryStorage().get('nope')).toBeNull();
  });
});

describe('storage that does not', () => {
  it('says so instead of throwing', () => {
    /* A private window throws on read as well as on write. The app shows a
       warning and keeps going; it must not pretend the lists were saved. */
    const s = brokenStorage();
    expect(s.works()).toBe(false);
    expect(s.set('k', 'v')).toBe(false);
    expect(s.get('k')).toBeNull();
    expect(() => {
      s.remove('k');
    }).not.toThrow();
  });

  it('survives a localStorage that throws on every call', () => {
    const boom = (): never => {
      throw new Error('denied');
    };
    const win = {
      get localStorage(): Storage {
        return boom();
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    } as unknown as Window;
    const s = browserStorage(win);
    expect(s.works()).toBe(false);
    expect(s.get('k')).toBeNull();
    expect(s.set('k', 'v')).toBe(false);
  });

  it('reports a full quota as a failed write, not a crash', () => {
    const win = {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => undefined
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    } as unknown as Window;
    expect(browserStorage(win).set('k', 'v')).toBe(false);
  });
});

describe('another tab writing', () => {
  it('is what the merge listens to', () => {
    const seen: string[] = [];
    const listeners: ((e: StorageEvent) => void)[] = [];
    const win = {
      localStorage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined
      },
      addEventListener: (_t: string, fn: (e: StorageEvent) => void) => {
        listeners.push(fn);
      },
      removeEventListener: () => undefined
    } as unknown as Window;

    browserStorage(win).onExternalChange((k) => seen.push(k));
    listeners[0]?.({ key: 'dhloot.lists.v2' } as StorageEvent);
    /* A cleared storage fires with a null key and means nothing to the merge */
    listeners[0]?.({ key: null } as StorageEvent);
    expect(seen).toEqual(['dhloot.lists.v2']);
  });

  it('can be unsubscribed', () => {
    const s = memoryStorage();
    const fn = vi.fn();
    s.onExternalChange(fn)();
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('the address', () => {
  it('separates a step from a rewrite', () => {
    /* The filter segment is rewritten on every click. Through navigate it would
       bury the page the person came from under a hundred entries. */
    const r = memoryRouter('#/tables/eq_weapon');
    r.replace('#/tables/eq_weapon/f_tier-2');
    r.replace('#/tables/eq_weapon/f_tier-2.cls-mag');
    expect(r.stack).toHaveLength(1);
    expect(r.canGoBack()).toBe(false);

    r.navigate('#/lists');
    expect(r.stack).toHaveLength(2);
    expect(r.canGoBack()).toBe(true);
    r.back();
    expect(r.hash()).toBe('#/tables/eq_weapon/f_tier-2.cls-mag');
  });

  it('tells subscribers, and stops when unsubscribed', () => {
    const r = memoryRouter();
    const seen: string[] = [];
    const off = r.onChange((h) => seen.push(h));
    r.navigate('#/lists');
    off();
    r.navigate('#/search');
    expect(seen).toEqual(['#/lists']);
  });

  it('falls back to assigning the hash where replaceState is missing', () => {
    /* Which is the case when the page is opened from a folder */
    const win = {
      location: {
        hash: '#/a',
        pathname: '/x.html',
        search: '',
        href: 'file:///tmp/x.html#/a',
        protocol: 'file:'
      },
      history: { length: 1 },
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    } satisfies NonNullable<Parameters<typeof hashRouter>[0]>;
    hashRouter(win).replace('#/b');
    expect(win.location.hash).toBe('#/b');
  });
});

describe('short links', () => {
  const raw = 'Тайник\n2.7ouh~ci1,cc1\nа тут длинная заметка, которая точно сожмётся';

  it('round-trip through the real compressor', async () => {
    const c = browserCompress();
    if (!c.available()) return; // older runtime; the plain path is tested below
    const packed = await c.pack(raw);
    const back = await c.unpack(packed);
    expect(await plainCompress().unpack(await plainCompress().pack(raw))).toBe(back);
  });

  it('only uses the packed form when it is actually shorter', async () => {
    const c = browserCompress();
    if (!c.available()) return;
    /* Three ids and no notes: the deflate header costs more than it saves */
    const short = 'A\n1.abcd~ci1';
    expect((await c.pack(short)).startsWith('~')).toBe(false);
  });

  it('works without CompressionStream at all', async () => {
    const c = browserCompress({});
    expect(c.available()).toBe(false);
    const packed = await c.pack(raw);
    expect(packed.startsWith('~')).toBe(false);
    /* And an unpacker still understands the plain form */
    expect(await c.unpack(packed)).toBe(packed);
  });

  it('leaves an unmarked payload alone', async () => {
    expect(await plainCompress().unpack('0JrQu9Cw0LQ')).toBe('0JrQu9Cw0LQ');
  });
});

describe('sharing', () => {
  const what = { title: 'T', text: 'X', url: 'https://example.test/#/i/ci1' };

  it('says so when there is no sheet', async () => {
    expect(await browserShare({}).share(what)).toBe('unsupported');
  });

  it('tells a dismissal apart from a failure', async () => {
    /* Someone closing their own share sheet must not be shown an error */
    const abort = Object.assign(new Error('x'), { name: 'AbortError' });
    const nav = { share: () => Promise.reject(abort) };
    expect(await browserShare(nav).share(what)).toBe('dismissed');

    const broken = { share: () => Promise.reject(new Error('nope')) };
    expect(await browserShare(broken).share(what)).toBe('failed');
  });

  it('falls back to text when the picture will not go', async () => {
    const calls: ShareData[] = [];
    const nav = {
      share: (d: ShareData) => {
        calls.push(d);
        return Promise.resolve();
      },
      canShare: () => false
    };
    const file = (): Promise<File> => Promise.resolve(new File([''], 'x.png'));
    expect(await browserShare(nav).share({ ...what, file })).toBe('shared');
    expect(calls[0]?.files).toBeUndefined();
    expect(calls[0]?.url).toBe(what.url);
  });

  it('sends the text when the picture itself fails to load', async () => {
    /* The picture failed, not the intent */
    const calls: ShareData[] = [];
    const nav = {
      share: (d: ShareData) => {
        calls.push(d);
        return Promise.resolve();
      },
      canShare: () => true
    };
    const file = (): Promise<File> => Promise.reject(new Error('404'));
    expect(await browserShare(nav).share({ ...what, file })).toBe('shared');
    expect(calls[0]?.url).toBe(what.url);
  });
});

describe('the clipboard falls back rather than failing', () => {
  type ClipWin = NonNullable<Parameters<typeof browserClipboard>[0]>;
  const win = (over: Partial<ClipWin>): ClipWin => ({ navigator: {}, document, ...over });

  it('reaches for the old copy outside a secure context', async () => {
    /* Which is what opening the page from a folder gives you. jsdom has no
       execCommand either, so this asserts the shape of the fallback: it is
       tried, and it answers instead of throwing. */
    const c = browserClipboard(win({ isSecureContext: false }));
    await expect(c.writeText('x')).resolves.toBe(false);
  });

  it('copies plain text when rich copy is unavailable', async () => {
    const written: string[] = [];
    const c = browserClipboard(
      win({
        isSecureContext: true,
        navigator: {
          clipboard: {
            writeText: (t: string) => {
              written.push(t);
              return Promise.resolve();
            }
          }
        }
      })
    );
    /* No ClipboardItem, so the HTML half is dropped and the text still lands */
    await expect(c.writeRich({ html: '<b>N</b>', plain: 'N' })).resolves.toBe(true);
    expect(written).toEqual(['N']);
  });

  it('refuses an image rather than pretending, when it cannot write one', async () => {
    const c = browserClipboard(win({ isSecureContext: true }));
    const png = (): Promise<Blob> => Promise.resolve(new Blob());
    await expect(c.writeImage(png)).resolves.toBe(false);
  });
});

describe('the clipboard fake', () => {
  it('records what a caller put on it', async () => {
    const c = fakeClipboard();
    await c.writeRich({ html: '<b>N</b>', plain: 'N' });
    expect(c.last.rich?.html).toBe('<b>N</b>');
    expect(c.last.text).toBe('N');
  });

  it("can be told to fail, so the caller's fallback is reachable", async () => {
    expect(await fakeClipboard({ fail: true }).writeText('x')).toBe(false);
  });
});

describe('dragging', () => {
  const rows = (n: number): HTMLElement => {
    const box = document.createElement('div');
    for (let i = 0; i < n; i++) {
      const row = document.createElement('div');
      row.dataset['index'] = String(i);
      box.appendChild(row);
    }
    document.body.appendChild(box);
    return box;
  };

  const drag = (box: HTMLElement, from: number, to: number): void => {
    const data = new Map<string, string>();
    const dt = {
      effectAllowed: '',
      setData: (k: string, v: string) => data.set(k, v),
      getData: (k: string) => data.get(k) ?? ''
    };
    const fire = (type: string, at: number): void => {
      const e = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(e, 'dataTransfer', { value: dt });
      box.children[at]?.dispatchEvent(e);
    };
    fire('dragstart', from);
    fire('dragover', to);
    fire('drop', to);
  };

  it('reports where an entry was dropped', () => {
    const box = rows(5);
    const onDrop = vi.fn();
    nativeDrag().bind(box, { onDrop });
    drag(box, 4, 1);
    expect(onDrop).toHaveBeenCalledWith(4, 1);
  });

  it('says nothing when an entry is dropped where it started', () => {
    const box = rows(3);
    const onDrop = vi.fn();
    nativeDrag().bind(box, { onDrop });
    drag(box, 1, 1);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('stops listening once unbound', () => {
    const box = rows(3);
    const onDrop = vi.fn();
    nativeDrag().bind(box, { onDrop })();
    drag(box, 0, 2);
    expect(onDrop).not.toHaveBeenCalled();
  });
});

describe('the whole outside world', () => {
  it('can be replaced in one line', () => {
    const env = fakeEnv();
    expect(env.storage.works()).toBe(true);
    expect(env.share.available()).toBe(true);
    expect(env.compress.available()).toBe(false);
  });

  it('lets one port be swapped without the rest', () => {
    const env = fakeEnv({ storage: brokenStorage() });
    expect(env.storage.works()).toBe(false);
    expect(env.router.hash()).toBe('#/roll/std');
  });
});

describe('the address bar', () => {
  /* `hashRouter` takes its window rather than reaching for the global, which is
     the whole reason it can be checked here. It went untested anyway until the
     per-file coverage bar pointed at it. */
  interface FakeHistory {
    length: number;
    replaceState?: (s: unknown, t: string, u: string) => void;
    back?: () => void;
  }

  /** A window with only the parts hashRouter touches, and either of the two
      optional pieces removable - which is the file:// case. */
  function fakeWin(missing: { replaceState?: true; back?: true } = {}) {
    const calls: string[] = [];
    const listeners = new Map<string, Set<() => void>>();
    const history: FakeHistory = { length: 1 };
    const win = {
      location: {
        hash: '#/roll/std',
        pathname: '/index.html',
        search: '',
        href: 'https://example.test/index.html#/roll/std',
        protocol: 'https:'
      },
      history,
      addEventListener: (t: string, fn: () => void) => {
        const set = listeners.get(t) ?? new Set<() => void>();
        set.add(fn);
        listeners.set(t, set);
      },
      removeEventListener: (t: string, fn: () => void) => {
        listeners.get(t)?.delete(fn);
      }
    };
    if (!missing.replaceState) {
      history.replaceState = (_s, _t, u) => {
        calls.push(u);
        win.location.hash = u.slice(u.indexOf('#'));
      };
    }
    if (!missing.back) {
      history.back = () => {
        calls.push('back');
      };
    }
    const fire = (t: string): void => {
      for (const fn of listeners.get(t) ?? []) fn();
    };
    return { win, history, calls, fire, listeners };
  }

  it('reads and writes the hash', () => {
    const { win } = fakeWin();
    const r = hashRouter(win);
    expect(r.hash()).toBe('#/roll/std');
    r.navigate('#/lists');
    expect(win.location.hash).toBe('#/lists');
  });

  it('replaces in place, keeping the path and the query', () => {
    /* The filter segment is rewritten on every click; pushing each one would
       bury the page the visitor arrived from. */
    const { win, calls } = fakeWin();
    win.location.search = '?x=1';
    hashRouter(win).replace('#/tables/eq_weapon/f_tier-1');
    expect(calls).toEqual(['/index.html?x=1#/tables/eq_weapon/f_tier-1']);
  });

  it('falls back to assigning the hash where replaceState is missing', () => {
    /* That is the file:// case, which is a supported way to open this app. */
    const { win, calls } = fakeWin({ replaceState: true });
    hashRouter(win).replace('#/lists');
    expect(win.location.hash).toBe('#/lists');
    expect(calls).toEqual([]);
  });

  it('reports the new address on a hashchange, and stops when told', () => {
    const { win, fire, listeners } = fakeWin();
    const seen: string[] = [];
    const off = hashRouter(win).onChange((h) => seen.push(h));

    win.location.hash = '#/lists';
    fire('hashchange');
    expect(seen).toEqual(['#/lists']);

    off();
    win.location.hash = '#/search';
    fire('hashchange');
    expect(seen, 'a removed listener must not keep reporting').toEqual(['#/lists']);
    expect(listeners.get('hashchange')?.size).toBe(0);
  });

  it('knows whether there is anywhere to go back to', () => {
    const { win, history } = fakeWin();
    expect(hashRouter(win).canGoBack()).toBe(false);
    history.length = 3;
    expect(hashRouter(win).canGoBack()).toBe(true);
  });

  it('goes back, and does not throw where it cannot', () => {
    const { win, calls } = fakeWin();
    hashRouter(win).back();
    expect(calls).toEqual(['back']);

    const bare = fakeWin({ back: true });
    expect(() => {
      hashRouter(bare.win).back();
    }).not.toThrow();
  });
});

describe('the environment', () => {
  it('assembles a real one with every port present', () => {
    /* Six ports, and a missing one is a crash on a page rather than here. */
    const env = browserEnv();
    for (const k of ['storage', 'clipboard', 'share', 'router', 'compress', 'drag'] as const) {
      expect(env[k], k).toBeDefined();
    }
    expect(env.storage.set('dhloot.probe', '1')).toBe(true);
    env.storage.remove('dhloot.probe');
  });

  it('rolls the same way every time unless a test says otherwise', () => {
    /* A roll that is a surprise in a test is a test that cannot assert what
       came up, so the default lands on the first row. */
    const env = fakeEnv();
    expect(env.random()).toBe(0);
  });

  it('lets a fake replace one port and keep the rest', () => {
    const env = fakeEnv({ storage: brokenStorage() });
    expect(env.storage.set('k', 'v')).toBe(false);
    expect(env.router.hash()).toBe('#/roll/std');
  });
});

describe('the dataset', () => {
  const loot = { items: { core_item: [] } };

  it('takes what data.js assigned', () => {
    expect(browserData(() => loot).load()).toBe(loot);
  });

  it('reports nothing rather than a broken catalogue', () => {
    /* A deploy that serves data.js as HTML, or a folder missing the file: the
       app has to be able to say so, and a half-parsed object would instead show
       an empty catalogue as though that were the truth. */
    const junk: unknown[] = [
      undefined,
      null,
      '',
      0,
      [],
      {},
      { items: null },
      '<!doctype html>'
    ];
    for (const [i, v] of junk.entries()) {
      expect(browserData(() => v).load(), `case ${String(i)}`).toBe(null);
    }
  });

  it('refuses a container whose tables are not tables', () => {
    expect(browserData(() => ({ items: { core_item: 'nope' } })).load()).toBe(null);
  });

  it('hands a test its own catalogue', () => {
    expect(fakeData(loot).load()).toBe(loot);
  });

  it('tells an empty catalogue apart from one that did not load', () => {
    /* An empty book is a book. A missing data.js is a page that has to say so. */
    expect(fakeData({ items: {} }).load()).toEqual({ items: {} });
    expect(noData().load()).toBe(null);
  });

  it('defaults to reading the real global, and finds nothing in a bare page', () => {
    /* jsdom has no data.js, so this is the missing case rather than a stub. */
    expect(browserData().load()).toBe(null);
  });
});

describe('where the page is', () => {
  const win = (href: string, protocol: string) => ({
    location: { hash: '', pathname: '/', search: '', href, protocol },
    history: { length: 1 },
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  });

  it('drops the hash and the file name from the base', () => {
    /* A server serves the directory, so naming index.html is noise - and the
       hash of the page somebody happened to be on has no business in a link. */
    const r = hashRouter(win('https://e.test/loot/index.html#/i/w1', 'https:'));
    expect(r.base()).toBe('https://e.test/loot/');
  });

  it('keeps a file name that is not index.html', () => {
    const r = hashRouter(win('https://e.test/loot/other.html#/x', 'https:'));
    expect(r.base()).toBe('https://e.test/loot/other.html');
  });

  it('knows a server from a folder', () => {
    expect(hashRouter(win('https://e.test/', 'https:')).hosted()).toBe(true);
    expect(hashRouter(win('http://e.test/', 'http:')).hosted()).toBe(true);
    expect(hashRouter(win('file:///tmp/index.html', 'file:')).hosted()).toBe(false);
  });
});
