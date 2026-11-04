/* The action row, then «Сохранить себе» in its «Ещё» menu over the fake cloud, the details of the owner's answers:
 * (a) signed out the prompt, the copy after the sign-in, and a modal's return to the item's
 * page; (b) each press makes one more copy, numbered by name, and the button never turns
 * into «Сохранено»; (c) the second line when a list links the item, and the relinked toast;
 * (d) «Изменить» on the toast; (e) `hbNotReady` while the own items or the lists load,
 * `cloudLoadFailed` after a failed lists read, `hbLoadFailed` after a failed own-items read
 * that a sign-in left a copy for; (f) the relink keeps each entry (state/app.test.ts reads
 * the rows); (g) each refusal's text, and the account's read deciding a lost answer; (h) the
 * same control on a catalog record. Then «Печать» in each state of its target.
 * docs/specs/FEATURES.md, "Records" and "Print". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import PickRow from './PickRow.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { HOMEBREW_KEY, recordOf } from '../lib/homebrew.js';
import type { HomebrewImportRows } from '../lib/homebrewFile.js';
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
const AXE_KEY = 'hb_emberaxeaaaaaaaa';
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

/* Opens «Ещё» of the dialog while one is open, else of the page. */
const openMore = async (more = t.moreMenu): Promise<void> => {
  const scope = screen.queryByRole('dialog') ?? document.body;
  await userEvent.click(await within(scope).findByRole('button', { name: more }));
};

/* The save item: a press closes the menu, so the next read opens it again. */
const saveButton = async (): Promise<HTMLElement> => {
  if (!screen.queryByRole('menu')) await openMore();
  return screen.findByRole('menuitem', { name: t.saveItem });
};

const ownKeys = async (cloud: FakeCloud): Promise<string[]> => {
  const r = await cloud.homebrew.load();
  return r.ok ? r.items.map((i) => i.key) : [];
};

/* The key «Изменить» on the last toast opens. */
const toastKey = (text: string): string => {
  const toast = screen.getByText(text).closest('.toast') as HTMLElement;
  const href = within(toast).getByRole('link', { name: t.edit }).getAttribute('href') ?? '';
  return href.replace('/homebrew/', '');
};

