/* «Мои предметы» over the fake cloud: the tab row and «Импорт из файла» on every tab; the
   Items tab with its count, groups, search, ticks, batch delete and bulk move; the Sources
   tab with the sources and sections; the Sets and Rules tabs with their search, folds,
   members and card forms, every refusal and confirm; the empty, signed-out, unconfigured
   and failed states, the downloads, a rename in the language that names it, the ticks kept
   across the tabs and a row opening the editor. docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CardForm from './CardForm.svelte';
import HomebrewPage from './HomebrewPage.svelte';
import { limitText } from '../lib/cloudLists.js';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import {
  fakeDialog,
  fakeEnv,
  fakeImage,
  fakePage,
  fixedClock,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { page, t, tab } from '../test/homebrewPage.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - the selection bar's add-to-list menu places
   itself with it once open. */
Element.prototype.scrollIntoView = vi.fn();

const ALDER = uuid(501);
const SET = 'hb_aldersetaaaaaaaa';
const RULE = 'hb_alderrulecardaaa';

const items = (): Promise<HTMLElement> => tab(t.hbItems);
const sources = (): Promise<HTMLElement> => tab(t.hbSources);
const sets = (): Promise<HTMLElement> => tab(t.hbSets);
const rules = (): Promise<HTMLElement> => tab(t.hbRefs);

async function typeInto(label: string, text: string): Promise<void> {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  if (text) await userEvent.type(box, text);
}

