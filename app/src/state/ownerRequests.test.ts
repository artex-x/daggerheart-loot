/* The owner's purchase requests over the fake cloud: the reads and what starts
 * them, apply (short, clamp, the write buffer first, the lists after), decline,
 * the decided fold, and the quiet re-read for a replayed decision or a request
 * that is gone. docs/specs/FEATURES.md, "Account and browser lists". */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dict, type Msg } from '../lib/dict.js';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { OwnerRequests } from './ownerRequests.svelte.js';

const SHOP = uuid(101);
const TROPHIES = uuid(103);
const t = dict('ru');
const NOW = Date.parse('2026-09-27T12:00:00Z');

const settle = async (): Promise<void> => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
const later = async (ms: number): Promise<void> => {
  await vi.advanceTimersByTimeAsync(ms);
  await settle();
};

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
});

function owner(flushed = true) {
  const cloud = fakeCloud(SEED, 'gm1');
  const said: [string, boolean | undefined][] = [];
  const order: string[] = [];
  const hooks = {
    flush: vi.fn(() => {
      order.push('flush');
      return Promise.resolve(flushed);
    }),
    refreshLists: vi.fn(() => {
      order.push('lists');
      return Promise.resolve();
    }),
    say: (msg: Msg, error?: boolean) => {
      said.push([msg(t, 'ru'), error]);
    },
    tab: () => cloud.events.tab,
    arrived: vi.fn<(ids: string[]) => void>()
  };
  const real = cloud.requests.apply.bind(cloud.requests);
  const apply = vi.spyOn(cloud.requests, 'apply').mockImplementation((id, clamp) => {
    order.push('apply');
    return real(id, clamp);
  });
  const realList = cloud.requests.list.bind(cloud.requests);
  const realLines = cloud.requests.lines.bind(cloud.requests);
  const list = vi.spyOn(cloud.requests, 'list');
  const lines = vi.spyOn(cloud.requests, 'lines');
  const o = new OwnerRequests(cloud.requests, hooks);
  /* The owner topic's messages reach the store as the owner feed passes them on. */
  cloud.events.subscribe('owner:' + SEED.users.gm1.id, {
    message: (event, payload) => {
      o.message(event, payload);
    },
    status: () => undefined
  });
  return { cloud, o, hooks, said, order, apply, list, lines, real, realList, realLines };
}

/* The list page's panel focuses its list, which reads its requests' lines. */
const open = async (o: OwnerRequests, listId = SHOP): Promise<void> => {
  o.focus(listId);
  await settle();
};

/* A promise that answers when `release` is called. */
function held<T>(answer: () => Promise<T>): { promise: Promise<T>; release: () => void } {
  let release: () => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    release = () => {
      void answer().then(resolve);
    };
  });
  return { promise, release };
}

const TWO = [
  { item: 'ci1', qty: 1 },
  { item: 'cc1', qty: 3 }
];

