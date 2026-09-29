/* The reader's purchase request: each answer's toast, the sent mark a success
 * leaves on its lines, the request id kept for a replay after `network` only,
 * and flow b's question and remembered answer. docs/specs/FEATURES.md, "Account and
 * browser lists". */

import { describe, expect, it, vi } from 'vitest';
import { dict } from '../lib/dict.js';
import type { NotifyGm } from '../lib/prefs.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import type { RequestRepository, RequestSent } from '../ports/index.js';
import { RequestSender } from './requestSender.svelte.js';

const ONE = [{ item: 'ci1', qty: 1 }];
const t = dict('ru');

function sender(answers: RequestSent[] = [], notify: NotifyGm = 'ask') {
  const said: [string, boolean | undefined][] = [];
  let n = 0;
  const send = vi.fn<RequestRepository['send']>(() =>
    Promise.resolve(answers.shift() ?? { ok: true })
  );
  const repo: RequestRepository = {
    list: () => Promise.resolve({ ok: false }),
    send,
    apply: () => Promise.resolve({ ok: false, error: 'network' }),
    decline: () => Promise.resolve({ ok: false, error: 'network' })
  };
  const hooks = {
    newId: () => 'id-' + String(++n),
    say: (msg: string, error?: boolean) => {
      said.push([msg, error]);
    },
    dict: () => t,
    lang: () => 'ru' as const,
    reread: vi.fn(),
    notifyGm: () => notify,
    setNotifyGm: vi.fn((v: NotifyGm) => {
      notify = v;
    })
  };
  const s = new RequestSender(repo, hooks);
  const ids = (): unknown[] => send.mock.calls.map((c) => c[0]);
  return { s, repo: { send }, hooks, said, ids };
}

describe('RequestSender.send', () => {
  it('keeps the selection, says the request was sent and marks the lines sent', async () => {
    const { s, repo, said } = sender();
    const two = [
      { item: 'ci1', qty: 1 },
      { item: 'cc1', qty: 3 }
    ];
    expect(s.isSent('tok', two)).toBe(false);
    await s.send('tok', two);
    expect(repo.send).toHaveBeenCalledWith('id-1', 'tok', two);
    expect(said).toEqual([['Запрос отправлен владельцу списка.', undefined]]);
    expect(s.isSent('tok', [...two].reverse())).toBe(true);
    expect(s.isSent('other', two)).toBe(false);
    expect(
      s.isSent('tok', [
        { item: 'ci1', qty: 1 },
        { item: 'cc1', qty: 2 }
      ])
    ).toBe(false);
    s.dismiss();
    expect(s.isSent('tok', two)).toBe(false);
  });

  it('sends nothing for lines already sent, and asks nothing after an add of them', async () => {
    const { s, repo, said } = sender();
    await s.send('tok', ONE);
    await s.send('tok', ONE);
    s.afterAdd('tok', ONE, 'Добавлено');
    expect(s.asking).toBeNull();
    expect(repo.send).toHaveBeenCalledOnce();
    expect(said).toHaveLength(1);
    s.afterAdd('tok', [{ item: 'ci1', qty: 2 }], 'Добавлено');
    expect(s.asking).not.toBeNull();
  });

  it.each([
    [
      { ok: false, error: 'limit', key: 'request_rate', value: 5 },
      'Слишком много запросов по этой ссылке: подождите минуту.'
    ],
    [
      { ok: false, error: 'limit', key: 'pending_requests_per_list', value: 10 },
      'У владельца уже 10 запросов без ответа. Попробуйте позже.'
    ],
    [
      { ok: false, error: 'limit', key: 'pending_requests_per_list', value: null },
      t.limitOther.replace('%n', '?')
    ],
    [
      { ok: false, error: 'limit', key: 'request_lines', value: 100 },
      t.limitOther.replace('%n', '100')
    ],
    [{ ok: false, error: 'network' }, 'Не получилось отправить. Проверьте соединение.'],
    [{ ok: false, error: 'refused' }, 'Сервер не принял запрос.']
  ] as [RequestSent, string][])(
    'says an error for %j and keeps the selection',
    async (answer, text) => {
      const { s, hooks, said } = sender([answer]);
      await s.send('tok', ONE);
      expect(said).toEqual([[text, true]]);
      expect(s.isSent('tok', ONE)).toBe(false);
      expect(hooks.reread).not.toHaveBeenCalled();
    }
  );

  it('reads the link again for a stale list, with a toast, and for a gone one, without', async () => {
    const { s, hooks, said } = sender([
      { ok: false, error: 'stale' },
      { ok: false, error: 'gone' }
    ]);
    await s.send('tok', ONE);
    await s.send('tok', ONE);
    expect(said).toEqual([['Список изменился. Проверьте выбор и отправьте снова.', true]]);
    expect(hooks.reread).toHaveBeenCalledTimes(2);
  });

  it('sends the same id after network, and a new one after success, a refusal or a changed selection', async () => {
    const { s, ids } = sender([
      { ok: false, error: 'network' },
      { ok: true },
      { ok: false, error: 'network' },
      { ok: false, error: 'refused' }
    ]);
    await s.send('tok', ONE);
    await s.send('tok', ONE);
    await s.send('tok', [{ item: 'ci1', qty: 2 }]);
    await s.send('tok', [{ item: 'ci1', qty: 3 }]);
    await s.send('tok', [{ item: 'ci1', qty: 3 }]);
    expect(ids()).toEqual(['id-1', 'id-1', 'id-2', 'id-3', 'id-4']);
  });

  it('keeps the id for the same lines in another order', async () => {
    const { s, ids } = sender([{ ok: false, error: 'network' }]);
    const two = [
      { item: 'ci1', qty: 1 },
      { item: 'cc1', qty: 3 }
    ];
    await s.send('tok', two);
    await s.send('tok', [...two].reverse());
    expect(ids()).toEqual(['id-1', 'id-1']);
  });

  it('sends nothing for a second press while the first runs, or for no lines', async () => {
    const { s, repo } = sender();
    const first = s.send('tok', ONE);
    expect(s.sending).toBe(true);
    await s.send('tok', ONE);
    await first;
    expect(s.sending).toBe(false);
    await s.send('tok', []);
    expect(repo.send).toHaveBeenCalledOnce();
  });

  it('keeps the selection after a flow b send and joins the add toast', async () => {
    const { s, said } = sender();
    await s.send('tok', ONE, 'Добавлено в «Список второго ГМа»');
    expect(s.isSent('tok', ONE)).toBe(true);
    expect(said).toEqual([
      ['Добавлено в «Список второго ГМа». Владелец получил запрос.', undefined]
    ]);
  });
});