describe('#/homebrew', () => {
  it('draws the import, the tab row, the count and the items under their source and section', async () => {
    const { container } = page();
    expect(await screen.findByText('4 предмета из 100')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: t.myItems })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Предметы, которых нет в книгах: они ищутся вместе с каталогом, попадают в таблицы и добавляются в списки.'
      )
    ).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: t.myItems });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Предметы', '#/homebrew'],
      ['Источники', '#/homebrew/sources'],
      ['Комплекты', '#/homebrew/sets'],
      ['Карты правил', '#/homebrew/rules']
    ]);
    expect(links.map((a) => a.getAttribute('aria-current'))).toEqual([
      'page',
      null,
      null,
      null
    ]);
    /* The import comes first, above the tab row; «Новый предмет» first under it. */
    const order = [...container.querySelectorAll('.stack button, .stack a')].map((e) =>
      e.textContent.trim()
    );
    expect(order.slice(0, 6)).toEqual([
      t.importOpen,
      'Предметы',
      'Источники',
      'Комплекты',
      'Карты правил',
      t.hbNewItem
    ]);
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(heads).toEqual(['Мастерская Ольхи · Холодное оружие 1', 'Хоумбрю 3']);
    expect(container.querySelector('.stack details')).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getByRole('link', { name: /Новый предмет/ })).toHaveAttribute(
      'href',
      '#/homebrew/new'
    );
    expect(screen.getByText('Мастерская Ольхи (HB)')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    const panel = await sources();
    expect(screen.getByRole('link', { name: 'Источники' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(panel).getByText('1 источник из 20')).toBeInTheDocument();
    expect(within(panel).getByText('Мастерская Ольхи')).toBeInTheDocument();
    expect(within(panel).getByText('1 предмет · 2 раздела из 30')).toBeInTheDocument();
    expect(within(panel).getByText('3 предмета')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.importOpen })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('draws the Sources tab: «Новый источник» first, the count, «Хоумбрю» last, the names as filter links', async () => {
    const { container } = page();
    const panel = await sources();
    const order = [...panel.querySelectorAll('button, a, .note')].map((e) =>
      e.textContent.trim()
    );
    expect(order.slice(0, 3)).toEqual([t.hbNewSource, '1 источник из 20', 'Мастерская Ольхи']);
    const names = [...panel.querySelectorAll('.books > li > .head > .name')];
    expect(names.map((a) => [a.textContent.trim(), a.getAttribute('href')])).toEqual([
      ['Мастерская Ольхи', '#/tables/homebrew/f_src-hb_alderworkshopaaa'],
      ['Хоумбрю', '#/tables/homebrew/f_src-hb']
    ]);
    await expectNoA11yViolations(container);
  });

  it('draws the name of an empty source and of an empty «Хоумбрю» as text, not a link', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    await cloud.homebrew.createBook({
      id: uuid(7700),
      key: 'hb_emptybookaaaaaaa',
      content: { ru: 'Пустой источник' }
    });
    const { container } = page('gm2', { cloud });
    const panel = await sources();
    const names = [...panel.querySelectorAll('.books > li > .head > .name')];
    expect(names.map((e) => [e.tagName, e.textContent.trim()])).toEqual([
      ['SPAN', 'Пустой источник'],
      ['SPAN', 'Хоумбрю']
    ]);
    expect(within(panel).queryByRole('link')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('counts twenty sources against the limit', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    for (let i = 0; i < 20; i++) {
      await cloud.homebrew.createBook({
        id: uuid(7600 + i),
        key: 'hb_book' + 'abcdefghijklmnopqrstuvwxyz234567'.charAt(i) + 'aaaaaaaaaaa',
        content: { ru: 'Источник ' + String(i) }
      });
    }
    page('gm2', { cloud });
    const panel = await sources();
    expect(within(panel).getByText('20 источников из 20')).toBeInTheDocument();
    expect(panel.querySelectorAll('.books > li')).toHaveLength(21);
  });

  it('opens a source sections with their counts', async () => {
    const { container } = page();
    const panel = await sources();
    const toggle = within(panel).getByRole('button', { name: t.hbSectionsBtn });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(panel).getByText('Пистоли')).toBeInTheDocument();
    expect(within(panel).getByText('Холодное оружие')).toBeInTheDocument();
    expect(within(panel).getByText(t.hbNoSection)).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('makes a source, and refuses an empty, a taken and the default name', async () => {
    page('gm2');
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSource }));
    const box = screen.getByLabelText(t.hbNewSource);
    await waitFor(() => {
      expect(box).toHaveFocus();
    });
    await userEvent.click(within(panel).getByRole('button', { name: t.create }));
    expect(await screen.findByRole('alert')).toHaveTextContent(t.hbErrSourceName);
    await typeInto(t.hbNewSource, 'хоумбрю');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Источник «хоумбрю» уже есть.')).toBeInTheDocument();
    expect(box).toHaveValue('хоумбрю');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    await typeInto(t.hbNewSource, 'Кузня');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Источник «Кузня» создан')).toBeInTheDocument();
    expect(within(panel).getByText('Кузня')).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSource }));
    await typeInto(t.hbNewSource, 'КУЗНЯ');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Источник «КУЗНЯ» уже есть.')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByLabelText(t.hbNewSource)).not.toBeInTheDocument();
  });

  it('says the limit and the lost network, and keeps the typed name', async () => {
    const { cloud } = page('gm2', { fake: { limits: { books: 0 } } });
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSource }));
    await typeInto(t.hbNewSource, 'Кузня');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Достигнут предел источников: 0.'
    );
    (cloud as ReturnType<typeof fakeCloud>).setOffline(true);
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText(t.hbCreateFailed)).toBeInTheDocument();
    expect(screen.getByLabelText(t.hbNewSource)).toHaveValue('Кузня');
  });

  it('renames a source and refuses a name another source holds', async () => {
    page();
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbRename }));
    const box = screen.getByLabelText(t.hbRename);
    expect(box).toHaveValue('Мастерская Ольхи');
    await typeInto(t.hbRename, 'Homebrew');
    await userEvent.click(within(panel).getByRole('button', { name: t.save }));
    expect(await screen.findByText('Источник «Homebrew» уже есть.')).toBeInTheDocument();
    await typeInto(t.hbRename, '');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText(t.hbErrSourceName)).toBeInTheDocument();
    await typeInto(t.hbRename, 'Мастерская Ивы');
    await userEvent.keyboard('{Enter}');
    expect(await within(panel).findByText('Мастерская Ивы')).toBeInTheDocument();
    await items();
    expect(
      screen.getByRole('heading', { name: 'Мастерская Ивы · Холодное оружие 1' })
    ).toBeInTheDocument();
  });

  it('says a source changed elsewhere, and reads it again', async () => {
    const { cloud } = page();
    const panel = await sources();
    /* The owner feed's join asks for one coalesced read; it lands before the change. */
    await new Promise((r) => setTimeout(r, COALESCE_MS + 50));
    await cloud?.homebrew.updateBook(ALDER, { ru: 'Ольха', en: 'Alder' }, null);
    await userEvent.click(within(panel).getByRole('button', { name: t.hbRename }));
    await typeInto(t.hbRename, 'Ольха 2');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText(t.hbBookChanged)).toBeInTheDocument();
    expect(within(panel).queryByText('Мастерская Ольхи')).not.toBeInTheDocument();
  });

  it('adds, renames and deletes a section with each refusal', async () => {
    const { cloud, dialog } = page();
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbSectionsBtn }));
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSection }));
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText(t.hbErrSectionName)).toBeInTheDocument();
    await typeInto(t.hbNewSection, 'пистоли');
    await userEvent.keyboard('{Enter}');
    expect(
      await screen.findByText('Раздел «пистоли» уже есть в этом источнике.')
    ).toBeInTheDocument();
    await typeInto(t.hbNewSection, 'Луки');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Раздел «Луки» создан')).toBeInTheDocument();
    const read = await cloud?.homebrew.load();
    expect(read?.ok && read.books[0]?.content.sections?.map((s) => s.ru)).toEqual([
      'Пистоли',
      'Холодное оружие',
      'Луки'
    ]);
    const renames = within(panel).getAllByRole('button', { name: t.hbRename });
    await userEvent.click(renames[renames.length - 1] as HTMLElement);
    await typeInto(t.hbRename, 'Холодное оружие');
    await userEvent.keyboard('{Enter}');
    expect(
      await screen.findByText('Раздел «Холодное оружие» уже есть в этом источнике.')
    ).toBeInTheDocument();
    await typeInto(t.hbRename, 'Арбалеты');
    await userEvent.keyboard('{Enter}');
    expect(await within(panel).findByText('Арбалеты')).toBeInTheDocument();
    const dels = within(panel).getAllByRole('button', { name: t.del });
    await userEvent.click(dels[2] as HTMLElement);
    expect(dialog.asked.at(-1)).toBe(
      'Удалить раздел «Холодное оружие»? Его 1 предмет останется в источнике без раздела. Отменить удаление нельзя.'
    );
    await waitFor(() => {
      expect(within(panel).queryByText('Холодное оружие')).not.toBeInTheDocument();
    });
    await userEvent.click(
      within(panel).getAllByRole('button', { name: t.del })[1] as HTMLElement
    );
    expect(dialog.asked.at(-1)).toBe('Удалить раздел «Пистоли»? Отменить удаление нельзя.');
  });

  it('refuses a thirty-first section', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const sections = Array.from({ length: 30 }, (_, i) => ({
      key: 'hb_sect' + 'abcdefghijklmnopqrstuvwxyz234567'.charAt(i) + 'aaaaaaaaaaa',
      ru: 'Раздел ' + String(i)
    }));
    await cloud.homebrew.updateBook(ALDER, { ru: 'Мастерская Ольхи', sections }, null);
    page('gm1', { cloud });
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbSectionsBtn }));
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSection }));
    await typeInto(t.hbNewSection, 'Ещё один');
    await userEvent.keyboard('{Enter}');
    expect(
      await screen.findByText('В источнике уже 30 разделов - это предел.')
    ).toBeInTheDocument();
  });

  it('deletes a source after its confirm, and keeps it on a no', async () => {
    const { dialog } = page('gm1', { answer: false });
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.del }));
    expect(dialog.asked).toEqual([
      'Удалить источник «Мастерская Ольхи»? Его 1 предмет останется в «Хоумбрю». Отменить удаление нельзя.'
    ]);
    expect(within(panel).getByText('Мастерская Ольхи')).toBeInTheDocument();
    cleanup();
    const yes = page('gm1');
    const again = await sources();
    await userEvent.click(within(again).getByRole('button', { name: t.del }));
    await waitFor(() => {
      expect(within(again).queryByText('Мастерская Ольхи')).not.toBeInTheDocument();
    });
    expect(await within(again).findByText('4 предмета')).toBeInTheDocument();
    expect(yes.dialog.asked).toHaveLength(1);
  });

  it('asks the short form for a source with no items', async () => {
    const { dialog } = page('gm2');
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSource }));
    await typeInto(t.hbNewSource, 'Пустой');
    await userEvent.keyboard('{Enter}');
    await userEvent.click(await within(panel).findByRole('button', { name: t.del }));
    expect(dialog.asked).toEqual(['Удалить источник «Пустой»? Отменить удаление нельзя.']);
  });

  it('says a failed delete', async () => {
    const { cloud } = page();
    const panel = await sources();
    (cloud as ReturnType<typeof fakeCloud>).setOffline(true);
    await userEvent.click(within(panel).getByRole('button', { name: t.del }));
    expect(await screen.findByText(t.hbDeleteFailed)).toBeInTheDocument();
  });

  it('counts the sources and cards against their limits at zero, and the sections of a source', async () => {
    page('gm2');
    await screen.findByText(t.hbEmpty);
    expect(within(await sources()).getByText('0 источников из 20')).toBeInTheDocument();
    expect(within(await sets()).getByText('0 комплектов · 0 карт из 100')).toBeInTheDocument();
    expect(
      within(await rules()).getByText('0 карт правил · 0 карт из 100')
    ).toBeInTheDocument();
    cleanup();
    page('gm1');
    const panel = await sources();
    expect(within(panel).getByText('1 предмет · 2 раздела из 30')).toBeInTheDocument();
  });

  it('counts at an override of three times the limits', async () => {
    page('gm1', { fake: { limits: { items: 300, books: 60, cards: 300 } } });
    expect(await screen.findByText('4 предмета из 300')).toBeInTheDocument();
    expect(within(await sources()).getByText('1 источник из 60')).toBeInTheDocument();
    expect(within(await sets()).getByText('1 комплект · 2 карты из 300')).toBeInTheDocument();
    expect(
      within(await rules()).getByText('1 карта правил · 2 карты из 300')
    ).toBeInTheDocument();
  });

  it('toasts a deleted source and a deleted section', async () => {
    page('gm1');
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbSectionsBtn }));
    const dels = within(panel).getAllByRole('button', { name: t.del });
    await userEvent.click(dels[1] as HTMLElement);
    expect(await screen.findByText('Раздел «Пистоли» удалён')).toBeInTheDocument();
    await userEvent.click(
      within(panel).getAllByRole('button', { name: t.del })[0] as HTMLElement
    );
    expect(await screen.findByText('Источник «Мастерская Ольхи» удалён')).toBeInTheDocument();
  });

  it('shows the progress of a bulk delete, holds the button and ignores a second press', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const remove = cloud.homebrew.removeItem.bind(cloud.homebrew);
    const gates: (() => void)[] = [];
    let sent = 0;
    cloud.homebrew.removeItem = async (id) => {
      sent++;
      await new Promise<void>((go) => gates.push(go));
      return remove(id);
    };
    const { dialog, container } = page('gm1', { cloud });
    await screen.findByText('4 предмета из 100');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Кольцо с гравировкой' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Настой кузнеца' }));
    const del = screen.getByRole('button', { name: 'Удалить (2)' });
    await userEvent.click(del);
    expect(await screen.findByText('Удаляем предметы: 0 из 2')).toBeInTheDocument();
    expect(del).toBeDisabled();
    await expectNoA11yViolations(container);
    gates.shift()?.();
    expect(await screen.findByText('Удаляем предметы: 1 из 2')).toBeInTheDocument();
    del.click();
    expect(dialog.asked).toHaveLength(1);
    await vi.waitFor(() => {
      expect(gates).toHaveLength(1);
    });
    gates.shift()?.();
    expect(await screen.findByText('Удалено предметов: 2')).toBeInTheDocument();
    expect(sent).toBe(2);
    expect(screen.queryByText(/^Удаляем предметы/)).toBeNull();
  });

  it('stops a bulk delete at the first failure, keeps the rest and frees the button', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const remove = cloud.homebrew.removeItem.bind(cloud.homebrew);
    let sent = 0;
    cloud.homebrew.removeItem = (id) => {
      sent++;
      if (sent === 2) cloud.setOffline(true);
      return remove(id);
    };
    page('gm1', { cloud });
    await screen.findByText('4 предмета из 100');
    for (const name of ['Кольцо с гравировкой', 'Настой кузнеца', 'Топор Тлеющих Углей']) {
      await userEvent.click(screen.getByRole('checkbox', { name }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (3)' }));
    expect(await screen.findByText(t.hbDeleteFailed)).toBeInTheDocument();
    expect(sent).toBe(2);
    expect(screen.queryByText(/^Удаляем предметы/)).toBeNull();
    expect(screen.getByText('3 предмета из 100')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Топор Тлеющих Углей' })).toBeNull();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Настой кузнеца' }));
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeEnabled();
  });

  it('draws the empty page', async () => {
    const { container } = page('gm2');
    expect(await screen.findByText(t.hbEmpty)).toBeInTheDocument();
    expect(screen.getByText('0 предметов из 100')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: t.pickAll })).toBeNull();
    expect(within(await sets()).getByText(t.hbNoSets)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    expect(within(await rules()).getByText(t.hbNoRefs)).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('asks a signed-out reader to sign in, and draws not found with no sign-in configured', async () => {
    const { container, router } = page(null);
    expect(await screen.findByText(t.hbSignIn)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    cleanup();
    const none = page(null, { cloud: null });
    expect(screen.getByRole('heading', { name: t.notFound })).toBeInTheDocument();
    expect(none.router.hash()).toBe('#/homebrew');
    expect(router.hash()).toBe('#/homebrew');
  });

  it('returns a sign-in from a tab to that tab', async () => {
    const app = new AppState(
      fakeEnv({
        cloud: fakeCloud(SEED),
        router: memoryRouter('#/homebrew/sets'),
        storage: memoryStorage()
      })
    );
    app.start();
    await waitFor(() => {
      expect(app.user).toBeNull();
    });
    if (!app.homebrew) throw new Error('The configured build has no homebrew store.');
    const { container } = render(HomebrewPage, {
      app,
      store: app.homebrew,
      tab: 'sets',
      openKey: null
    });
    expect(screen.queryByRole('navigation', { name: t.myItems })).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(app.signInFor).toEqual({ hash: '#/homebrew/sets' });
    app.stop();
  });

  it('draws a failed load with «Повторить», which reads again', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    page('gm1', { cloud });
    expect(await screen.findByText(t.hbLoadFailed)).toBeInTheDocument();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: t.retry }));
    expect(await screen.findByText('4 предмета из 100')).toBeInTheDocument();
  });

  it('deletes the ticked items after one confirm', async () => {
    const { dialog } = page();
    await screen.findByText('4 предмета из 100');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Кольцо с гравировкой' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Настой кузнеца' }));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(dialog.asked).toEqual([
      'Удалить предметы (2)? Они пропадут и из ваших списков. Если эти предметы есть в списках других игроков, строки пропадут и там - с количеством, ценой и заметками; владельцы списков увидят, что предметы удалены. Отменить удаление нельзя.'
    ]);
    expect(await screen.findByText('Удалено предметов: 2')).toBeInTheDocument();
    expect(screen.getByText('2 предмета из 100')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Кольцо с гравировкой' })).toBeNull();
  });

  it('puts a ticked item into a list as a link from the selection bar', async () => {
    const { cloud, pagePort, container } = page();
    await screen.findByText('4 предмета из 100');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Топор Тлеющих Углей' }));
    await userEvent.click(screen.getByRole('button', { name: t.addToList }));
    await expectNoA11yViolations(container);
    await userEvent.click(await screen.findByRole('button', { name: 'Пустой список' }));
    expect(
      await screen.findByText(t.addedTo.replace('%s', 'Пустой список'))
    ).toBeInTheDocument();
    pagePort.fireHidden();
    await waitFor(async () => {
      const read = await cloud?.lists.list();
      const empty = read?.ok ? read.lists.find((l) => l.id === uuid(102)) : undefined;
      expect(empty?.list_entries).toEqual([
        expect.objectContaining({
          item_key: 'hb_emberaxeaaaaaaaa',
          source: 'homebrew',
          hb_item: uuid(511)
        })
      ]);
    });
  });

  it('ticks every item from the strip', async () => {
    page();
    await screen.findByText('4 предмета из 100');
    await userEvent.click(screen.getByRole('checkbox', { name: t.pickAll }));
    expect(screen.getByRole('button', { name: 'Удалить (4)' })).toBeInTheDocument();
  });

  it('opens the editor from a row', async () => {
    const { router } = page();
    await screen.findByText('4 предмета из 100');
    await userEvent.click(screen.getByText('Кольцо с гравировкой'));
    expect(router.hash()).toBe('#/homebrew/hb_engravedringaaaa');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Кольцо с гравировкой' })
    ).toBeInTheDocument();
  });

  it('counts with no limit when the limit read failed', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const load = cloud.homebrew.load.bind(cloud.homebrew);
    cloud.homebrew.load = async () => {
      const r = await load();
      return r.ok ? { ...r, itemLimit: null } : r;
    };
    page('gm1', { cloud });
    expect(await screen.findByText('4 предмета')).toBeInTheDocument();
  });
});