describe('OwnerRequests reads', () => {
  it('reads the pending requests of each list, newest first, and hides an expired one', async () => {
    const { cloud, o } = owner();
    const a = cloud.request('player-token-1', TWO);
    await later(60_000);
    const b = cloud.request('gm-token-1', [{ item: 'q1', qty: 1 }]);
    await open(o);
    expect(o.forList(SHOP, Date.now()).map((r) => r.id)).toEqual([b, a]);
    expect(o.pendingCount(SHOP, Date.now())).toBe(2);
    expect(o.pendingCount(TROPHIES, Date.now())).toBe(0);
    /* Unread, a request lasts 30 days from its send; read, an hour from the read. */
    const DAY = 24 * 3_600_000;
    expect(o.forList(SHOP, NOW + 30 * DAY).map((r) => r.id)).toEqual([b]);
    await o.markRead(SHOP);
    const read = Date.now();
    expect(o.forList(SHOP, read).map((r) => r.readAt)).toEqual([
      new Date(read).toISOString(),
      new Date(read).toISOString()
    ]);
    expect(o.pendingCount(SHOP, read + 3_600_000)).toBe(0);
  });

  it('marks a list read only while it holds an unread request, once at a time, and retries a failure', async () => {
    const { cloud, o, list } = owner();
    const mark = vi.spyOn(cloud.requests, 'markRead');
    await o.markRead(SHOP);
    expect(mark).not.toHaveBeenCalled();
    cloud.request('player-token-1', TWO);
    await open(o);
    list.mockClear();
    mark.mockResolvedValueOnce({ ok: false, error: 'network' });
    await o.markRead(SHOP);
    expect(list).not.toHaveBeenCalled();
    expect(o.requests[0]?.readAt).toBeNull();
    const first = o.markRead(SHOP);
    const second = o.markRead(SHOP);
    await Promise.all([first, second]);
    expect(mark).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenCalledOnce();
    expect(o.requests[0]?.readAt).not.toBeNull();
    await o.markRead(SHOP);
    expect(mark).toHaveBeenCalledTimes(2);
  });

  it('drops a read mark that answers after clear', async () => {
    const { cloud, o, list } = owner();
    cloud.request('player-token-1', TWO);
    await open(o);
    list.mockClear();
    const marking = o.markRead(SHOP);
    o.clear();
    await marking;
    expect(list).not.toHaveBeenCalled();
    expect(o.requests).toEqual([]);
  });

  it("ignores this tab's own message and reads once for a burst of others'", async () => {
    const { cloud, o, list } = owner();
    await settle();
    o.message('request', { list: SHOP, by: cloud.events.tab });
    o.message('list', { list: SHOP, revision: 2, by: null });
    await later(COALESCE_MS);
    expect(list).not.toHaveBeenCalled();
    cloud.request('player-token-1', TWO);
    cloud.request('gm-token-1', TWO);
    o.refetch();
    await later(COALESCE_MS - 1);
    expect(list).not.toHaveBeenCalled();
    await later(1);
    expect(list).toHaveBeenCalledOnce();
    expect(o.pendingCount(SHOP, Date.now())).toBe(2);
  });

  it('counts an arrival from the second read on, and names its list', async () => {
    const { cloud, o } = owner();
    cloud.request('player-token-1', TWO);
    await o.read();
    expect([o.arrived, o.arrivedList]).toEqual([0, null]);
    await o.read();
    expect(o.arrived).toBe(0);
    cloud.request('gm-token-1', TWO);
    await later(COALESCE_MS);
    expect([o.arrived, o.arrivedList]).toEqual([1, SHOP]);
  });

  it('names the list of the newest of several arrivals in one read', async () => {
    const { cloud, o } = owner();
    await o.read();
    const made = await cloud.shares.create(TROPHIES, 'player');
    const token = made.ok ? made.token : '';
    cloud.request(token, [{ item: 'q1', qty: 1 }]);
    vi.setSystemTime(NOW + 1000);
    cloud.request('player-token-1', TWO);
    vi.setSystemTime(NOW + 2000);
    cloud.request(token, [{ item: 'ci1', qty: 1 }]);
    await o.read();
    expect([o.arrived, o.arrivedList]).toEqual([1, TROPHIES]);
  });

  it('removes a request another device decided, without a reload', async () => {
    const { cloud, o } = owner();
    const id = cloud.request('player-token-1', TWO);
    await open(o);
    expect(id && cloud.decide(id, 'declined')).toBe(true);
    await later(COALESCE_MS);
    expect(o.forList(SHOP, Date.now())).toEqual([]);
  });

  it('keeps what it shows after a failed read, and drops a read that started before clear', async () => {
    const { cloud, o } = owner();
    cloud.request('player-token-1', TWO);
    await o.read();
    cloud.setOffline(true);
    await o.read();
    expect(o.pendingCount(SHOP, Date.now())).toBe(1);
    cloud.setOffline(false);
    const reading = o.read();
    o.clear();
    await reading;
    expect(o.requests).toEqual([]);
  });
});