describe('RequestSender flow b', () => {
  it('does nothing on never, sends on always, and asks on ask', async () => {
    const never = sender([], 'never');
    never.s.afterAdd('tok', ONE, 'Добавлено');
    expect(never.repo.send).not.toHaveBeenCalled();
    expect(never.s.asking).toBeNull();

    const always = sender([], 'always');
    always.s.afterAdd('tok', ONE, 'Добавлено');
    await vi.waitFor(() => {
      expect(always.said).toEqual([['Добавлено. Владелец получил запрос.', undefined]]);
    });
    expect(always.s.asking).toBeNull();

    const ask = sender([], 'ask');
    ask.s.afterAdd('tok', ONE, 'Добавлено');
    expect(ask.s.asking).toEqual({ token: 'tok', lines: ONE, after: 'Добавлено' });
    expect(ask.repo.send).not.toHaveBeenCalled();
  });

  it('sends on «Сообщить» and remembers always, or remembers never and sends nothing', async () => {
    const yes = sender();
    yes.s.afterAdd('tok', ONE, 'Добавлено');
    yes.s.answer(true, true);
    expect(yes.s.asking).toBeNull();
    expect(yes.hooks.setNotifyGm).toHaveBeenCalledWith('always');
    await vi.waitFor(() => {
      expect(yes.repo.send).toHaveBeenCalledWith('id-1', 'tok', ONE);
    });

    const no = sender();
    no.s.afterAdd('tok', ONE, 'Добавлено');
    no.s.answer(false, true);
    expect(no.hooks.setNotifyGm).toHaveBeenCalledWith('never');
    no.s.answer(true, false);
    expect(no.repo.send).not.toHaveBeenCalled();
  });

  it('answers once without remembering, and drops the question on dismiss', () => {
    const { s, hooks, repo } = sender();
    s.afterAdd('tok', ONE, 'Добавлено');
    s.answer(false, false);
    expect(hooks.setNotifyGm).not.toHaveBeenCalled();
    s.afterAdd('tok', ONE, 'Добавлено');
    s.dismiss();
    expect(s.asking).toBeNull();
    expect(repo.send).not.toHaveBeenCalled();
  });
});

describe('RequestSender storage', () => {
  it('writes nothing to localStorage or sessionStorage, over the fake too', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cloud = fakeCloud(SEED);
    const s = new RequestSender(cloud.requests, {
      newId: () => cloud.lists.newId(),
      say: () => undefined,
      dict: () => t,
      lang: () => 'ru',
      reread: () => undefined,
      notifyGm: () => 'always',
      setNotifyGm: () => undefined
    });
    await s.send('player-token-1', ONE);
    s.afterAdd('player-token-1', [{ item: 'cc1', qty: 1 }], 'Добавлено');
    await vi.waitFor(async () => {
      const read = await cloud.shares.read('player-token-1');
      expect(read.ok).toBe(true);
    });
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
