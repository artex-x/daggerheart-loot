/* «Сохранить себе» in the pick row over the fake cloud, the seven details of the owner's
 * answer: (a) signed out the prompt, the copy after the sign-in, and a modal's return to the
 * item's page; (b) «Сохранено» blocks a second copy; (c) the note when a list links the item,
 * and the relinked toast; (d) «Изменить» on the toast; (e) `hbNotReady` while the own items
 * or the lists load, `cloudLoadFailed` after a failed lists read; (f) the relink keeps each entry (state/app.test.ts reads the rows); (g) each refusal's
 * text, and the account's read deciding a lost answer. Then «Печать» in each state of its
 * target. docs/specs/FEATURES.md, "Records" and "Print". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import PickRow from './PickRow.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { derivedKey, recordOf } from '../lib/homebrew.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: the add-to-list menu calls it once open. */
Element.prototype.scrollIntoView = vi.fn();

const t = dict('ru');
const ROLL_B = uuid(662);
const ROLL_KEY = 'hb_rangerrollaaaaaa';
const AXE_ID = uuid(511);
const GM2_LIST = uuid(201);
/* The keys gm2's copies take: `derivedKey` of gm2's user id and the author's key. */
const GM2 = uuid(2);
const AXE_KEY = 'hb_emberaxeaaaaaaaa';

const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'q23',
        src: 'core',
        kind: 'item',
        en: 'Rope',
        ende: '',
        ru: 'Верёвка',
        rud: '',
        roll: 1
      }
    ]
  }
};

function page(hash: string, cloud: FakeCloud) {
  const router = memoryRouter(hash);
  const view = render(App, {
    env: fakeEnv({ cloud, router, storage: memoryStorage(), data: fakeData(LOOT) })
  });
  return { ...view, router };
}

const saveButton = async (): Promise<HTMLElement> =>
  screen.findByRole('button', {
    name: new RegExp('^(' + t.saveItem + '|' + t.saveItemDone + ')$')
  });

const ownKeys = async (cloud: FakeCloud): Promise<string[]> => {
  const r = await cloud.homebrew.load();
  return r.ok ? r.items.map((i) => i.key) : [];
};