describe('OwnerRequests apply and decline', () => {
  it('sends the write buffer first, applies, re-reads the lists and folds the decision', async () => {
    const { cloud, o, order, said } = owner();
    const id = cloud.request('player-token-1', TWO) ?? '';
    await open(o);
    await o.apply(id, false);
    expect(order).toEqual(['flush', 'apply', 'lists']);
    expect(said).toEqual([['Запрос принят', undefined]]);
    expect(o.forList(SHOP, Date.now())).toEqual([]);
    expect(o.decidedFor(SHOP)).toMatchObject([{ id, verdict: 'applied', taken: 4 }]);
    expect(o.decidedFor(SHOP)[0]?.lines).toEqual(TWO);
    expect(o.decidedFor(TROPHIES)).toEqual([]);
    expect(o.busy).toBeNull();
  });

  it('sends nothing when the write buffer cannot be sent', async () => {
    const { cloud, o, apply, said } = owner(false);
    const id = cloud.request('player-token-1', TWO) ?? '';
    await open(o);
    await o.apply(id, false);
    expect(apply).not.toHaveBeenCalled();
    expect(said).toEqual([
      ['Не получилось ответить на запрос. Проверьте соединение и попробуйте ещё раз.', true]
    ]);
    expect(o.pendingCount(SHOP, Date.now())).toBe(1);
  });

  it('shows the short lines, then takes what is there', async () => {
    const { cloud, o, said } = owner();
    const id =
      cloud.request('gm-token-1', [
        { item: 'cc1', qty: 9 },
        { item: 'q1', qty: 1 }
      ]) ?? '';
    await open(o);
    await o.apply(id, false);
    expect(o.short).toEqual({ [id]: [{ item: 'cc1', want: 9, have: 5 }] });
    expect(said).toEqual([]);
    await o.apply(id, true);
    expect(o.short).toEqual({});
    expect(said).toEqual([['Запрос принят: списано 6 шт.', undefined]]);
    expect(o.decidedFor(SHOP)).toMatchObject([{ id, verdict: 'taken', taken: 6 }]);
  });

  it('drops the short lines of a request that left the pending list', async () => {
    const { cloud, o } = owner();
    const id = cloud.request('gm-token-1', [{ item: 'cc1', qty: 9 }]) ?? '';
    await open(o);
    await o.apply(id, false);
    cloud.decide(id, 'declined');
    await later(COALESCE_MS);
    expect(o.short).toEqual({});
  });

  it('declines, newest decision first in the fold', async () => {
    const { cloud, o, said } = owner();
    const a = cloud.request('player-token-1', TWO) ?? '';
    const b = cloud.request('gm-token-1', TWO) ?? '';
    await open(o);
    await o.decline(a);
    await o.apply(b, false);
    expect(said).toEqual([
      ['Запрос отклонён', undefined],
      ['Запрос принят', undefined]
    ]);
    expect(o.decided.map((d) => [d.id, d.verdict])).toEqual([
      [b, 'applied'],
      [a, 'declined']
    ]);
    expect(o.decided[1]?.lines).toEqual(TWO);
  });

  it("forgets one list's decided requests and keeps the others", async () => {
    const { cloud, o } = owner();
    const made = await cloud.shares.create(TROPHIES, 'player');
    const token = made.ok ? made.token : '';
    const a = cloud.request('player-token-1', TWO) ?? '';
    const b = cloud.request(token, [{ item: 'q1', qty: 1 }]) ?? '';
    await open(o);
    await open(o, TROPHIES);
    await o.decline(a);
    await o.decline(b);
    o.forget(SHOP);
    expect(o.decidedFor(SHOP)).toEqual([]);
    expect(o.decidedFor(TROPHIES).map((d) => d.id)).toEqual([b]);
  });

  it('reads quietly when a decision this tab sent with no answer comes back decided', async () => {
    const { cloud, o, apply, real, said, hooks } = owner();
    const id = cloud.request('player-token-1', TWO) ?? '';
    await open(o);
    apply.mockImplementationOnce(async (x, clamp) => {
      await real(x, clamp);
      return { ok: false, error: 'network' };
    });
    await o.apply(id, false);
    expect(said).toEqual([
      ['Не получилось ответить на запрос. Проверьте соединение и попробуйте ещё раз.', true]
    ]);
    said.length = 0;
    hooks.refreshLists.mockClear();
    await o.apply(id, false);
    expect(said).toEqual([]);
    expect(hooks.refreshLists).toHaveBeenCalledOnce();
    expect(o.forList(SHOP, Date.now())).toEqual([]);
  });

  it('says another device decided a request, and reads again', async () => {
    const { cloud, o, said } = owner();
    const id = cloud.request('player-token-1', TWO) ?? '';
    await open(o);
    cloud.decide(id, 'applied');
    await o.decline(id);
    expect(said).toEqual([['Этот запрос уже решён на другом устройстве.', true]]);
    expect(o.forList(SHOP, Date.now())).toEqual([]);
  });

  it('reads quietly, with no toast, when apply or decline finds the request gone', async () => {
    const { cloud, o, said, hooks } = owner();
    const a = cloud.request('player-token-1', TWO) ?? '';
    const b = cloud.request('gm-token-1', TWO) ?? '';
    await open(o);
    await cloud.lists.apply([{ op: 'remove', id: SHOP }]);
    await o.apply(a, false);
    await o.decline(b);
    expect(said).toEqual([]);
    expect(hooks.refreshLists).toHaveBeenCalledTimes(2);
    expect(o.requests).toEqual([]);
  });

  it('says an expired request, and a refused decision', async () => {
    const { cloud, o, said } = owner();
    const id = cloud.request('player-token-1', TWO) ?? '';
    await open(o);
    const decline = vi
      .spyOn(cloud.requests, 'decline')
      .mockResolvedValueOnce({ ok: false, error: 'refused' });
    await o.decline(id);
    decline.mockRestore();
    await o.markRead(SHOP);
    vi.setSystemTime(NOW + 3_600_000);
    await o.apply(id, false);
    expect(said).toEqual([
      [t.writeRefused, true],
      [
        'Этот запрос истёк: прошёл час после того, как его открыли, или 30 дней без ответа.',
        true
      ]
    ]);
  });

  it('decides one request at a time', async () => {
    const { cloud, o, apply } = owner();
    const id = cloud.request('player-token-1', TWO) ?? '';
    await open(o);
    const first = o.apply(id, false);
    expect(o.busy).toBe(id);
    await o.apply(id, false);
    await o.decline(id);
    await first;
    expect(apply).toHaveBeenCalledOnce();
  });

  it('drops an answer that arrives after clear', async () => {
    const { cloud, o, said } = owner();
    const id = cloud.request('player-token-1', TWO) ?? '';
    await open(o);
    const applying = o.apply(id, false);
    o.clear();
    await applying;
    const declining = o.decline(id);
    o.clear();
    await declining;
    expect(said).toEqual([]);
    expect(o.decided).toEqual([]);
    expect(o.busy).toBeNull();
  });
});

