/* `#/homebrew` over the fake cloud: the count, the groups, the sources and sections
   with every refusal and confirm, the empty, signed-out, unconfigured and failed
   states, the batch delete and a row opening the editor.
   docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { dict } from '../lib/dict.js';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeDialog, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { CloudPort } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

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
  const view = render(App, {
    env: fakeEnv({ cloud, router, dialog, storage: memoryStorage() })
  });
  return { ...view, cloud, router, dialog };
}

const sources = async (): Promise<HTMLElement> => {
  const h = await screen.findByRole('heading', { name: t.hbSources });
  return h.closest('.panel') as HTMLElement;
};

async function typeInto(label: string, text: string): Promise<void> {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  if (text) await userEvent.type(box, text);
}

describe('#/homebrew', () => {
  it('draws the count, the sources and the items under their source and section', async () => {
    const { container } = page();
    expect(await screen.findByText('Мои предметы: 4 из 100')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: t.myItems })).toBeInTheDocument();
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(heads).toEqual([t.hbSources, 'Мастерская Ольхи · Холодное оружие 1', 'Хоумбрю 3']);
    const panel = await sources();
    expect(within(panel).getByText('Мастерская Ольхи')).toBeInTheDocument();
    expect(within(panel).getByText('1 предмет · 2 раздела')).toBeInTheDocument();
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
    await userEvent.click(within(panel).getByRole('button', { name: t.hbAdd }));
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
    await userEvent.click(within(panel).getByRole('button', { name: t.hbAdd }));
    await typeInto(t.hbNewSource, 'КУЗНЯ');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Источник «КУЗНЯ» уже есть.')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByLabelText(t.hbNewSource)).not.toBeInTheDocument();
  });

  it('says the limit and the lost network, and keeps the typed name', async () => {
    const { cloud } = page('gm2', { fake: { limits: { books: 0 } } });
    const panel = await sources();
    await userEvent.click(within(panel).getByRole('button', { name: t.hbAdd }));
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
    await userEvent.click(within(panel).getByRole('button', { name: t.hbAddSection }));
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
      'Удалить раздел «Холодное оружие»? Его 1 предмет останется в источнике без раздела.'
    );
    await waitFor(() => {
      expect(within(panel).queryByText('Холодное оружие')).not.toBeInTheDocument();
    });
    await userEvent.click(
      within(panel).getAllByRole('button', { name: t.del })[1] as HTMLElement
    );
    expect(dialog.asked.at(-1)).toBe('Удалить раздел «Пистоли»?');
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
    await userEvent.click(within(panel).getByRole('button', { name: t.hbAddSection }));
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
      'Удалить источник «Мастерская Ольхи»? Его 1 предмет останется в «Хоумбрю».'
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
    await userEvent.click(within(panel).getByRole('button', { name: t.hbAdd }));
    await typeInto(t.hbNewSource, 'Пустой');
    await userEvent.keyboard('{Enter}');
    await userEvent.click(await within(panel).findByRole('button', { name: t.del }));
    expect(dialog.asked).toEqual(['Удалить источник «Пустой»?']);
  });

  it('says a failed delete', async () => {
    const { cloud } = page();
    const panel = await sources();
    (cloud as ReturnType<typeof fakeCloud>).setOffline(true);
    await userEvent.click(within(panel).getByRole('button', { name: t.del }));
    expect(await screen.findByText(t.hbDeleteFailed)).toBeInTheDocument();
  });

  it('draws the empty page', async () => {
    const { container } = page('gm2');
    expect(await screen.findByText(t.hbEmpty)).toBeInTheDocument();
    expect(screen.getByText('Мои предметы: 0 из 100')).toBeInTheDocument();
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
    expect(await screen.findByText('Мои предметы: 4 из 100')).toBeInTheDocument();
  });

  it('deletes the ticked items after one confirm', async () => {
    const { dialog } = page();
    await screen.findByText('Мои предметы: 4 из 100');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Кольцо с гравировкой' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Настой кузнеца' }));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(dialog.asked).toEqual([
      'Удалить предметы (2)? Они пропадут и из ваших списков. Отменить нельзя.'
    ]);
    expect(await screen.findByText('Удалено предметов: 2')).toBeInTheDocument();
    expect(screen.getByText('Мои предметы: 2 из 100')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Кольцо с гравировкой' })).toBeNull();
  });

  it('ticks every item from the strip', async () => {
    page();
    await screen.findByText('Мои предметы: 4 из 100');
    await userEvent.click(screen.getByRole('checkbox', { name: t.pickAll }));
    expect(screen.getByRole('button', { name: 'Удалить (4)' })).toBeInTheDocument();
  });

  it('opens the editor from a row', async () => {
    const { router } = page();
    await screen.findByText('Мои предметы: 4 из 100');
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
    expect(await screen.findByText('Мои предметы: 4')).toBeInTheDocument();
  });
});