describe('the action row', () => {
  const started = async (cloud: FakeCloud): Promise<AppState> => {
    const app = new AppState(
      fakeEnv({
        cloud,
        router: memoryRouter('#/i/q23'),
        storage: memoryStorage(),
        data: fakeData(LOOT)
      })
    );
    app.start();
    await waitFor(() => {
      expect(app.user).not.toBeUndefined();
    });
    return app;
  };
  const rope = (app: AppState) =>
    app.recordFor('q23') as NonNullable<ReturnType<AppState['recordFor']>>;
  const names = (): string[] =>
    screen.getAllByRole('button').map((b) => b.textContent.replace(/\s+/g, ' ').trim());

  it('draws «В список», «Поделиться», «Печать», «Ещё» in this order, with one primary', async () => {
    const app = await started(fakeCloud(SEED));
    const { container } = render(PickRow, { app, index: app.index!, it: rope(app) });
    expect(names()).toEqual([t.toList, t.share, t.print, t.moreMenu]);
    expect(container.querySelectorAll('.btn.primary')).toHaveLength(1);
    const more = screen.getByRole('button', { name: t.moreMenu });
    expect(more).toHaveAttribute('aria-haspopup', 'menu');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    app.stop();
  });

  describe('«Ещё» under a prompt up to 760 px', () => {
    const box = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;
    /* jsdom lays nothing out: the row is the menu's anchor, and it ends under the button. */
    const laidOut = (anchor: (menu: HTMLElement) => Element | null): void => {
      vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (
        this: HTMLElement
      ) {
        return anchor(this);
      });
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: Element
      ) {
        if (this.getAttribute('aria-haspopup')) return box(100, 146);
        return this.classList.contains('modal-card') ? box(0, 400) : box(50, 400);
      });
    };
    const more = (): Promise<void> =>
      userEvent.click(screen.getByRole('button', { name: t.moreMenu }));

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('opens the menu from the button, not from the bottom of the row', async () => {
      const app = await started(fakeCloud(SEED));
      const { container } = render(PickRow, { app, index: app.index!, it: rope(app) });
      laidOut(() => container);
      await more();
      expect(screen.getByRole('menu').style.top).toBe('104px');
      app.stop();
    });

    it('leaves a menu anchored to its own wrap to the stylesheet', async () => {
      const app = await started(fakeCloud(SEED));
      render(PickRow, { app, index: app.index!, it: rope(app) });
      laidOut((menu) => menu.parentElement);
      await more();
      expect(screen.getByRole('menu').style.top).toBe('');
      app.stop();
    });

    it('leaves a menu opened up to the stylesheet', async () => {
      const app = await started(fakeCloud(SEED));
      const card = document.body.appendChild(document.createElement('div'));
      card.className = 'modal-card';
      const row = card.appendChild(document.createElement('div'));
      render(PickRow, {
        target: row,
        props: { app, index: app.index!, it: rope(app), inModal: true }
      });
      laidOut(() => row);
      await more();
      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('up');
      expect(menu.style.top).toBe('');
      app.stop();
      card.remove();
    });
  });

  it('draws «Изменить» before «Ещё» for the author', async () => {
    const { container } = page('#/i/' + AXE_KEY, fakeCloud(SEED, 'gm1'));
    const edit = await screen.findByRole('link', { name: t.edit });
    const row = container.querySelector('.cardpick') as HTMLElement;
    const controls = [...row.querySelectorAll('.btn')];
    expect(controls.at(-2)).toBe(edit);
    expect(controls.at(-1)).toHaveAccessibleName(t.moreMenu);
  });

  it('opens a menu of the copies, then the save item, with no image item for a record with no art', async () => {
    const app = await started(fakeCloud(SEED));
    const { container } = render(PickRow, { app, index: app.index!, it: rope(app) });
    await openMore();
    const menu = screen.getByRole('menu', { name: t.moreMenu });
    const items = within(menu).getAllByRole('menuitem');
    expect(items.slice(0, 3).map((i) => i.textContent.trim())).toEqual([
      t.copyText,
      t.copyName,
      t.copyLink
    ]);
    expect(items).toHaveLength(4);
    expect(items[3]).toHaveAccessibleName(t.saveItem);
    expect(screen.getByRole('button', { name: t.moreMenu })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(document.activeElement).toHaveAccessibleName(t.copyText);
    await expectNoA11yViolations(container);
    app.stop();
  });

  it('adds the image item for a record with art', async () => {
    const app = await started(fakeCloud(SEED));
    render(PickRow, { app, index: app.index!, it: { ...rope(app), img: 'q23.webp' } });
    await openMore();
    expect(screen.getByRole('menuitem', { name: t.copyImg })).toBeInTheDocument();
    app.stop();
  });

  it('says «Сначала вход в аккаунт» signed out, tied to the item, and opens the prompt only at the press', async () => {
    const app = await started(fakeCloud(SEED));
    render(PickRow, { app, index: app.index!, it: rope(app) });
    const save = await saveButton();
    expect(save).toHaveAccessibleName(t.saveItem);
    expect(save).toHaveAccessibleDescription(t.saveItemSignIn);
    expect(screen.queryByText(t.signInToSaveItem)).toBeNull();
    await userEvent.click(save);
    expect(screen.getByText(t.signInToSaveItem)).toBeInTheDocument();
    app.stop();
  });

  it('closes on a pressed item and returns the focus to «Ещё»', async () => {
    const app = await started(fakeCloud(SEED));
    render(PickRow, { app, index: app.index!, it: rope(app) });
    await openMore();
    await userEvent.click(screen.getByRole('menuitem', { name: t.copyName }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toHaveAccessibleName(t.moreMenu);
    app.stop();
  });

  it('closes on Escape and returns the focus to «Ещё»', async () => {
    const app = await started(fakeCloud(SEED));
    render(PickRow, { app, index: app.index!, it: rope(app) });
    await openMore();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toHaveAccessibleName(t.moreMenu);
    app.stop();
  });

  it("carries a list entry's note into the text a menu item copies", async () => {
    const app = await started(fakeCloud(SEED));
    const write = vi.spyOn(app.env.clipboard, 'writeRich');
    render(PickRow, {
      app,
      index: app.index!,
      it: rope(app),
      extra: [{ head: 'Заметка', body: 'для мастера' }]
    });
    await openMore();
    await userEvent.click(screen.getByRole('menuitem', { name: t.copyText }));
    expect(write.mock.calls[0]?.[0].plain).toContain('для мастера');
    app.stop();
  });
});

describe('«Сохранить себе»', () => {
  it('(a) asks a signed-out reader to sign in, then makes the copy after the sign-in', async () => {
    const world = fakeCloud({ ...SEED, defaultUser: 'gm2' });
    const { container, router } = page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    expect(screen.getByText(t.signInToSaveItem)).toBeInTheDocument();
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
    expect(await ownKeys(world)).toHaveLength(1);
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
      ...recordOf(AXE_KEY, { kind: 'item', ru: 'Топор' }, null),
      hid: AXE_ID
    };
    render(PickRow, { app, index: app.index!, it, inModal: true });
    await userEvent.click(await saveButton());
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(app.signInFor).toEqual({
      hash: '#/h/' + AXE_ID,
      action: { do: 'saveItem', hid: AXE_ID }
    });
    app.stop();
  });

  it('(e) says a failed read of the own items after a sign-in that left a copy to make, and writes nothing', async () => {
    const world = fakeCloud({ ...SEED, defaultUser: 'gm2' });
    world.homebrew.load = () => Promise.resolve({ ok: false });
    const imported = vi.spyOn(world.homebrew, 'import');
    const { router } = page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/h/' + ROLL_B);
    });
    expect(await screen.findByText(t.hbLoadFailed)).toBeInTheDocument();
    expect(imported).not.toHaveBeenCalled();
  });

  it('ties the relink line to the item as its second line, and draws no line once nothing links it', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/h/' + AXE_ID, world);
    const save = await saveButton();
    const note = await screen.findByText(t.saveItemNoteList);
    expect(note.id).toBe('savenote-p-' + AXE_ID);
    /* The label alone names it, so a press by name finds it. */
    expect(save).toHaveAccessibleName(t.saveItem);
    expect(save).toHaveAttribute('aria-describedby', note.id);
    expect(save).toHaveAccessibleDescription(t.saveItemNoteList);
    await expectNoA11yViolations(container);
    await userEvent.click(save);
    await screen.findByText(t.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'));
    const again = await saveButton();
    await waitFor(() => {
      expect(again).toBeEnabled();
    });
    expect(again).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('Сохранено')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('(b) makes a second copy named «X (2)» at a second press', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const imported = vi.spyOn(world.homebrew, 'import');
    const { container } = page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    await screen.findByText(t.saveItemSaved.replace('%s', 'Скатка следопыта'));
    await userEvent.click(await saveButton());
    const second = t.saveItemSaved.replace('%s', 'Скатка следопыта (2)');
    expect(await screen.findByText(second)).toBeInTheDocument();
    expect(imported).toHaveBeenCalledTimes(2);
    const keys = await ownKeys(world);
    expect(keys).toHaveLength(2);
    expect(toastKey(second)).toBe(keys[1]);
    expect(await saveButton()).toBeEnabled();
    await expectNoA11yViolations(container);
  });

  it('(b) offers the press after a reload, and the press makes a new copy', async () => {
    const world = fakeCloud(SEED, 'gm2');
    page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    await screen.findByText(t.saveItemSaved.replace('%s', 'Скатка следопыта'));
    cleanup();
    const imported = vi.spyOn(world.homebrew, 'import');
    page('#/h/' + ROLL_B, world);
    const save = await saveButton();
    await waitFor(() => {
      expect(save).toBeEnabled();
    });
    await userEvent.click(save);
    expect(
      await screen.findByText(t.saveItemSaved.replace('%s', 'Скатка следопыта (2)'))
    ).toBeInTheDocument();
    expect(imported).toHaveBeenCalledOnce();
    expect(await ownKeys(world)).toHaveLength(2);
  });

  it("(b) makes a copy under a new key for a reader who holds the author's key", async () => {
    const world = fakeCloud(SEED, 'gm2');
    const made = await world.homebrew.createItem({
      id: uuid(9200),
      key: ROLL_KEY,
      book_id: null,
      content: { kind: 'item', ru: 'Моя скатка' }
    });
    expect(made.ok).toBe(true);
    const { container } = page('#/h/' + ROLL_B, world);
    await userEvent.click(await saveButton());
    const text = t.saveItemSaved.replace('%s', 'Скатка следопыта');
    await screen.findByText(text);
    const key = toastKey(text);
    expect(key).toMatch(HOMEBREW_KEY);
    expect(key).not.toBe(ROLL_KEY);
    expect(await ownKeys(world)).toEqual([ROLL_KEY, key]);
    await expectNoA11yViolations(container);
  });

  it('(b, c) relinks every linking row at the first press and none at the second', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/h/' + AXE_ID, world);
    await saveButton();
    expect(await screen.findByText(t.saveItemNoteList)).toBeInTheDocument();
    await userEvent.click(await saveButton());
    await screen.findByText(t.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'));
    const applied = vi.spyOn(world.lists, 'apply');
    await userEvent.click(await saveButton());
    expect(
      await screen.findByText(t.saveItemSaved.replace('%s', 'Топор Тлеющих Углей (2)'))
    ).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 50));
    expect(applied.mock.calls.flat(2).some((op) => op.op === 'relink')).toBe(false);
    expect(await ownKeys(world)).toHaveLength(2);
    await expectNoA11yViolations(container);
  });

  it('(c, d) says the list rows follow the copy, and the toast says they did, with «Изменить»', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/h/' + AXE_ID, world);
    await saveButton();
    expect(await screen.findByText(t.saveItemNoteList)).toBeInTheDocument();
    await userEvent.click(await saveButton());
    const text = t.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей');
    await screen.findByText(text);
    expect(toastKey(text)).toBe((await ownKeys(world))[0]);
    await expectNoA11yViolations(container);
  });

  it('(c) draws the relink line in the modal of a list row that links the item', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const { container } = page('#/lists/' + GM2_LIST, world);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const dialog = await screen.findByRole('dialog');
    await saveButton();
    expect(await within(dialog).findByText(t.saveItemNoteList)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: t.print })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('(c) saves from the modal of a list row, which closes, and the row draws the copy', async () => {
    const world = fakeCloud(SEED, 'gm2');
    page('#/lists/' + GM2_LIST, world);
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    await screen.findByRole('dialog');
    await userEvent.click(await saveButton());
    expect(
      await screen.findByText(t.saveItemRelinked.replace('%s', 'Топор Тлеющих Углей'))
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await userEvent.click(await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ }));
    const copy = await screen.findByRole('dialog');
    await openMore();
    expect(within(copy).queryByRole('menuitem', { name: t.saveItem })).toBeNull();
    expect(copy.querySelector('article')).toHaveAttribute('data-id', (await ownKeys(world))[0]);
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

describe('«Сохранить себе» on a catalog record', () => {
  const env = (cloud: FakeCloud | null, hash = '#/i/q23') =>
    fakeEnv({
      cloud,
      router: memoryRouter(hash),
      storage: memoryStorage(),
      data: fakeData(LOOT)
    });
  const rope = (app: AppState) => {
    const it = app.recordFor('q23');
    if (!it) throw new Error('no record');
    return it;
  };
  /* Opens «Ещё» and reads the save item. */
  const group = async (): Promise<Element | null> => {
    await userEvent.click(screen.getByRole('button', { name: t.moreMenu }));
    return screen.queryByRole('menuitem', { name: t.saveItem });
  };

  it('(h) draws the item on the record page, disabled while it writes, and it stays after each press', async () => {
    const world = fakeCloud(SEED, 'gm2');
    const real = world.homebrew.import.bind(world.homebrew);
    let release: () => void = () => undefined;
    world.homebrew.import = async (rows: HomebrewImportRows) => {
      await new Promise<void>((r) => {
        release = r;
      });
      return real(rows);
    };
    const { container } = page('#/i/q23', world);
    const save = await saveButton();
    expect(save).not.toHaveAttribute('aria-describedby');
    await expectNoA11yViolations(container);
    await userEvent.click(save);
    const busy = await saveButton();
    await waitFor(() => {
      expect(busy).toBeDisabled();
    });
    release();
    await screen.findByText(t.saveItemSaved.replace('%s', 'Верёвка'));
    await waitFor(() => {
      expect(busy).toBeEnabled();
    });
    await userEvent.click(busy);
    const again = await saveButton();
    await waitFor(() => {
      expect(again).toBeDisabled();
    });
    release();
    expect(
      await screen.findByText(t.saveItemSaved.replace('%s', 'Верёвка (2)'))
    ).toBeInTheDocument();
    expect(screen.queryByText('Сохранено')).toBeNull();
    expect(await ownKeys(world)).toHaveLength(2);
    await expectNoA11yViolations(container);
  });

  it('(h) draws no save item with no sign-in configured, while the session is unknown, while the own items load or after they failed', async () => {
    const none = new AppState(env(null));
    none.start();
    render(PickRow, { app: none, index: none.index!, it: rope(none) });
    expect(await group()).toBeNull();
    none.stop();
    cleanup();

    const unknown = fakeCloud(SEED, 'gm2');
    unknown.auth.session = () => new Promise(() => undefined);
    const a = new AppState(env(unknown));
    a.start();
    render(PickRow, { app: a, index: a.index!, it: rope(a) });
    expect(await group()).toBeNull();
    a.stop();
    cleanup();

    for (const load of [
      () => new Promise<never>(() => undefined),
      () => Promise.resolve({ ok: false as const })
    ]) {
      const cloud = fakeCloud(SEED, 'gm2');
      cloud.homebrew.load = load;
      const app = new AppState(env(cloud));
      app.start();
      await waitFor(() => {
        expect(app.user).toBeTruthy();
      });
      render(PickRow, { app, index: app.index!, it: rope(app) });
      await new Promise((r) => setTimeout(r, 20));
      expect(await group()).toBeNull();
      app.stop();
      cleanup();
    }
  });

  it('(h) asks a signed-out reader to sign in with the record id, returns a modal to the record, and makes one copy after the sign-in', async () => {
    const app = new AppState(env(fakeCloud(SEED), '#/tables/core_item'));
    app.start();
    await waitFor(() => {
      expect(app.user).toBeNull();
    });
    const { container } = render(PickRow, {
      app,
      index: app.index!,
      it: rope(app),
      inModal: true
    });
    expect(screen.queryByText(t.signInToSaveItem)).toBeNull();
    await userEvent.click(await saveButton());
    expect(screen.getByText(t.signInToSaveItem)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(app.signInFor).toEqual({ hash: '#/i/q23', action: { do: 'saveItem', id: 'q23' } });
    app.stop();
    cleanup();

    const world = fakeCloud({ ...SEED, defaultUser: 'gm2' });
    const imported = vi.spyOn(world.homebrew, 'import');
    const { router } = page('#/i/q23', world);
    await userEvent.click(await saveButton());
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/i/q23');
    });
    expect(
      await screen.findByText(t.saveItemSaved.replace('%s', 'Верёвка'))
    ).toBeInTheDocument();
    expect(imported).toHaveBeenCalledOnce();
    expect(await ownKeys(world)).toHaveLength(1);
  });

  it('(h) says "Save to My items" and the numbered copy in English', async () => {
    const en = dict('en');
    const world = fakeCloud(SEED, 'gm2');
    const app = new AppState(env(world));
    app.start();
    app.setLang('en');
    await waitFor(() => {
      expect(app.catalogCopyOffered).toBe(true);
    });
    const { container } = render(PickRow, { app, index: app.index!, it: rope(app) });
    await openMore(en.moreMenu);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Save to My items' }));
    await waitFor(() => {
      expect(app.toast?.msg).toBe(en.saveItemSaved.replace('%s', 'Rope'));
    });
    await openMore(en.moreMenu);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Save to My items' }));
    await waitFor(() => {
      expect(app.toast?.msg).toBe(en.saveItemSaved.replace('%s', 'Rope (2)'));
    });
    await expectNoA11yViolations(container);
    app.stop();
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
    render(PickRow, { app: none, index: none.index!, it: record(none) });
    expect(printButton()).toBeNull();
    none.stop();
    cleanup();

    const cloud = fakeCloud(SEED, 'gm2');
    cloud.auth.session = () => new Promise(() => undefined);
    const app = new AppState(env(cloud, '#/i/q23'));
    app.start();
    render(PickRow, { app, index: app.index!, it: record(app) });
    expect(printButton()).toBeDisabled();
    app.stop();
  });

  it('opens the sign-in prompt signed out, and its action makes the set of the card', async () => {
    const app = await started(fakeCloud(SEED));
    const { container } = render(PickRow, { app, index: app.index!, it: record(app) });
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

  it('answers each signed-out press with one prompt: the focus on «Войти», «Отмена» back to the opener', async () => {
    const app = await started(fakeCloud(SEED));
    const { container } = render(PickRow, { app, index: app.index!, it: record(app) });
    const button = printButton() as HTMLElement;
    await userEvent.click(button);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: t.signIn }));
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: t.cancel }));
    expect(screen.queryByText(t.signInToPrint)).toBeNull();
    expect(document.activeElement).toBe(button);

    await userEvent.click(screen.getByRole('button', { name: t.moreMenu }));
    await userEvent.click(await screen.findByRole('menuitem', { name: t.saveItem }));
    expect(screen.getByText(t.signInToSaveItem)).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: t.signIn }));
    await userEvent.click(screen.getByRole('button', { name: t.cancel }));
    expect(screen.queryByText(t.signInToSaveItem)).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: t.moreMenu }));
    app.stop();
  });

  it("returns a modal's sign-in to the record's own address, and a second press closes it", async () => {
    const app = await started(fakeCloud(SEED), '#/tables/core_item');
    render(PickRow, { app, index: app.index!, it: record(app), inModal: true });
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
    const { container } = render(PickRow, { app, index: app.index!, it: record(app) });
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
