/* `#/homebrew` over the fake cloud: the count, the groups, the folds «Источники» and
   «Карты», the sources and sections and the set and rule cards with every refusal and
   confirm, the empty, signed-out, unconfigured and failed states, the batch delete, the bulk
   move, the downloads, a rename in the language that names it and a row opening the editor.
   docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { dict } from '../lib/dict.js';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
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
import type { CloudPort } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - the selection bar's add-to-list menu places
   itself with it once open. */
Element.prototype.scrollIntoView = vi.fn();

const t = dict('ru');
const ALDER = uuid(501);

function page(
  as: 'gm1' | 'gm2' | null = 'gm1',
  opts: { cloud?: CloudPort | null; answer?: boolean; fake?: FakeCloudOptions } = {}
) {
  const cloud =
    opts.cloud === undefined
      ? as === null
        ? fakeCloud(SEED, undefined, opts.fake)
        : fakeCloud(SEED, as, opts.fake)
      : opts.cloud;
  const router = memoryRouter('#/homebrew');
  const dialog = fakeDialog(opts.answer ?? true);
  const pagePort = fakePage();
  const view = render(App, {
    env: fakeEnv({ cloud, router, dialog, page: pagePort, storage: memoryStorage() })
  });
  return { ...view, cloud, router, dialog, pagePort };
}

/* Opens a fold of the page by its summary and returns its panel. */
async function fold(label: RegExp): Promise<HTMLElement> {
  const summary = await screen.findByText(label, { selector: 'summary' });
  await userEvent.click(summary);
  return summary.closest('.panel') as HTMLElement;
}

const sources = (): Promise<HTMLElement> => fold(/^Источники/);
const cards = (): Promise<HTMLElement> => fold(/^Карты/);

async function typeInto(label: string, text: string): Promise<void> {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  if (text) await userEvent.type(box, text);
}