describe("the owner's change log", () => {
  const GM2_LIST = uuid(201);
  const AXE_ID = uuid(511);

  function gm2(seed = SEED) {
    const world = fakeCloud(seed, 'gm1');
    const port = world.as('gm2');
    const said: string[] = [];
    const o = new OwnerRequests(port.requests, {
      flush: () => Promise.resolve(true),
      refreshLists: () => Promise.resolve(),
      say: (msg: Msg) => {
        said.push(msg(t, 'ru'));
      },
      tab: () => 'gm2-tab'
    });
    return { world, port, o, said };
  }

  it('reads the notices with the requests, newest first, and counts the unread ones', async () => {
    const { o } = gm2();
    await o.read();
    expect(o.noticesFor(GM2_LIST).map((n) => [n.itemKey, n.kind])).toEqual([
      ['hb_emberaxeaaaaaaaa', 'changed'],
      ['hb_longroadrollaaaa', 'deleted']
    ]);
    expect(o.unreadNotices(GM2_LIST)).toBe(2);
    expect(o.noticesRead).toBe(false);
  });

  it("applies the notices of a joined read's last pass when its requests fail", async () => {
    const { o, port } = gm2();
    await o.read();
    const stale = await port.requests.notices();
    const list = port.requests.list.bind(port.requests);
    vi.spyOn(port.requests, 'list')
      .mockImplementationOnce(() => list())
      .mockResolvedValueOnce({ ok: false });
    const first = held(() => Promise.resolve(stale));
    vi.spyOn(port.requests, 'notices')
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce({ ok: true, notices: stale.ok ? stale.notices.slice(1) : [] });
    const older = o.read();
    const newer = o.read();
    first.release();
    await Promise.all([older, newer]);
    expect(o.noticesFor(GM2_LIST)).toHaveLength(1);
  });

  it('marks a list with unread notices read, and hides notices by id at once', async () => {
    const { o, port } = gm2();
    o.focus(GM2_LIST);
    await settle();
    expect(o.noticesRead).toBe(true);
    await o.markRead(GM2_LIST);
    expect(o.unreadNotices(GM2_LIST)).toBe(0);
    const hide = o.hideNotices(GM2_LIST, [uuid(681)]);
    expect(o.noticesFor(GM2_LIST).map((n) => n.id)).toEqual([uuid(682)]);
    await hide;
    const left = await port.requests.notices(GM2_LIST);
    expect(left.ok && left.notices.map((n) => n.id)).toEqual([uuid(682)]);
  });

  it('says a failed hide and reads the notice back', async () => {
    const { o, world, said } = gm2();
    await o.read();
    world.setOffline(true);
    const hide = o.hideNotices(GM2_LIST, [uuid(681)]);
    expect(o.noticesFor(GM2_LIST)).toHaveLength(1);
    await hide;
    expect(said).toEqual([t.noticeHideFailed]);
    world.setOffline(false);
    await o.read();
    expect(o.noticesFor(GM2_LIST)).toHaveLength(2);
  });

  it('keeps a notice that arrived after the read when the held ones are hidden', async () => {
    const { o, world, port } = gm2();
    await o.read();
    const held = o.noticesFor(GM2_LIST).map((n) => n.id);
    /* gm1 links the cap in gm2's list, then changes it: a notice the panel never drew. */
    await port.lists.apply([
      {
        op: 'add',
        list_id: GM2_LIST,
        entries: [
          {
            id: uuid(2190),
            item_key: 'hb_whispercapaaaaaa',
            source: 'homebrew',
            hb_item: uuid(513),
            position: 2,
            quantity: 1,
            price_coins: null,
            player_note: '',
            gm_note: ''
          }
        ]
      }
    ]);
    const cap = SEED.homebrew.gm1.items.find((i) => i.id === uuid(513))!;
    await world.homebrew.updateItem(
      uuid(513),
      { content: { ...cap.content, en: 'Whispering Hat' }, book_id: null },
      null
    );
    await o.hideNotices(GM2_LIST, held);
    const left = await port.requests.notices(GM2_LIST);
    expect(left.ok && left.notices.map((n) => n.item_key)).toEqual(['hb_whispercapaaaaaa']);
  });

  it('reads a notice message again and announces it as a change, not a request', async () => {
    const { o, world, port } = gm2();
    port.events.subscribe('owner:' + SEED.users.gm2.id, {
      message: (event, payload) => {
        o.message(event, payload);
      },
      status: () => undefined
    });
    await o.read();
    await settle();
    const axe = SEED.homebrew.gm1.items.find((i) => i.id === AXE_ID)!;
    await world.homebrew.updateItem(
      AXE_ID,
      { content: { ...axe.content, en: 'Ash Axe' }, book_id: uuid(501) },
      null
    );
    await later(COALESCE_MS);
    expect(o.arrived).toBe(1);
    expect([o.arrivedKind, o.arrivedList]).toEqual(['notice', GM2_LIST]);
    expect(o.noticesFor(GM2_LIST)[0]?.name.en).toBe('Ash Axe');
  });

  it("draws the focused list's oldest notice from its own read when every list's read is cut at 1000", async () => {
    const lists = Array.from({ length: 11 }, (_, l) => ({
      id: uuid(9100 + l),
      name: 'L' + String(l),
      entries: [],
      createdAgoMs: 1000,
      editedAgoMs: 1000
    }));
    const notices = lists.flatMap((l, li) =>
      Array.from({ length: li === 10 ? 1 : 100 }, (_, n) => ({
        id: uuid(20000 + li * 100 + n),
        listId: l.id,
        itemKey: 'hb_x' + String(n),
        hid: null,
        kind: 'deleted' as const,
        name: { en: 'X', ru: 'Х' },
        createdAgoMs: li === 10 ? 10_000_000 : li * 1000 + n
      }))
    );
    const { o } = gm2({ ...SEED, lists: { ...SEED.lists, gm2: lists }, notices });
    await o.read();
    expect(o.notices).toHaveLength(1000);
    expect(o.noticesFor(uuid(9110))).toHaveLength(0);
    o.focus(uuid(9110));
    await settle();
    expect(o.noticesRead).toBe(true);
    expect(o.noticesFor(uuid(9110)).map((n) => n.id)).toEqual([uuid(21000)]);
  });
});