async function fill(label: RegExp, text: string): Promise<void> {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  if (text) await userEvent.type(box, text);
}

describe('the Sets and Rules tabs', () => {
  it('draws the create button first, the count, then the cards as closed folds', async () => {
    const { container } = page();
    const panel = await sets();
    const order = [...panel.querySelectorAll('button, .note')].map((e) => e.textContent.trim());
    expect(order).toEqual([
      t.hbNewSet,
      '1 комплект · 2 карты из 100',
      'Комплект Ольхи',
      t.edit,
      t.del
    ]);
    const fold = within(panel).getByRole('button', { name: 'Комплект Ольхи' });
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(within(panel).getByText('0 предметов · Мастерская Ольхи')).toBeInTheDocument();
    expect(within(panel).queryByRole('searchbox')).toBeNull();
    await expectNoA11yViolations(container);
    const ref = await rules();
    expect([...ref.querySelectorAll('button, .note')].map((e) => e.textContent.trim())).toEqual(
      [t.hbNewCard, '1 карта правил · 2 карты из 100', 'Клеймо Ольхи', t.edit, t.del]
    );
    expect(within(ref).getByText('0 предметов')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('counts with no limit when the limit read failed', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const load = cloud.homebrew.load.bind(cloud.homebrew);
    cloud.homebrew.load = async () => {
      const r = await load();
      return r.ok ? { ...r, cardLimit: null } : r;
    };
    page('gm1', { cloud });
    expect(within(await sets()).getByText('1 комплект · 2 карты')).toBeInTheDocument();
  });

  it('opens and closes a card fold: the text, then the add field, then the members', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const held = await cloud.homebrew.load();
    const ring = held.ok ? held.items.find((i) => i.id === uuid(514)) : undefined;
    if (!ring) throw new Error('The seed has no ring. Restore it in fake-cloud-seed.ts.');
    await cloud.homebrew.updateItem(
      ring.id,
      { content: { ...ring.content, set: SET }, book_id: null },
      null
    );
    const { container } = page('gm1', { cloud });
    const panel = await sets();
    const fold = within(panel).getByRole('button', { name: 'Комплект Ольхи' });
    await userEvent.click(fold);
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    const body = document.getElementById('hb-card-body-' + uuid(521));
    expect(fold).toHaveAttribute('aria-controls', body?.id);
    expect(body).toHaveTextContent('Два предмета комплекта: +1 к Уклонению.');
    const field = within(body!).getByRole('combobox', { name: t.hbAddMember });
    const link = within(body!).getByRole('link', { name: 'Кольцо с гравировкой' });
    expect(link).toHaveAttribute('href', '#/h/' + uuid(514));
    expect(field.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      within(body!).getByRole('button', { name: 'Убрать: Кольцо с гравировкой' })
    ).toHaveTextContent(t.hbRemoveMember);
    await expectNoA11yViolations(container);
    await userEvent.click(fold);
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('hb-card-body-' + uuid(521))).toBeNull();
  });

  it('opens and scrolls to the card the address names, and nothing for another key', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { container, router } = page('gm1', { route: '#/homebrew/sets/' + SET });
    const fold = await screen.findByRole('button', { name: 'Комплект Ольхи' });
    await waitFor(() => {
      expect(fold).toHaveAttribute('aria-expanded', 'true');
    });
    await waitFor(() => {
      expect(scroll.mock.contexts).toContain(document.getElementById('hb-card-' + uuid(521)));
    });
    expect(router.hash()).toBe('#/homebrew/sets/' + SET);
    await expectNoA11yViolations(container);
    cleanup();
    const other = page('gm1', { route: '#/homebrew/rules/hb_aaaaaaaaaaaaaaaa' });
    const card = await screen.findByRole('button', { name: 'Клеймо Ольхи' });
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(other.router.hash()).toBe('#/homebrew/rules/hb_aaaaaaaaaaaaaaaa');
    cleanup();
    page('gm1', { route: '#/homebrew/rules/' + SET });
    expect(await screen.findByRole('button', { name: 'Клеймо Ольхи' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('adds a member and removes it, each a write of the item with its toast', async () => {
    const { cloud, container } = page();
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: 'Комплект Ольхи' }));
    await userEvent.type(screen.getByRole('combobox', { name: t.hbAddMember }), 'Кольцо');
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('option', { name: /Кольцо с гравировкой/ }));
    expect(await screen.findByText('Сохранено: «Кольцо с гравировкой»')).toBeInTheDocument();
    let read = await cloud?.homebrew.load();
    expect(read?.ok && read.items.find((i) => i.id === uuid(514))?.content.set).toBe(SET);
    expect(
      await within(panel).findByRole('link', { name: 'Кольцо с гравировкой' })
    ).toBeInTheDocument();
    expect(within(panel).getByText('1 предмет · Мастерская Ольхи')).toBeInTheDocument();
    await userEvent.click(
      within(panel).getByRole('button', { name: 'Убрать: Кольцо с гравировкой' })
    );
    await waitFor(() => {
      expect(within(panel).queryByRole('link', { name: 'Кольцо с гравировкой' })).toBeNull();
    });
    read = await cloud?.homebrew.load();
    expect(read?.ok && read.items.find((i) => i.id === uuid(514))?.content).not.toHaveProperty(
      'set'
    );
  });

  it('asks before it moves an item from another set, and writes nothing on a no', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.homebrew.createCard({
      id: uuid(7031),
      key: 'hb_cardaaaaaaaaaaaa',
      kind: 'set',
      book_id: null,
      content: { ru: 'Альфа', rud: 'Бонус.' }
    });
    const held = await cloud.homebrew.load();
    const ring = held.ok ? held.items.find((i) => i.id === uuid(514)) : undefined;
    if (!ring) throw new Error('The seed has no ring. Restore it in fake-cloud-seed.ts.');
    await cloud.homebrew.updateItem(
      ring.id,
      { content: { ...ring.content, set: 'hb_cardaaaaaaaaaaaa' }, book_id: null },
      null
    );
    const write = vi.spyOn(cloud.homebrew, 'updateItem');
    const { dialog } = page('gm1', { cloud, answer: false });
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: 'Комплект Ольхи' }));
    await userEvent.type(screen.getByRole('combobox', { name: t.hbAddMember }), 'Кольцо');
    await userEvent.click(screen.getByRole('option', { name: /Кольцо с гравировкой/ }));
    expect(dialog.asked).toEqual([
      'Предмет «Кольцо с гравировкой» уйдёт из комплекта «Альфа». Перенести его?'
    ]);
    expect(write).not.toHaveBeenCalled();
  });

  it('adds a rule card to an item with two and refuses a fourth', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const more = ['hb_rulebbbbbbbbbbbb', 'hb_rulecccccccccccc', 'hb_ruledddddddddddd'];
    for (const [i, key] of more.entries()) {
      await cloud.homebrew.createCard({
        id: uuid(7040 + i),
        key,
        kind: 'ref',
        book_id: null,
        content: { ru: 'Правило ' + String(i), rud: 'Текст.' }
      });
    }
    const held = await cloud.homebrew.load();
    const row = (id: string) => (held.ok ? held.items.find((i) => i.id === id) : undefined);
    const ring = row(uuid(514));
    const potion = row(uuid(512));
    if (!ring || !potion) throw new Error('The seed has no ring or potion.');
    await cloud.homebrew.updateItem(
      ring.id,
      { content: { ...ring.content, refs: more.slice(0, 2) }, book_id: null },
      null
    );
    await cloud.homebrew.updateItem(
      potion.id,
      { content: { ...potion.content, refs: more }, book_id: potion.book_id },
      null
    );
    const write = vi.spyOn(cloud.homebrew, 'updateItem');
    page('gm1', { cloud });
    const panel = await rules();
    await userEvent.click(within(panel).getByRole('button', { name: 'Клеймо Ольхи' }));
    const field = within(panel).getAllByRole('combobox', { name: t.hbAddMember })[0]!;
    await userEvent.type(field, 'Настой');
    await userEvent.click(screen.getByRole('option', { name: /Настой кузнеца/ }));
    expect(
      await screen.findByText('У предмета «Настой кузнеца» уже три карты правил.')
    ).toBeInTheDocument();
    expect(write).not.toHaveBeenCalled();
    await userEvent.type(field, 'Кольцо');
    await userEvent.click(screen.getByRole('option', { name: /Кольцо с гравировкой/ }));
    expect(await screen.findByText('Сохранено: «Кольцо с гравировкой»')).toBeInTheDocument();
    const read = await cloud.homebrew.load();
    expect(read.ok && read.items.find((i) => i.id === uuid(514))?.content.refs).toEqual([
      ...more.slice(0, 2),
      RULE
    ]);
  });

  it.each([
    ['conflict', { ok: false, error: 'conflict' } as const, t.hbItemChanged],
    ['gone', { ok: false, error: 'gone' } as const, t.hbGone],
    [
      'limit',
      { ok: false, error: 'limit', key: 'homebrew_items_per_owner', value: 100 } as const,
      limitText('homebrew_items_per_owner', 100, t)
    ],
    ['network', { ok: false, error: 'network' } as const, t.hbWriteFailed]
  ])('says a member write answered %s', async (kind, answer, text) => {
    const cloud = fakeCloud(SEED, 'gm1');
    vi.spyOn(cloud.homebrew, 'updateItem').mockResolvedValueOnce(answer);
    const load = vi.spyOn(cloud.homebrew, 'load');
    page('gm1', { cloud });
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: 'Комплект Ольхи' }));
    await userEvent.type(screen.getByRole('combobox', { name: t.hbAddMember }), 'Кольцо');
    load.mockClear();
    await userEvent.click(screen.getByRole('option', { name: /Кольцо с гравировкой/ }));
    expect(await screen.findByText(text)).toBeInTheDocument();
    if (kind === 'conflict' || kind === 'gone') expect(load).toHaveBeenCalled();
    expect(within(panel).queryByRole('link', { name: 'Кольцо с гравировкой' })).toBeNull();
  });

  it('offers no item whose write is in flight', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const real = cloud.homebrew.updateItem.bind(cloud.homebrew);
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    vi.spyOn(cloud.homebrew, 'updateItem').mockImplementationOnce(async (...a) => {
      await gate;
      return real(...a);
    });
    page('gm1', { cloud });
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: 'Комплект Ольхи' }));
    const field = screen.getByRole('combobox', { name: t.hbAddMember });
    await userEvent.type(field, 'Кольцо');
    await userEvent.click(screen.getByRole('option', { name: /Кольцо с гравировкой/ }));
    await userEvent.type(field, 'Кольцо');
    expect(screen.queryByRole('option', { name: /Кольцо с гравировкой/ })).toBeNull();
    expect(screen.getByText(t.hbPickNone)).toBeInTheDocument();
    open();
    expect(await screen.findByText('Сохранено: «Кольцо с гравировкой»')).toBeInTheDocument();
  });

  it('draws the search from the eighth card, «Ничего не найдено», and keeps an open form', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    for (let i = 0; i < 7; i++) {
      await cloud.homebrew.createCard({
        id: uuid(7060 + i),
        key: 'hb_set' + 'abcdefg'.charAt(i) + 'aaaaaaaaaaaaaaa'.slice(0, 12),
        kind: 'set',
        book_id: null,
        content: { ru: 'Комплект ' + 'АБВГДЕЖ'.charAt(i), rud: 'Бонус.' }
      });
    }
    page('gm2', { cloud });
    let panel = await sets();
    expect(within(panel).getByText('7 комплектов · 7 карт из 100')).toBeInTheDocument();
    expect(within(panel).queryByRole('searchbox')).toBeNull();
    cleanup();
    await cloud.homebrew.createCard({
      id: uuid(7067),
      key: 'hb_sethaaaaaaaaaaaa',
      kind: 'set',
      book_id: null,
      content: { ru: 'Особый', rud: 'Бонус.' }
    });
    const { container } = page('gm2', { cloud });
    panel = await sets();
    const box = within(panel).getByRole('searchbox');
    expect(box).toHaveAttribute('placeholder', t.hbFindSets);
    await userEvent.type(box, 'особ');
    expect(
      within(panel)
        .getAllByRole('button', { name: /^Комплект|^Особый/ })
        .map((b) => b.textContent)
    ).toEqual(['Особый']);
    expect(within(panel).getByText('8 комплектов · 8 карт из 100')).toBeInTheDocument();
    await userEvent.clear(box);
    await userEvent.type(box, 'яяя');
    expect(within(panel).getByText(t.nothing)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.clear(box);
    const edits = within(panel).getAllByRole('button', { name: t.edit });
    await userEvent.click(edits[0] as HTMLElement);
    await userEvent.type(box, 'особ');
    expect(screen.getByRole('group', { name: 'Комплект А' })).toBeInTheDocument();
  });

  it('makes, edits and deletes a set', async () => {
    const { cloud, container, dialog } = page();
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSet }));
    const form = screen.getByRole('group', { name: t.hbNewSet });
    await waitFor(() => {
      expect(within(form).getByLabelText(/^Название комплекта/)).toHaveFocus();
    });
    await expectNoA11yViolations(container);
    expect(within(form).getByLabelText(/^Название комплекта/)).toHaveAttribute(
      'maxlength',
      '80'
    );
    const bonus = within(form).getByLabelText(/^Бонус комплекта/);
    expect(bonus).toHaveAttribute('maxlength', '1500');
    await userEvent.click(bonus);
    await userEvent.paste('я'.repeat(1251));
    expect(form.querySelector('.counter')?.textContent).toBe('1251 / 1500');
    await fill(/^Название комплекта/, 'Кузнечный');
    await fill(/^Бонус комплекта/, 'Два предмета: +1 к Броне.');
    await userEvent.selectOptions(within(form).getByLabelText(t.hbSource), ALDER);
    await userEvent.click(within(form).getByRole('button', { name: t.hbCreateSet }));
    expect(await screen.findByText('Комплект «Кузнечный» создан')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: t.hbNewSet })).not.toBeInTheDocument();
    let read = await cloud?.homebrew.load();
    const made = read?.ok ? read.cards.find((c) => c.content.ru === 'Кузнечный') : undefined;
    expect(made).toMatchObject({
      kind: 'set',
      book_id: ALDER,
      content: { ru: 'Кузнечный', rud: 'Два предмета: +1 к Броне.' }
    });

    const edits = within(panel).getAllByRole('button', { name: t.edit });
    await userEvent.click(edits[0] as HTMLElement);
    const edit = screen.getByRole('group', { name: 'Комплект Ольхи' });
    expect(within(edit).getByLabelText(/^Название комплекта/)).toHaveValue('Комплект Ольхи');
    await fill(/^Название комплекта/, 'Комплект Ивы');
    await userEvent.keyboard('{Enter}');
    expect(await within(panel).findByText('Комплект Ивы')).toBeInTheDocument();
    expect(await screen.findByText('Сохранено: «Комплект Ивы»')).toBeInTheDocument();
    read = await cloud?.homebrew.load();
    expect(read?.ok && read.cards.find((c) => c.id === uuid(521))).toMatchObject({
      revision: 2,
      content: {
        ru: 'Комплект Ивы',
        en: 'Alder Set',
        rud: 'Два предмета комплекта: +1 к Уклонению.',
        ende: 'Two pieces of the set: +1 to Evasion.'
      }
    });

    const dels = within(panel).getAllByRole('button', { name: t.del });
    await userEvent.click(dels[0] as HTMLElement);
    expect(dialog.asked.at(-1)).toBe(
      'Удалить комплект «Комплект Ивы»? Отменить удаление нельзя.'
    );
    expect(await screen.findByText('Комплект «Комплект Ивы» удалён')).toBeInTheDocument();
    expect(within(panel).queryByText('Комплект Ивы')).not.toBeInTheDocument();
  });

  it('sorts the cards of a tab by name', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.homebrew.createCard({
      id: uuid(7031),
      key: 'hb_cardaaaaaaaaaaaa',
      kind: 'set',
      book_id: null,
      content: { ru: 'Альфа' }
    });
    page('gm1', { cloud });
    const panel = await sets();
    const names = [...panel.querySelectorAll('.name')].map((e) => e.textContent.trim());
    expect(names).toEqual(['Альфа', 'Комплект Ольхи']);
    expect(within(panel).getByText('2 комплекта · 3 карты из 100')).toBeInTheDocument();
  });

  it('refuses an empty name and bonus, a taken name, the card limit and an http link', async () => {
    const { container } = page('gm1', { fake: { limits: { cards: 2 } } });
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSet }));
    await userEvent.click(screen.getByRole('button', { name: t.hbCreateSet }));
    expect(await screen.findByText(t.hbErrName)).toBeInTheDocument();
    expect(screen.getByText(t.hbErrSetBonus)).toBeInTheDocument();
    const name = screen.getByLabelText(/^Название комплекта/);
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    await expectNoA11yViolations(container);
    await fill(/^Название комплекта/, 'комплект ольхи');
    expect(screen.queryByText(t.hbErrName)).not.toBeInTheDocument();
    await fill(/^Бонус комплекта/, 'Бонус');
    await userEvent.click(screen.getByRole('button', { name: t.hbCreateSet }));
    expect(await screen.findByText('Комплект «комплект ольхи» уже есть.')).toBeInTheDocument();
    await fill(/^Название комплекта/, 'Кузнечный');
    await userEvent.click(screen.getByRole('button', { name: t.hbCreateSet }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Достигнут предел карт (комплектов и карт правил): 2.'
    );
    expect(screen.getByLabelText(/^Название комплекта/)).toHaveValue('Кузнечный');

    /* The changed form asks before the tab press; the yes leaves it. */
    await rules();
    expect(screen.queryByRole('group', { name: t.hbNewSet })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.hbNewCard }));
    const form = screen.getByRole('group', { name: t.hbNewCard });
    await fill(/^Название карты/, 'Огненный след');
    await fill(/^Текст карты/, 'Цель горит.');
    await fill(/^Ссылка/, 'http://example.test');
    await userEvent.click(within(form).getByRole('button', { name: t.hbCreateCard }));
    expect(await screen.findByText(t.hbErrUrl)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Ссылка/)).toHaveFocus();
    await fill(/^Текст карты/, '');
    await userEvent.click(within(form).getByRole('button', { name: t.hbCreateCard }));
    expect(await screen.findByText(t.hbErrCardText)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: t.hbNewCard })).not.toBeInTheDocument();
  });

  it('says a card changed on another device and a lost network', async () => {
    const { cloud } = page();
    const panel = await rules();
    await userEvent.click(within(panel).getByRole('button', { name: t.edit }));
    const form = screen.getByRole('group', { name: 'Клеймо Ольхи' });
    expect(within(form).getByLabelText(/^Ссылка/)).toHaveValue(
      'https://example.test/alder-brand'
    );
    /* The owner feed's join asks for one coalesced read; it lands before the change. */
    await new Promise((r) => setTimeout(r, COALESCE_MS + 50));
    const held = await cloud?.homebrew.load();
    const row = held?.ok ? held.cards.find((c) => c.id === uuid(522)) : undefined;
    if (!row) throw new Error('The seed has no rule card. Restore it in fake-cloud-seed.ts.');
    const ende = 'Twice per rest: reroll one damage die.';
    await cloud?.homebrew.updateCard(
      uuid(522),
      { content: { ...row.content, ende }, book_id: row.book_id },
      null
    );
    await fill(/^Подзаголовок/, 'Черта');
    await userEvent.click(within(form).getByRole('button', { name: t.save }));
    expect(await within(form).findByText(t.hbCardChanged)).toBeInTheDocument();
    const fake = cloud as ReturnType<typeof fakeCloud>;
    fake.setOffline(true);
    await userEvent.click(within(form).getByRole('button', { name: t.save }));
    expect(await within(form).findByText(t.hbWriteFailed)).toBeInTheDocument();
    expect(within(form).getByLabelText(/^Подзаголовок/)).toHaveValue('Черта');
    fake.setOffline(false);
    await userEvent.click(within(form).getByRole('button', { name: t.save }));
    await waitFor(() => {
      expect(screen.queryByRole('group', { name: 'Клеймо Ольхи' })).not.toBeInTheDocument();
    });
    const read = await cloud?.homebrew.load();
    expect(read?.ok && read.cards.find((c) => c.id === uuid(522))).toMatchObject({
      revision: row.revision + 2,
      content: { rusub: 'Черта', en: 'Alder Brand', ende }
    });
  });

  it('toasts a card another device deleted while its edit form is open', async () => {
    const { cloud } = page();
    const panel = await rules();
    await userEvent.click(within(panel).getByRole('button', { name: t.edit }));
    const form = screen.getByRole('group', { name: 'Клеймо Ольхи' });
    await new Promise((r) => setTimeout(r, COALESCE_MS + 50));
    await cloud?.homebrew.removeCard(uuid(522));
    await userEvent.click(within(form).getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.hbCardGone)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Клеймо Ольхи' })).not.toBeInTheDocument();
  });

  it('says a lost network on a new card', async () => {
    const { cloud } = page();
    const panel = await rules();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewCard }));
    await fill(/^Название карты/, 'Огненный след');
    await fill(/^Текст карты/, 'Цель горит.');
    (cloud as ReturnType<typeof fakeCloud>).setOffline(true);
    await userEvent.click(screen.getByRole('button', { name: t.hbCreateCard }));
    expect(await screen.findByText(t.hbCreateFailed)).toBeInTheDocument();
  });

  it('asks the used form for a card an item names, and toasts a failed delete', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const held = await cloud.homebrew.load();
    const axe = held.ok ? held.items.find((i) => i.key === 'hb_emberaxeaaaaaaaa') : undefined;
    if (!axe) throw new Error('The seed has no axe. Restore it in fake-cloud-seed.ts.');
    const content = { ...axe.content, set: SET, refs: [RULE] };
    await cloud.homebrew.updateItem(axe.id, { content, book_id: axe.book_id }, null);
    const { dialog } = page('gm1', { cloud, answer: false });
    const setTab = await sets();
    expect(within(setTab).getByText('1 предмет · Мастерская Ольхи')).toBeInTheDocument();
    await userEvent.click(within(setTab).getByRole('button', { name: t.del }));
    const ruleTab = await rules();
    await userEvent.click(within(ruleTab).getByRole('button', { name: t.del }));
    expect(dialog.asked).toEqual([
      'Удалить комплект «Комплект Ольхи»? Он указан в 1 предмете - там пропадут его название и бонус. Отменить удаление нельзя.',
      'Удалить карту правил «Клеймо Ольхи»? Она указана в 1 предмете - там она пропадёт. Отменить удаление нельзя.'
    ]);
    await userEvent.click(within(ruleTab).getByRole('button', { name: t.edit }));
    expect(
      screen.getByText('Изменения появятся на 1 предмете и в списках, где он лежит.')
    ).toBeInTheDocument();
    cleanup();
    const off = page('gm1');
    const again = await rules();
    (off.cloud as ReturnType<typeof fakeCloud>).setOffline(true);
    await userEvent.click(within(again).getByRole('button', { name: t.del }));
    expect(off.dialog.asked).toEqual([
      'Удалить карту правил «Клеймо Ольхи»? Отменить удаление нельзя.'
    ]);
    expect(await screen.findByText(t.hbDeleteFailed)).toBeInTheDocument();
    expect(within(again).getByText('Клеймо Ольхи')).toBeInTheDocument();
  });

  it('deletes a rule card with its toast, the items keeping its key', async () => {
    const { cloud } = page();
    const panel = await rules();
    await userEvent.click(within(panel).getByRole('button', { name: t.del }));
    expect(await screen.findByText('Карта правил «Клеймо Ольхи» удалена')).toBeInTheDocument();
    const read = await cloud?.homebrew.load();
    expect(read?.ok && read.cards.map((c) => c.key)).toEqual([SET]);
  });
});