describe('#/homebrew', () => {
  it('draws the count, the sources and the items under their source and section', async () => {
    const { container } = page();
    expect(await screen.findByText('4 предмета из 100')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: t.myItems })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Предметы, которых нет в книгах: они ищутся вместе с каталогом, попадают в таблицы и добавляются в списки.'
      )
    ).toBeInTheDocument();
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(heads).toEqual([
      t.hbSets,
      t.hbRefs,
      'Мастерская Ольхи · Холодное оружие 1',
      'Хоумбрю 3'
    ]);
    const folds = [...container.querySelectorAll<HTMLDetailsElement>('.stack details')];
    expect(folds.map((d) => d.open)).toEqual([false, false]);
    expect(folds.map((d) => d.querySelector('summary')?.textContent)).toEqual([
      'Источники · 1 источник из 20',
      'Карты · 2 карты из 100: 1 комплект, 1 карта правил'
    ]);
    await expectNoA11yViolations(container);
    const panel = await sources();
    expect(folds[0]?.open).toBe(true);
    expect(within(panel).getByText('Мастерская Ольхи')).toBeInTheDocument();
    expect(within(panel).getByText('1 предмет · 2 раздела из 30')).toBeInTheDocument();
    expect(within(panel).getByText('3 предмета')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Новый предмет/ })).toHaveAttribute(
      'href',
      '#/homebrew/new'
    );
    expect(screen.getByText('Мастерская Ольхи (HB)')).toBeInTheDocument();
    await expectNoA11yViolations(container);
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
    const { container } = page('gm2');
    await screen.findByText(t.hbEmpty);
    const summaries = [...container.querySelectorAll('.stack summary')].map(
      (e) => e.textContent
    );
    expect(summaries).toEqual(['Источники · 0 источников из 20', 'Карты · 0 карт из 100']);
    cleanup();
    page('gm1');
    const panel = await sources();
    expect(within(panel).getByText('1 предмет · 2 раздела из 30')).toBeInTheDocument();
  });

  it('counts at an override of three times the limits', async () => {
    const { container } = page('gm1', {
      fake: { limits: { items: 300, books: 60, cards: 300 } }
    });
    expect(await screen.findByText('4 предмета из 300')).toBeInTheDocument();
    const summaries = [...container.querySelectorAll('.stack summary')].map(
      (e) => e.textContent
    );
    expect(summaries).toEqual([
      'Источники · 1 источник из 60',
      'Карты · 2 карты из 300: 1 комплект, 1 карта правил'
    ]);
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
    expect(screen.getByText(t.hbSources, { selector: 'summary' })).toBeInTheDocument();
    expect(screen.getByText(t.hbCards, { selector: 'summary' })).toBeInTheDocument();
    const panel = await cards();
    expect(within(panel).getByText(t.hbNoSets)).toBeInTheDocument();
    expect(within(panel).getByText(t.hbNoRefs)).toBeInTheDocument();
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
      'Удалить предметы (2)? Они пропадут и из ваших списков. Отменить удаление нельзя.'
    ]);
    expect(await screen.findByText('Удалено предметов: 2')).toBeInTheDocument();
    expect(screen.getByText('2 предмета из 100')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Кольцо с гравировкой' })).toBeNull();
  });

  it('puts a ticked item into a list as a reference from the selection bar', async () => {
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
          snapshot: null
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

describe('#/homebrew «Карты»', () => {
  it('opens on the sets and rule cards, each group with its create button first', async () => {
    const { container } = page();
    const panel = await cards();
    const heads = within(panel).getAllByRole('heading', { level: 2 });
    expect(heads.map((h) => h.textContent)).toEqual([t.hbSets, t.hbRefs]);
    const order = [...panel.querySelectorAll('h2, button, .name')].map((e) =>
      e.textContent.trim()
    );
    expect(order).toEqual([
      t.hbSets,
      t.hbNewSet,
      'Комплект Ольхи',
      t.edit,
      t.del,
      t.hbRefs,
      t.hbNewCard,
      'Клеймо Ольхи',
      t.edit,
      t.del
    ]);
    expect(within(panel).getByText('0 предметов · Мастерская Ольхи')).toBeInTheDocument();
    expect(within(panel).getByText('0 предметов')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('sorts the cards of a group by name', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.homebrew.createCard({
      id: uuid(7031),
      key: 'hb_cardaaaaaaaaaaaa',
      kind: 'set',
      book_id: null,
      content: { ru: 'Альфа' }
    });
    page('gm1', { cloud });
    const panel = await cards();
    const names = [...panel.querySelectorAll('.name')].map((e) => e.textContent);
    expect(names).toEqual(['Альфа', 'Комплект Ольхи', 'Клеймо Ольхи']);
    expect(panel.querySelector('summary')?.textContent).toBe(
      'Карты · 3 карты из 100: 2 комплекта, 1 карта правил'
    );
  });

  it('makes, edits and deletes a set', async () => {
    const { cloud, container, dialog } = page();
    const panel = await cards();
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

  it('refuses an empty name and bonus, a taken name, the card limit and an http link', async () => {
    const { container } = page('gm1', { fake: { limits: { cards: 2 } } });
    const panel = await cards();
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

    await userEvent.click(screen.getByRole('button', { name: t.hbNewCard }));
    expect(screen.queryByRole('group', { name: t.hbNewSet })).not.toBeInTheDocument();
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
    const panel = await cards();
    const edits = within(panel).getAllByRole('button', { name: t.edit });
    await userEvent.click(edits[1] as HTMLElement);
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
    const panel = await cards();
    const edits = within(panel).getAllByRole('button', { name: t.edit });
    await userEvent.click(edits[1] as HTMLElement);
    const form = screen.getByRole('group', { name: 'Клеймо Ольхи' });
    await new Promise((r) => setTimeout(r, COALESCE_MS + 50));
    await cloud?.homebrew.removeCard(uuid(522));
    await userEvent.click(within(form).getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.hbCardGone)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Клеймо Ольхи' })).not.toBeInTheDocument();
  });

  it('says a lost network on a new card', async () => {
    const { cloud } = page();
    const panel = await cards();
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
    const content = {
      ...axe.content,
      set: 'hb_aldersetaaaaaaaa',
      refs: ['hb_alderrulecardaaa']
    };
    await cloud.homebrew.updateItem(axe.id, { content, book_id: axe.book_id }, null);
    const { dialog } = page('gm1', { cloud, answer: false });
    const panel = await cards();
    expect(within(panel).getByText('1 предмет · Мастерская Ольхи')).toBeInTheDocument();
    const dels = within(panel).getAllByRole('button', { name: t.del });
    await userEvent.click(dels[0] as HTMLElement);
    await userEvent.click(dels[1] as HTMLElement);
    expect(dialog.asked).toEqual([
      'Удалить комплект «Комплект Ольхи»? Он указан в 1 предмете - там пропадут его название и бонус. Отменить удаление нельзя.',
      'Удалить карту правил «Клеймо Ольхи»? Она указана в 1 предмете - там она пропадёт. Отменить удаление нельзя.'
    ]);
    const edits = within(panel).getAllByRole('button', { name: t.edit });
    await userEvent.click(edits[1] as HTMLElement);
    expect(
      screen.getByText('Изменения появятся на 1 предмете и в списках, где он лежит.')
    ).toBeInTheDocument();
    cleanup();
    const off = page('gm1');
    const again = await cards();
    (off.cloud as ReturnType<typeof fakeCloud>).setOffline(true);
    const offDels = within(again).getAllByRole('button', { name: t.del });
    await userEvent.click(offDels[1] as HTMLElement);
    expect(off.dialog.asked).toEqual([
      'Удалить карту правил «Клеймо Ольхи»? Отменить удаление нельзя.'
    ]);
    expect(await screen.findByText(t.hbDeleteFailed)).toBeInTheDocument();
    expect(within(again).getByText('Клеймо Ольхи')).toBeInTheDocument();
  });

  it('deletes a rule card with its toast, the items keeping its key', async () => {
    const { cloud } = page();
    const panel = await cards();
    const dels = within(panel).getAllByRole('button', { name: t.del });
    await userEvent.click(dels[1] as HTMLElement);
    expect(await screen.findByText('Карта правил «Клеймо Ольхи» удалена')).toBeInTheDocument();
    const read = await cloud?.homebrew.load();
    expect(read?.ok && read.cards.map((c) => c.key)).toEqual(['hb_aldersetaaaaaaaa']);
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
    const cloud = fakeCloud(SEED, 'gm1');
    render(App, {
      env: fakeEnv({
        cloud,
        router: memoryRouter('#/homebrew'),
        dialog: fakeDialog(true),
        storage: memoryStorage(),
        clock: fixedClock(Date.UTC(2026, 9, 2, 12)),
        image
      })
    });
    await screen.findByText('4 предмета из 100');
    const panel = await sources();
    const buttons = within(panel).getAllByRole('button', { name: 'Скачать JSON' });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]!);
    await userEvent.click(buttons[1]!);
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