describe('«Сохранить себе»', () => {
  it('(a) asks a signed-out reader to sign in, then makes the copy after the sign-in', async () => {
    const world = fakeCloud({ ...SEED, defaultUser: 'gm2' });
    const { container, router } = page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    expect(screen.getByText(t.signInToSaveItem)).toBeInTheDocument();
    expect(await saveButton()).toHaveAttribute('aria-expanded', 'true');
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(router.hash()).toBe('#/account');
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/h/' + ROLL_B);
    });
    expect(
      await screen.findByText(t.saveItemSaved.replace('%s', 'Скатка следопыта'))
    ).toBeInTheDocument();
    expect(await ownKeys(world)).toContain(derivedKey(GM2, ROLL_KEY));
  });

  it("(a) returns a modal's sign-in to the item's page", async () => {
    const app = new AppState(
      fakeEnv({
        cloud: fakeCloud(SEED),
        router: memoryRouter('#/s/player-token-1'),
        storage: memoryStorage(),
        data: fakeData(LOOT)
      })
    );
    app.start();
    await waitFor(() => {
      expect(app.user).toBeNull();
    });
    const it = {
      ...recordOf('hb_emberaxeaaaaaaaa', { kind: 'item', ru: 'Топор' }, null),
      hid: AXE_ID
    };
    render(PickRow, { app, it, inModal: true });
    await userEvent.click(screen.getByRole('button', { name: t.saveItem }));
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(app.signInFor).toEqual({
      hash: '#/h/' + AXE_ID,
      action: { do: 'saveItem', hid: AXE_ID }
    });
    app.stop();
  });

  it('ties the note to its button in a group of their own, under the other pick buttons', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/h/' + ROLL_B, world);
    const save = await saveButton();
    const note = screen.getByText(t.saveItemNote);
    const group = save.parentElement;
    expect(group).toHaveClass('savegroup');
    expect(note.parentElement).toBe(group);
    expect([...(group?.children ?? [])]).toEqual([save, note]);
    expect(note.id).toBe('savenote-p-' + ROLL_B);
    expect(save).toHaveAttribute('aria-describedby', note.id);
    expect(save).toHaveAccessibleDescription(t.saveItemNote);
    /* «Добавить в список» and «Печать» stay outside the group. */
    expect(within(group!).queryByRole('button', { name: t.print })).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(save);
    await waitFor(async () => {
      expect(await saveButton()).toHaveTextContent(t.saveItemDone);
    });
    expect(await saveButton()).not.toHaveAttribute('aria-describedby');
    expect(document.getElementById('savenote-p-' + ROLL_B)).toBeNull();
  });

  it('(b) reads «Сохранено» and copies once', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const imported = vi.spyOn(world.homebrew, 'import');
    const { container } = page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    await waitFor(async () => {
      expect(await saveButton()).toHaveTextContent(t.saveItemDone);
    });
    const done = await saveButton();
    expect(done).toBeDisabled();
    expect(screen.queryByText(t.saveItemNote)).toBeNull();
    await userEvent.click(done);
    expect(imported).toHaveBeenCalledOnce();
    await expectNoA11yViolations(container);
  });

  it('(b) reads «Сохранено» after a reload, which finds the copy under its derived key', async () => {
    const world = fakeCloud(SEED, 'gm2');
    page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    await waitFor(async () => {
      expect(await saveButton()).toHaveTextContent(t.saveItemDone);
    });
    cleanup();
    const imported = vi.spyOn(world.homebrew, 'import');
    page('#/h/' + ROLL_B, world);
    await waitFor(async () => {
      expect(await saveButton()).toHaveTextContent(t.saveItemDone);
    });
    expect(await saveButton()).toBeDisabled();
    expect(imported).not.toHaveBeenCalled();
  });

  it('(b) reads «Сохранено» for an item whose own key the account holds, saved before keys were derived', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const made = await world.homebrew.createItem({
      id: uuid(9200),
      key: ROLL_KEY,
      book_id: null,
      content: { kind: 'item', ru: 'Моя скатка' }
    });
    expect(made.ok).toBe(true);
    const { container } = page('#/h/' + ROLL_B, world);
    await waitFor(async () => {
      expect(await saveButton()).toHaveTextContent(t.saveItemDone);
    });
    expect(await saveButton()).toBeDisabled();
    await expectNoA11yViolations(container);
  });

  it('(b) reads «Сохранено» and writes nothing when the list holds the row of the copy too', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const COPY = derivedKey(GM2, AXE_KEY);
    const made = await world.homebrew.createItem({
      id: uuid(9201),
      key: COPY,
      book_id: null,
      content: { kind: 'item', ru: 'Мой топор' }
    });
    expect(made.ok).toBe(true);
    await world.lists.apply([
      {
        op: 'add',
        list_id: GM2_LIST,
        entries: [
          {
            id: uuid(7400),
            item_key: COPY,
            source: 'homebrew',
            hb_item: null,
            position: 99,
            quantity: 1,
            price_coins: null,
            player_note: '',
            gm_note: ''
          }
        ]
      }
    ]);
    const imported = vi.spyOn(world.homebrew, 'import');
    const applied = vi.spyOn(world.lists, 'apply');
    const { container } = page('#/h/' + AXE_ID, world);
    await waitFor(async () => {
      expect(await saveButton()).toHaveTextContent(t.saveItemDone);
    });
    const done = await saveButton();
    expect(done).toBeDisabled();
    expect(screen.queryByText(t.saveItemNoteList)).toBeNull();
    await userEvent.click(done);
    expect(imported).not.toHaveBeenCalled();
    expect(applied).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
  });

  it('(c, d) says the list rows follow the copy, and the toast says they did, with «Изменить»', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/h/' + AXE_ID, world);
    expect(await screen.findByText(t.saveItemNoteList)).toBeInTheDocument();
    await userEvent.click(await saveButton());
    const toast = await screen.findByText(
      t.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей')
    );
    const edit = within(toast.closest('.toast') as HTMLElement).getByRole('link', {
      name: t.edit
    });
    expect(edit).toHaveAttribute('href', '#/homebrew/' + derivedKey(GM2, AXE_KEY));
    await expectNoA11yViolations(container);
  });

  it('(c) draws the list note in the modal of a list row that links the item', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/lists/' + GM2_LIST, world);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: t.saveItem })).toBeInTheDocument();
    expect(within(dialog).getByText(t.saveItemNoteList)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: t.print })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('(c) saves from the modal of a list row, which closes, and the row draws the copy', async () => {
    const world = fakeCloud(SEED, 'gm2');
    page('#/lists/' + GM2_LIST, world);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: t.saveItem }));
    expect(
      await screen.findByText(t.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'))
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const copy = await screen.findByRole('dialog');
    expect(within(copy).queryByRole('button', { name: t.saveItem })).toBeNull();
    expect(copy.querySelector('article')).toHaveAttribute('data-id', derivedKey(GM2, AXE_KEY));
  });

  it('(e) says the own items still load, and writes nothing', async () => {
    const world = fakeCloud(SEED, 'gm2');
    world.homebrew.load = () => new Promise(() => undefined);
    const imported = vi.spyOn(world.homebrew, 'import');
    page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    expect(await screen.findByText(t.hbNotReady)).toBeInTheDocument();
    expect(imported).not.toHaveBeenCalled();
  });

  it('(e) says the lists still load, and writes nothing', async () => {
    const world = fakeCloud(SEED, 'gm2');
    world.lists.list = () => new Promise(() => undefined);
    const imported = vi.spyOn(world.homebrew, 'import');
    page('#/h/' + AXE_ID, world);
    await userEvent.click(await saveButton());
    expect(await screen.findByText(t.hbNotReady)).toBeInTheDocument();
    expect(imported).not.toHaveBeenCalled();
  });

  it('(e) says the lists failed to load, and writes nothing', async () => {
    const world = fakeCloud(SEED, 'gm2');
    world.lists.list = () => Promise.resolve({ ok: false });
    const imported = vi.spyOn(world.homebrew, 'import');
    page('#/h/' + AXE_ID, world);
    await userEvent.click(await saveButton());
    expect(await screen.findByText(t.cloudLoadFailed)).toBeInTheDocument();
    expect(imported).not.toHaveBeenCalled();
  });

  it('(g) says a refusal, a limit and a lost connection each in its own words', async () => {
    const refused = fakeCloud(SEED, 'gm2');
    refused.homebrew.import = () => Promise.resolve({ ok: false, error: 'refused' });
    page('#/h/' + ROLL_B, refused);
    await userEvent.click(await saveButton());
    expect(await screen.findByText(t.saveItemRefused)).toBeInTheDocument();
    cleanup();

    const full = fakeCloud(SEED, 'gm2', { limits: { items: 0 } });
    page('#/h/' + ROLL_B, full);
    await userEvent.click(await saveButton());
    expect(await screen.findByText(t.limitHbItems.replace('%n', '0'))).toBeInTheDocument();
    expect(await ownKeys(full)).toEqual([]);
    cleanup();

    const lost = fakeCloud(SEED, 'gm2');
    lost.homebrew.import = () => Promise.resolve({ ok: false, error: 'network' });
    page('#/h/' + ROLL_B, lost);
    await userEvent.click(await saveButton());
    expect(await screen.findByText(t.saveItemFailed)).toBeInTheDocument();
  });

  it('(g) takes a lost answer whose rows landed as a save', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const real = world.homebrew.import.bind(world.homebrew);
    world.homebrew.import = async (rows) => {
      await real(rows);
      return { ok: false, error: 'network' };
    };
    page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    expect(
      await screen.findByText(t.saveItemSaved.replace('%s', 'Скатка следопыта'))
    ).toBeInTheDocument();
  });

  it('(g) says a failure and relinks nothing when an ok answer skipped the item and the read failed', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const apply = vi.spyOn(world.lists, 'apply');
    page('#/h/' + AXE_ID, world);
    await saveButton();
    await screen.findByText(t.saveItemNoteList);
    world.homebrew.import = () =>
      Promise.resolve({
        ok: true,
        counts: {
          books_created: 0,
          cards_created: 0,
          cards_updated: 0,
          cards_skipped: 0,
          items_created: 0,
          items_updated: 0,
          items_skipped: 1
        }
      });
    world.homebrew.load = () => Promise.resolve({ ok: false });
    await userEvent.click(await saveButton());
    expect(await screen.findByText(t.saveItemFailed)).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 50));
    expect(apply.mock.calls.flat(2).some((op) => (op as { op?: string }).op === 'relink')).toBe(
      false
    );
  });
});