describe("the heads read and the focused list's lines", () => {
  it('reads no lines with no list focused, and counts every list from the heads', async () => {
    const { cloud, o, lines } = owner();
    const made = await cloud.shares.create(TROPHIES, 'player');
    cloud.request('player-token-1', TWO);
    cloud.request(made.ok ? made.token : '', [{ item: 'q1', qty: 1 }]);
    await o.read();
    expect(lines).not.toHaveBeenCalled();
    expect(o.heads).toHaveLength(2);
    expect(o.requests).toEqual([]);
    expect(o.pendingCount(SHOP, Date.now())).toBe(1);
    expect(o.pendingCount(TROPHIES, Date.now())).toBe(1);
  });

  it("reads only the focused list's lines", async () => {
    const { cloud, o, lines } = owner();
    const made = await cloud.shares.create(TROPHIES, 'player');
    const a = cloud.request('player-token-1', TWO);
    cloud.request(made.ok ? made.token : '', [{ item: 'q1', qty: 1 }]);
    await open(o);
    expect(lines.mock.calls).toEqual([[[a]]]);
    expect(o.requests.map((r) => r.id)).toEqual([a]);
    expect(o.forList(SHOP, Date.now())[0]?.lines).toHaveLength(2);
  });

  it('reads a new request of the focused list alone by id, and keeps a held object while it is unchanged', async () => {
    const { cloud, o, lines } = owner();
    const a = cloud.request('player-token-1', TWO);
    await open(o);
    const shown = o.requests[0];
    await later(60_000);
    const before = o.arrived;
    const b = cloud.request('player-token-1', [{ item: 'q1', qty: 1 }]);
    await o.read();
    expect(lines).toHaveBeenLastCalledWith([b]);
    expect(o.requests.find((r) => r.id === a)).toBe(shown);
    expect(o.requests.find((r) => r.id === b)?.lines).toEqual([
      { item: 'q1', qty: 1, price: null, applied: null }
    ]);
    expect(o.arrived).toBe(before + 1);
    lines.mockClear();
    await o.read();
    expect(lines).not.toHaveBeenCalled();
    expect(o.arrived).toBe(before + 1);
  });

  it('takes a new read mark and expiry onto a held request', async () => {
    const { cloud, o } = owner();
    cloud.request('player-token-1', TWO);
    await open(o);
    const shown = o.requests[0];
    await o.markRead(SHOP);
    const now = o.requests[0];
    expect(now).not.toBe(shown);
    expect(now?.readAt).not.toBeNull();
    expect(now?.lines).toEqual(shown?.lines);
  });

  it('drops a request decided elsewhere from the heads and the requests', async () => {
    const { cloud, o } = owner();
    const a = cloud.request('player-token-1', TWO);
    await open(o);
    if (!a) throw new Error('the seed refused the request');
    cloud.decide(a, 'declined');
    await o.read();
    expect(o.heads).toEqual([]);
    expect(o.requests).toEqual([]);
  });

  it('keeps a request decided here gone when a read that started before answers after', async () => {
    const { cloud, o, list, realList } = owner();
    const a = cloud.request('player-token-1', TWO);
    await open(o);
    if (!a) throw new Error('the seed refused the request');
    const answer = await realList();
    const late = held(() => Promise.resolve(answer));
    list.mockImplementationOnce(() => late.promise);
    /* The decline's own read fails, so only the decided ids can keep it gone. */
    list.mockResolvedValueOnce({ ok: false });
    const reading = o.read();
    const declining = o.decline(a);
    await settle();
    late.release();
    await Promise.all([reading, declining]);
    expect(o.heads.some((h) => h.id === a)).toBe(false);
    expect(o.requests.some((r) => r.id === a)).toBe(false);
  });

  it('keeps the shown heads and requests when a heads read fails', async () => {
    const { cloud, o, list } = owner();
    cloud.request('player-token-1', TWO);
    await open(o);
    const shown = [o.heads, o.requests];
    list.mockResolvedValueOnce({ ok: false });
    await o.read();
    expect([o.heads, o.requests]).toEqual(shown);
    expect(o.heads).toBe(shown[0]);
    expect(o.requests).toBe(shown[1]);
  });

  it('counts the unexpired requests of every list in one pass', async () => {
    const { cloud, o } = owner();
    cloud.request('player-token-1', TWO);
    await later(60_000);
    cloud.request('gm-token-1', [{ item: 'q1', qty: 1 }]);
    await o.read();
    const counts = o.pendingCounts(Date.now());
    expect(counts.get(SHOP)).toBe(o.pendingCount(SHOP, Date.now()));
    expect(counts.get(SHOP)).toBe(2);
    expect(counts.has(TROPHIES)).toBe(false);
    expect(o.pendingCounts(Date.now() + 31 * 24 * 3_600_000).size).toBe(0);
  });

  it('names no expired head in a lines read and sets no loading for one', async () => {
    const { cloud, o, lines } = owner();
    cloud.request('player-token-1', TWO);
    vi.setSystemTime(NOW + 31 * 24 * 3_600_000);
    await o.read();
    expect(o.heads).toHaveLength(1);
    o.focus(SHOP);
    expect(o.status).toBe('ready');
    await settle();
    expect(lines).not.toHaveBeenCalled();
  });

  it('counts no arrival on the first read after clear', async () => {
    const { cloud, o } = owner();
    await o.read();
    cloud.request('player-token-1', TWO);
    await o.read();
    expect(o.arrived).toBe(1);
    o.clear();
    cloud.request('gm-token-1', TWO);
    await o.read();
    expect(o.arrived).toBe(0);
  });

  it('hands one list id per new request to the arrival hook, from the second read on', async () => {
    const { cloud, o, hooks } = owner();
    cloud.request('player-token-1', TWO);
    await o.read();
    expect(hooks.arrived).not.toHaveBeenCalled();
    const made = await cloud.shares.create(TROPHIES, 'player');
    const token = made.ok ? made.token : '';
    cloud.request(token, [{ item: 'q1', qty: 1 }]);
    cloud.request('gm-token-1', TWO);
    await o.read();
    expect(hooks.arrived).toHaveBeenCalledOnce();
    expect([...(hooks.arrived.mock.calls[0]?.[0] ?? [])].sort()).toEqual(
      [SHOP, TROPHIES].sort()
    );
    await o.read();
    expect(hooks.arrived).toHaveBeenCalledOnce();
    o.clear();
    cloud.request('player-token-1', TWO);
    await o.read();
    expect(hooks.arrived).toHaveBeenCalledOnce();
    cloud.request('player-token-1', TWO);
    await o.read();
    expect(hooks.arrived).toHaveBeenLastCalledWith([SHOP]);
  });

  it('counts the unread requests of every list that have not expired', async () => {
    const { cloud, o } = owner();
    expect(o.unreadCount(Date.now())).toBe(0);
    cloud.request('player-token-1', TWO);
    cloud.request('gm-token-1', TWO);
    const made = await cloud.shares.create(TROPHIES, 'player');
    cloud.request(made.ok ? made.token : '', [{ item: 'q1', qty: 1 }]);
    await open(o);
    expect(o.unreadCount(Date.now())).toBe(3);
    await o.markRead(SHOP);
    expect(o.unreadCount(Date.now())).toBe(1);
    const DAY = 24 * 3_600_000;
    expect(o.unreadCount(NOW + 30 * DAY)).toBe(0);
  });

  it('counts the unread requests at the limits and at three times them', () => {
    const { o } = owner();
    const heads = (lists: number, each: number) =>
      Array.from({ length: lists * each }, (_, i) => ({
        id: uuid(20_000 + i),
        listId: uuid(30_000 + Math.floor(i / each)),
        audience: 'player' as const,
        createdAt: new Date(NOW).toISOString(),
        readAt: null,
        expiresAt: new Date(NOW + 3_600_000).toISOString()
      }));
    o.heads = heads(50, 10);
    expect(o.unreadCount(NOW)).toBe(500);
    o.heads = heads(150, 30);
    expect(o.unreadCount(NOW)).toBe(4500);
  });

  it('marks nothing while a request of the list has no lines', async () => {
    const { cloud, o, lines } = owner();
    const mark = vi.spyOn(cloud.requests, 'markRead');
    const notice = {
      id: uuid(9681),
      list_id: SHOP,
      item_key: 'hb_x',
      hid: null,
      kind: 'deleted' as const,
      name: { en: 'X' },
      created_at: new Date(NOW - 1000).toISOString(),
      read_at: null
    };
    vi.spyOn(cloud.requests, 'notices').mockResolvedValue({ ok: true, notices: [notice] });
    cloud.request('player-token-1', TWO);
    lines.mockResolvedValueOnce({ ok: false });
    await open(o);
    expect(o.unreadNotices(SHOP)).toBe(1);
    expect(o.forList(SHOP, Date.now())).toEqual([]);
    await o.markRead(SHOP);
    expect(mark).not.toHaveBeenCalled();
    await o.read();
    expect(o.forList(SHOP, Date.now())).toHaveLength(1);
    await o.markRead(SHOP);
    expect(mark).toHaveBeenCalledOnce();
  });

  it('marks nothing before the first heads read answers', async () => {
    const { cloud, o, list } = owner();
    const mark = vi.spyOn(cloud.requests, 'markRead');
    const notice = {
      id: uuid(9682),
      list_id: SHOP,
      item_key: 'hb_x',
      hid: null,
      kind: 'deleted' as const,
      name: { en: 'X' },
      created_at: new Date(NOW - 1000).toISOString(),
      read_at: null
    };
    vi.spyOn(cloud.requests, 'notices').mockResolvedValue({ ok: true, notices: [notice] });
    cloud.request('player-token-1', TWO);
    list.mockResolvedValueOnce({ ok: false });
    await open(o);
    expect(o.unreadNotices(SHOP)).toBe(1);
    await o.markRead(SHOP);
    expect(mark).not.toHaveBeenCalled();
    await o.read();
    expect(o.forList(SHOP, Date.now())).toHaveLength(1);
    await o.markRead(SHOP);
    expect(mark).toHaveBeenCalledOnce();
  });
});