describe('the card form on a tab', () => {
  it('asks before a tab press and on unload while the draft differs, and a no keeps it', async () => {
    const { dialog, pagePort, router } = page('gm1', { answer: false });
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSet }));
    expect(pagePort.unloadAsks()).toBe(false);
    await fill(/^Название комплекта/, 'Кузнечный');
    expect(pagePort.unloadAsks()).toBe(true);
    router.navigate('#/homebrew/rules');
    expect(dialog.asked).toEqual([t.leaveUnsaved]);
    expect(router.hash()).toBe('#/homebrew/sets');
    expect(screen.getByRole('group', { name: t.hbNewSet })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.cancel }));
    expect(pagePort.unloadAsks()).toBe(false);
    router.navigate('#/homebrew/rules');
    expect(dialog.asked).toHaveLength(1);
    expect(await screen.findByRole('button', { name: t.hbNewCard })).toBeInTheDocument();
  });

  it('leaves a clean form with no question', async () => {
    const { dialog, pagePort, router } = page('gm1');
    const panel = await sets();
    await userEvent.click(within(panel).getByRole('button', { name: t.edit }));
    expect(pagePort.unloadAsks()).toBe(false);
    router.navigate('#/homebrew/rules');
    expect(dialog.asked).toEqual([]);
    expect(await screen.findByRole('button', { name: t.hbNewCard })).toBeInTheDocument();
  });

  it('registers no check from the editor`s inline form', async () => {
    const pagePort = fakePage();
    const dialog = fakeDialog(false);
    const app = new AppState(
      fakeEnv({
        cloud: fakeCloud(SEED, 'gm1'),
        router: memoryRouter('#/homebrew/sets'),
        storage: memoryStorage(),
        page: pagePort,
        dialog
      })
    );
    app.start();
    await waitFor(() => {
      expect(app.user).toBeTruthy();
    });
    if (!app.homebrew) throw new Error('The configured build has no homebrew store.');
    render(CardForm, {
      app,
      store: app.homebrew,
      id: 'inline',
      kind: 'set',
      card: null,
      bookId: null,
      onsaved: () => undefined,
      oncancel: () => undefined
    });
    await fill(/^Название комплекта/, 'Кузнечный');
    expect(pagePort.unloadAsks()).toBe(false);
    app.go('#/lists');
    expect(dialog.asked).toEqual([]);
    app.stop();
  });
});

