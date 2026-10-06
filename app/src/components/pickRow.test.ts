/* «Сохранить себе» in the pick row over the fake cloud, the seven details of the owner's
 * answer: (a) signed out the prompt, the copy after the sign-in, and a modal's return to the
 * item's page; (b) «Сохранено» blocks a second copy; (c) the note when a list links the item,
 * and the relinked toast; (d) «Изменить» on the toast; (e) `hbNotReady` while the own items
 * or the lists load, `cloudLoadFailed` after a failed lists read; (f) the relink keeps each entry (state/app.test.ts reads the rows); (g) each refusal's
 * text, and the account's read deciding a lost answer. docs/specs/FEATURES.md, "Records". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import PickRow from './PickRow.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { recordOf } from '../lib/homebrew.js';
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
    expect(await ownKeys(world)).toContain(ROLL_KEY);
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
    expect(edit).toHaveAttribute('href', '#/homebrew/hb_emberaxeaaaaaaaa');
    await expectNoA11yViolations(container);
  });

  it('(c) draws the list note in the modal of a list row that links the item', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/lists/' + GM2_LIST, world);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: t.saveItem })).toBeInTheDocument();
    expect(within(dialog).getByText(t.saveItemNoteList)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: t.print })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('(c) saves from the modal of a list row and says the row follows the copy', async () => {
    const world = fakeCloud(SEED, 'gm2');
    page('#/lists/' + GM2_LIST, world);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: t.saveItem }));
    expect(
      await screen.findByText(t.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'))
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: t.saveItemDone })).toBeDisabled();
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
