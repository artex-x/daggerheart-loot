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
    tab: () => cloud.events.tab
  };
  const real = cloud.requests.apply.bind(cloud.requests);
  const apply = vi.spyOn(cloud.requests, 'apply').mockImplementation((id, clamp) => {
    order.push('apply');
    return real(id, clamp);
  });
  const list = vi.spyOn(cloud.requests, 'list');
  const o = new OwnerRequests(cloud.requests, hooks);
  /* The owner topic's messages reach the store as the owner feed passes them on. */
  cloud.events.subscribe('owner:' + SEED.users.gm1.id, {
    message: (event, payload) => {
      o.message(event, payload);
    },
    status: () => undefined
  });
  return { cloud, o, hooks, said, order, apply, list, real };
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
    await o.read();
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
    await o.read();
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
    await o.read();
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
    await o.read();
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
    await o.read();
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
    await o.read();
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
    await o.read();
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
    await o.read();
    await o.apply(id, false);
    cloud.decide(id, 'declined');
    await later(COALESCE_MS);
    expect(o.short).toEqual({});
  });

  it('declines, newest decision first in the fold', async () => {
    const { cloud, o, said } = owner();
    const a = cloud.request('player-token-1', TWO) ?? '';
    const b = cloud.request('gm-token-1', TWO) ?? '';
    await o.read();
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
    await o.read();
    await o.decline(a);
    await o.decline(b);
    o.forget(SHOP);
    expect(o.decidedFor(SHOP)).toEqual([]);
    expect(o.decidedFor(TROPHIES).map((d) => d.id)).toEqual([b]);
  });

  it('reads quietly when a decision this tab sent with no answer comes back decided', async () => {
    const { cloud, o, apply, real, said, hooks } = owner();
    const id = cloud.request('player-token-1', TWO) ?? '';
    await o.read();
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
    await o.read();
    cloud.decide(id, 'applied');
    await o.decline(id);
    expect(said).toEqual([['Этот запрос уже решён на другом устройстве.', true]]);
    expect(o.forList(SHOP, Date.now())).toEqual([]);
  });

  it('reads quietly, with no toast, when apply or decline finds the request gone', async () => {
    const { cloud, o, said, hooks } = owner();
    const a = cloud.request('player-token-1', TWO) ?? '';
    const b = cloud.request('gm-token-1', TWO) ?? '';
    await o.read();
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
    await o.read();
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
    await o.read();
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
    await o.read();
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