describe('the Items tab search', () => {
  it('draws no box at seven items and the box at eight', async () => {
    page('gm1', { fake: { fillItems: 7 } });
    expect(await screen.findByText('7 предметов из 7')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).toBeNull();
    cleanup();
    const { container } = page('gm1', { fake: { fillItems: 8 } });
    expect(await screen.findByText('8 предметов из 8')).toBeInTheDocument();
    const box = screen.getByRole('searchbox');
    expect(box).toHaveAttribute('placeholder', t.hbFindOwn);
    /* The box, then the count, then the strip. */
    const count = screen.getByText('8 предметов из 8');
    expect(box.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('hides the headings with no match and draws «Ничего не найдено» with the count kept', async () => {
    const { container } = page('gm1', { fake: { fillItems: 8 } });
    const box = await screen.findByRole('searchbox');
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(1);
    await userEvent.type(box, 'кольцо');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Хоумбрю 1'
    ]);
    await userEvent.clear(box);
    await userEvent.type(box, 'яяя');
    expect(screen.getByText(t.nothing)).toBeInTheDocument();
    expect(screen.getByText('8 предметов из 8')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: t.pickAll })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('ticks the drawn rows only, and drops a tick the query hides', async () => {
    const { dialog } = page('gm1', { fake: { fillItems: 8 } });
    const box = await screen.findByRole('searchbox');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Настой кузнеца' }));
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeInTheDocument();
    await userEvent.type(box, 'кольцо');
    expect(screen.queryByRole('button', { name: /^Удалить/ })).toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: t.pickAll }));
    expect(screen.getByRole('button', { name: 'Скачать JSON (1)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (1)' }));
    expect(dialog.asked).toHaveLength(1);
    expect(await screen.findByText('Удалено предметов: 1')).toBeInTheDocument();
    /* Seven items left: the box goes and every row is drawn again, the hidden tick dropped. */
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Настой кузнеца' })).not.toBeChecked();
    expect(screen.getByText('7 предметов из 8')).toBeInTheDocument();
  });

  it('starts the query empty after a tab press and back', async () => {
    page('gm1', { fake: { fillItems: 8 } });
    await userEvent.type(await screen.findByRole('searchbox'), 'кольцо');
    await sources();
    await items();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(1);
  });
});