describe('OwnerRequests status', () => {
  it('is idle, then loading during the first read, then ready', async () => {
    const { o } = owner();
    expect(o.status).toBe('idle');
    const reading = o.read();
    expect(o.status).toBe('loading');
    await reading;
    expect(o.status).toBe('ready');
  });

  it('is error after a failed first read and ready after the retry, and keeps ready after a later failure', async () => {
    const { o, list } = owner();
    list.mockResolvedValueOnce({ ok: false });
    await o.read();
    expect(o.status).toBe('error');
    await o.read();
    expect(o.status).toBe('ready');
    list.mockResolvedValueOnce({ ok: false });
    await o.read();
    expect(o.status).toBe('ready');
  });

  it('is loading at the focus of a list whose lines are not held, error when that read fails, and ready after the next read', async () => {
    const { cloud, o, lines } = owner();
    cloud.request('player-token-1', TWO);
    await o.read();
    expect(o.status).toBe('ready');
    lines.mockResolvedValueOnce({ ok: false });
    o.focus(SHOP);
    expect(o.status).toBe('loading');
    await settle();
    expect(o.status).toBe('error');
    await o.read();
    expect(o.status).toBe('ready');
    expect(o.forList(SHOP, Date.now())).toHaveLength(1);
  });

  it("keeps loading through a focus change until the new list's lines land, and an earlier list's failed lines read sets no error", async () => {
    const { cloud, o, lines, realLines } = owner();
    const made = await cloud.shares.create(TROPHIES, 'player');
    cloud.request('player-token-1', TWO);
    cloud.request(made.ok ? made.token : '', [{ item: 'q1', qty: 1 }]);
    await o.read();
    const shop = held<Awaited<ReturnType<typeof realLines>>>(() =>
      Promise.resolve({ ok: false })
    );
    let trophies: () => void = () => undefined;
    lines
      .mockImplementationOnce(() => shop.promise)
      .mockImplementationOnce(
        (ids) =>
          new Promise((resolve) => {
            trophies = () => {
              void realLines(ids).then(resolve);
            };
          })
      );
    o.focus(SHOP);
    await settle();
    o.focus(TROPHIES);
    expect(o.status).toBe('loading');
    shop.release();
    await settle();
    expect(o.status).toBe('loading');
    trophies();
    await settle();
    expect(o.status).toBe('ready');
    expect(o.forList(TROPHIES, Date.now())).toHaveLength(1);
  });

  it('is idle after clear during a read, and the stale read leaves a newer read running', async () => {
    const { o, list, realList } = owner();
    const reading = o.read();
    o.clear();
    expect(o.status).toBe('idle');
    const late = held(() => realList());
    list.mockImplementationOnce(() => late.promise);
    const fresh = o.read();
    await reading;
    expect(o.status).toBe('loading');
    expect(o.read()).toBe(fresh);
    late.release();
    await fresh;
    expect(o.status).toBe('ready');
  });
});

describe('OwnerRequests joined reads', () => {
  it('makes a read asked for in any step as the running read ends, never joining one that ended', async () => {
    /* The panel's read mark asks for a read a few steps after the pass that drew the request;
       a call in the gap between the pass's last check and the end of the read was dropped. */
    for (let steps = 0; steps < 40; steps++) {
      const { o, list } = owner();
      await o.read();
      list.mockClear();
      const first = o.read();
      let wait: Promise<void> = Promise.resolve();
      for (let i = 0; i < steps; i++) wait = wait.then(() => undefined);
      const second = wait.then(() => o.read());
      await Promise.all([first, second]);
      await settle();
      expect(list.mock.calls.length, `a read asked for after ${String(steps)} steps`).toBe(2);
    }
  });

  it('makes one more read for any calls while one runs, and resolves them after it', async () => {
    const { o, list } = owner();
    const first = o.read();
    let seen = -1;
    const second = o.read().then(() => {
      seen = list.mock.calls.length;
    });
    const third = o.read();
    await Promise.all([first, second, third]);
    expect(list).toHaveBeenCalledTimes(2);
    expect(seen).toBe(2);
  });
});