describe('«Печать»', () => {
  const env = (cloud: FakeCloud | null, hash: string) =>
    fakeEnv({
      cloud,
      router: memoryRouter(hash),
      storage: memoryStorage(),
      data: fakeData(LOOT)
    });
  async function started(cloud: FakeCloud | null, hash = '#/i/q23'): Promise<AppState> {
    const app = new AppState(env(cloud, hash));
    app.start();
    if (cloud) {
      await waitFor(() => {
        expect(app.user).not.toBeUndefined();
      });
    }
    return app;
  }
  const record = (app: AppState) => {
    const it = app.recordFor('q23');
    if (!it) throw new Error('no record');
    return it;
  };
  const printButton = (): HTMLElement | null => screen.queryByRole('button', { name: t.print });

  it('is not drawn with no sign-in configured, and is disabled while the session is unknown', async () => {
    const none = await started(null);
    render(PickRow, { app: none, it: record(none) });
    expect(printButton()).toBeNull();
    none.stop();
    cleanup();

    const cloud = fakeCloud(SEED, 'gm2');
    cloud.auth.session = () => new Promise(() => undefined);
    const app = new AppState(env(cloud, '#/i/q23'));
    app.start();
    render(PickRow, { app, it: record(app) });
    expect(printButton()).toBeDisabled();
    app.stop();
  });

  it('opens the sign-in prompt signed out, and its action makes the set of the card', async () => {
    const app = await started(fakeCloud(SEED));
    const { container } = render(PickRow, { app, it: record(app) });
    const button = printButton() as HTMLElement;
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('title', t.printHint);
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(t.signInToPrint)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(app.signInFor).toEqual({
      hash: '#/i/q23',
      action: { do: 'print', entries: [{ k: 'q23' }] }
    });
    app.stop();
  });

  it("returns a modal's sign-in to the record's own address, and a second press closes it", async () => {
    const app = await started(fakeCloud(SEED), '#/tables/core_item');
    render(PickRow, { app, it: record(app), inModal: true });
    const button = printButton() as HTMLElement;
    await userEvent.click(button);
    await userEvent.click(button);
    expect(screen.queryByText(t.signInToPrint)).toBeNull();
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(app.signInFor?.hash).toBe('#/i/q23');
    app.stop();
  });

  it('makes the set signed in and opens it, disabled while it runs', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const app = await started(cloud);
    const { container } = render(PickRow, { app, it: record(app) });
    app.printing = true;
    await waitFor(() => {
      expect(printButton()).toBeDisabled();
    });
    app.printing = false;
    await waitFor(() => {
      expect(printButton()).toBeEnabled();
    });
    expect(printButton()).not.toHaveAttribute('aria-expanded');
    await userEvent.click(printButton() as HTMLElement);
    await waitFor(() => {
      expect(app.hash).toMatch(/^#\/p\/[A-Za-z0-9_-]{12}$/);
    });
    const read = await cloud.prints.read(app.hash.slice(4));
    expect(read).toMatchObject({ ok: true, set: { entries: [{ k: 'q23' }] } });
    await expectNoA11yViolations(container);
    app.stop();
  });
});