describe('the ticks across the tabs', () => {
  it('keeps the ticks across a tab press and moves them into a source made on the Sources tab', async () => {
    page('gm1');
    await screen.findByText('4 предмета из 100');
    for (const name of ['Кольцо с гравировкой', 'Настой кузнеца']) {
      await userEvent.click(screen.getByRole('checkbox', { name }));
    }
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbNewSource }));
    await typeInto(t.hbNewSource, 'Кузня');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Источник «Кузня» создан')).toBeInTheDocument();
    await items();
    expect(screen.getByRole('checkbox', { name: 'Кольцо с гравировкой' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Настой кузнеца' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Переместить (2)' }));
    await userEvent.selectOptions(screen.getByLabelText('Источник'), 'Кузня');
    await userEvent.click(screen.getByRole('button', { name: 'Переместить' }));
    expect(await screen.findByText('Перемещено предметов: 2')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Кузня 2' })
    ).toBeInTheDocument();
  });
});

const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
/* A key from a number: `hb_` and 16 base32 characters. */
const keyN = (n: number): string => {
  let tail = '';
  let v = n;
  do {
    tail = BASE32.charAt(v % 32) + tail;
    v = Math.floor(v / 32);
  } while (v > 0);
  return 'hb_' + tail.padStart(16, 'a');
};

describe('the bulk move', () => {
  const HOME = ['Кольцо с гравировкой', 'Настой кузнеца', 'Whispering Cap'];
  /* gm1's three items of the default source, ticked, and the move panel open. */
  async function moving(cloud = fakeCloud(SEED, 'gm1')) {
    const view = page('gm1', { cloud });
    await screen.findByText('4 предмета из 100');
    for (const name of HOME) await userEvent.click(screen.getByRole('checkbox', { name }));
    await userEvent.click(screen.getByRole('button', { name: 'Переместить (3)' }));
    return view;
  }
  const go = (): HTMLElement => screen.getByRole('button', { name: 'Переместить' });

  it('opens under the strip with the source and section selects, nothing to move at first', async () => {
    const { container } = await moving();
    expect(screen.getByRole('button', { name: 'Переместить (3)' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const strip = container.querySelector('.batch');
    expect(
      [...strip!.querySelectorAll('.batch-acts button')].map((b) => b.textContent.trim())
    ).toEqual(['Переместить (3)', 'Скачать JSON (3)', 'Удалить (3)']);
    const source = screen.getByLabelText('Источник');
    expect([...source.querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'Хоумбрю',
      'Мастерская Ольхи'
    ]);
    expect(screen.queryByLabelText('Раздел')).toBeNull();
    expect(go()).toBeDisabled();
    expect(screen.getByText('Отмеченные предметы уже здесь.')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.selectOptions(source, 'Мастерская Ольхи');
    const section = screen.getByLabelText('Раздел');
    expect([...section.querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'Без раздела',
      'Пистоли',
      'Холодное оружие'
    ]);
    expect(go()).toBeEnabled();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Переместить (3)' }));
    expect(screen.queryByLabelText('Источник')).toBeNull();
  });

  it('moves the ticked items in one call, toasts, clears the selection and closes the panel', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const move = vi.spyOn(cloud.homebrew, 'moveItems');
    await moving(cloud);
    await userEvent.selectOptions(screen.getByLabelText('Источник'), 'Мастерская Ольхи');
    await userEvent.selectOptions(screen.getByLabelText('Раздел'), 'Пистоли');
    await userEvent.click(go());
    expect(await screen.findByText('Перемещено предметов: 3')).toBeInTheDocument();
    expect(move).toHaveBeenCalledOnce();
    expect(move.mock.calls[0]?.[0]).toHaveLength(3);
    expect(move.mock.calls[0]?.[0].every((r) => r.revision === 1)).toBe(true);
    expect(move.mock.calls[0]?.slice(1)).toEqual([ALDER, 'hb_sectpistolsaaaaa']);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Мастерская Ольхи · Пистоли 3' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Переместить/ })).toBeNull();
    expect(screen.queryByLabelText('Источник')).toBeNull();
  });

  it('sends only the items whose place differs, and reads «Перемещаем...» while it runs', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const real = cloud.homebrew.moveItems.bind(cloud.homebrew);
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    const move = vi.spyOn(cloud.homebrew, 'moveItems').mockImplementationOnce(async (...a) => {
      await gate;
      return real(...a);
    });
    page('gm1', { cloud });
    await screen.findByText('4 предмета из 100');
    for (const name of ['Топор Тлеющих Углей', 'Настой кузнеца']) {
      await userEvent.click(screen.getByRole('checkbox', { name }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Переместить (2)' }));
    await userEvent.selectOptions(screen.getByLabelText('Источник'), 'Мастерская Ольхи');
    await userEvent.selectOptions(screen.getByLabelText('Раздел'), 'Холодное оружие');
    await userEvent.click(go());
    expect(screen.getByRole('button', { name: 'Перемещаем...' })).toBeDisabled();
    open();
    expect(await screen.findByText('Перемещено предметов: 1')).toBeInTheDocument();
    expect(move.mock.calls[0]?.[0].map((r) => r.id)).toEqual([uuid(512)]);
  });

  it('names a section and a source deleted on another device under the selects', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container } = await moving(cloud);
    vi.spyOn(cloud.homebrew, 'moveItems').mockResolvedValue({ ok: false, error: 'gone' });
    await userEvent.selectOptions(screen.getByLabelText('Источник'), 'Мастерская Ольхи');
    await userEvent.selectOptions(screen.getByLabelText('Раздел'), 'Пистоли');
    await userEvent.click(go());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Этого раздела больше нет - его удалили на другом устройстве. Выберите другой раздел.'
    );
    expect(screen.getByLabelText('Источник')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await cloud.homebrew.removeBook(ALDER);
    await userEvent.click(go());
    expect(
      await screen.findByText(
        'Этого источника больше нет - его удалили на другом устройстве. Выберите другой источник.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Настой кузнеца' })).toBeChecked();
  });

  it.each([
    [{ ok: false, error: 'conflict' } as const, t.hbMoveChanged],
    [{ ok: false, error: 'network' } as const, t.hbMoveFailed],
    [{ ok: false, error: 'refused' } as const, t.hbMoveRefused]
  ])('says a move answered %o, keeps the selection and reads again', async (answer, text) => {
    const cloud = fakeCloud(SEED, 'gm1');
    await moving(cloud);
    vi.spyOn(cloud.homebrew, 'moveItems').mockResolvedValueOnce(answer);
    const read = vi.spyOn(cloud.homebrew, 'load');
    await userEvent.selectOptions(screen.getByLabelText('Источник'), 'Мастерская Ольхи');
    await userEvent.click(go());
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(read).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Переместить (3)' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  /* 300 rows in jsdom under coverage take about 35 s; the bound is the render's, not the move's. */
  it('moves 300 ticked items in one call', async () => {
    const cloud = fakeCloud(SEED, 'gm2', { limits: { items: 300 } });
    await cloud.homebrew.import({
      books: [
        { id: uuid(7000), key: 'hb_bigsourceaaaaaaa', content: { ru: 'Склад' }, names: true }
      ],
      cards: [],
      items: Array.from({ length: 300 }, (_, i) => ({
        id: uuid(7001 + i),
        key: keyN(i),
        book: null,
        content: { kind: 'item' as const, ru: 'Предмет ' + String(i) }
      })),
      update: false
    });
    const move = vi.spyOn(cloud.homebrew, 'moveItems');
    page('gm2', { cloud });
    await screen.findByText('300 предметов из 300');
    await userEvent.click(screen.getByRole('checkbox', { name: t.pickAll }));
    await userEvent.click(screen.getByRole('button', { name: 'Переместить (300)' }));
    await userEvent.selectOptions(screen.getByLabelText('Источник'), 'Склад');
    await userEvent.click(go());
    expect(await screen.findByText('Перемещено предметов: 300')).toBeInTheDocument();
    expect(move).toHaveBeenCalledOnce();
    expect(move.mock.calls[0]?.[0]).toHaveLength(300);
  }, 120_000);
});

describe('the downloads', () => {
  it('downloads a source, the default source and the ticked items as homebrew files', async () => {
    const image = fakeImage();
    page('gm1', { env: { clock: fixedClock(Date.UTC(2026, 9, 2, 12)), image } });
    await screen.findByText('4 предмета из 100');
    const panel = await sources();
    const buttons = within(panel).getAllByRole('button', { name: 'Скачать JSON' });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[1]!);
    await userEvent.click(buttons[0]!);
    await items();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Настой кузнеца' }));
    await userEvent.click(screen.getByRole('button', { name: 'Скачать JSON (1)' }));
    await waitFor(() => {
      expect(image.downloaded.map((d) => d.filename)).toEqual([
        'Хоумбрю.json',
        'Мастерская Ольхи.json',
        'daggerheart-loot-homebrew-2026-10-02.json'
      ]);
    });
    const one = JSON.parse(await image.downloaded[2]!.blob.text()) as {
      items: { key: string }[];
    };
    expect(one.items.map((i) => i.key)).toEqual(['hb_smithpotionaaaaa']);
  });
});

describe('a rename in the language that names it', () => {
  it('writes an English-only source and section in English in the Russian interface', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.homebrew.createBook({
      id: uuid(7500),
      key: 'hb_englishonlyaaaaa',
      content: { en: 'Old Forge', sections: [{ key: 'hb_englishsectaaaaa', en: 'Tongs' }] }
    });
    page('gm1', { cloud });
    const panel = await sources();
    const row = within(panel).getByText('Old Forge').closest('li')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Переименовать' }));
    const box = within(row).getByRole('textbox');
    await userEvent.clear(box);
    await userEvent.type(box, 'New Forge');
    await userEvent.click(within(row).getByRole('button', { name: 'Сохранить' }));
    await waitFor(async () => {
      const read = await cloud.homebrew.load();
      const b = read.ok ? read.books.find((x) => x.key === 'hb_englishonlyaaaaa') : undefined;
      expect(b?.content).toMatchObject({ en: 'New Forge' });
      expect(b?.content.ru).toBeUndefined();
    });
    const fresh = within(panel).getByText('New Forge').closest('li')!;
    await userEvent.click(within(fresh).getByRole('button', { name: 'Разделы' }));
    const sect = within(fresh).getByText('Tongs').closest('li')!;
    await userEvent.click(within(sect).getByRole('button', { name: 'Переименовать' }));
    const sbox = within(sect).getByRole('textbox');
    await userEvent.clear(sbox);
    await userEvent.type(sbox, 'Pliers');
    await userEvent.click(within(sect).getByRole('button', { name: 'Сохранить' }));
    await waitFor(async () => {
      const read = await cloud.homebrew.load();
      const b = read.ok ? read.books.find((x) => x.key === 'hb_englishonlyaaaaa') : undefined;
      expect(b?.content.sections).toEqual([{ key: 'hb_englishsectaaaaa', en: 'Pliers' }]);
    });
  });
});
