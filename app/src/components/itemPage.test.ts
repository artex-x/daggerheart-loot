/* `#/h/<uuid>` over the fake cloud: not found with no read, loading, failed with «Повторить»,
 * gone, a reader signed out and signed in, the author, the relation links, a rung that
 * opens its own page, and the sign-in's copy forgotten where no button makes it.
 * docs/specs/FEATURES.md, "Records". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import ItemPage from './ItemPage.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import type { Record_ } from '../lib/types.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');
const ROLL_B = uuid(662);
const SWORD_1 = uuid(621);

const row = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'core',
  kind: 'item',
  en: 'Thing',
  ende: '',
  ru: 'Вещь',
  rud: '',
  ...over
});

const LOOT: Loot = {
  items: { core_item: [row({ id: 'ci1', roll: 1, ru: 'Спальник', en: 'Bedroll' })] },
  eq: [
    row({
      id: 'q1',
      ru: 'Палаш',
      en: 'Broadsword',
      eq: { t: 'weapon', tier: 1, cls: 'phy', bu: 1, line: 'q1' }
    })
  ]
};

function page(hash: string, as: 'gm1' | 'gm2' | 'gm3' | null, cloud?: FakeCloud) {
  const c = cloud ?? (as === null ? fakeCloud(SEED) : fakeCloud(SEED, as));
  const router = memoryRouter(hash);
  const view = render(App, {
    env: fakeEnv({ cloud: c, router, storage: memoryStorage(), data: fakeData(LOOT) })
  });
  return { ...view, cloud: c, router };
}

const sub = (): string => document.querySelector('.page-sub')?.textContent ?? '';

describe('the item page', () => {
  it('draws not found for a malformed id, with no read', async () => {
    const cloud = fakeCloud(SEED);
    const read = vi.spyOn(cloud.lists, 'item');
    const { container } = page('#/h/not-a-uuid', null, cloud);
    expect(
      await screen.findByRole('heading', { level: 1, name: t.notFound })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.toStart })).toBeInTheDocument();
    expect(read).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
  });

  it('draws «Загружаем...» while the item reads, then the item', async () => {
    const cloud = fakeCloud(SEED);
    let answer: (() => void) | null = null;
    const real = cloud.lists.item.bind(cloud.lists);
    cloud.lists.item = (id) =>
      new Promise((resolve) => {
        answer = () => {
          void real(id).then(resolve);
        };
      });
    const { container } = page('#/h/' + ROLL_B, null, cloud);
    expect(await screen.findByText(t.cloudLoading)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await waitFor(() => {
      expect(answer).not.toBeNull();
    });
    (answer as unknown as () => void)();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Скатка следопыта' })
    ).toBeInTheDocument();
  });

  it('draws a failed read with «Повторить», which reads again', async () => {
    const cloud = fakeCloud(SEED, undefined, { offline: true });
    const { container } = page('#/h/' + ROLL_B, null, cloud);
    expect(
      await screen.findByRole('heading', { level: 1, name: t.itemFailed })
    ).toBeInTheDocument();
    expect(sub()).toBe(t.sharedFailedSub);
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: t.retry }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Скатка следопыта' })
    ).toBeInTheDocument();
  });

  it('draws not found for an id no item has, the address kept', async () => {
    const { router } = page('#/h/' + uuid(9999), null);
    expect(
      await screen.findByRole('heading', { level: 1, name: t.notFound })
    ).toBeInTheDocument();
    expect(router.hash()).toBe('#/h/' + uuid(9999));
  });

  it("draws a reader's page signed out: «Предмет другого игрока», «Сохранить себе», no print, no edit, no table link", async () => {
    const { container } = page('#/h/' + ROLL_B, null);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Скатка следопыта' })
    ).toBeInTheDocument();
    expect(sub().startsWith(t.itemFrom + ' · ')).toBe(true);
    expect(document.title).toBe('Скатка следопыта — ' + t.docTitle);
    const pick = container.querySelector('.cardpick') as HTMLElement;
    expect(within(pick).getByRole('button', { name: t.addToList })).toBeInTheDocument();
    expect(within(pick).getByRole('button', { name: t.saveItem })).toBeInTheDocument();
    expect(within(pick).getByText(t.saveItemNote)).toBeInTheDocument();
    expect(within(pick).queryByRole('link', { name: t.print })).toBeNull();
    expect(within(pick).queryByRole('link', { name: t.edit })).toBeNull();
    expect(screen.queryByRole('link', { name: t.showInTable })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws the three relation lines and the set bonus, every link an item address', async () => {
    const { container } = page('#/h/' + ROLL_B, 'gm2');
    await screen.findByRole('heading', { level: 1, name: 'Скатка следопыта' });
    const craft = container.querySelector('.craft') as HTMLElement;
    expect(craft.textContent).toContain(t.craftFrom);
    expect(craft.textContent).toContain(t.craftInto);
    expect(craft.textContent).toContain(t.setLabel);
    expect(craft.textContent).toContain('Два предмета комплекта');
    const hrefs = [...craft.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs.sort()).toEqual([661, 663, 664, 665].map((n) => '#/h/' + uuid(n)).sort());
    expect(
      within(container.querySelector('.cardpick') as HTMLElement).getByText(t.saveItemNote)
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("draws the author's page: print, edit and the table link, no «Предмет другого игрока»", async () => {
    const { container } = page('#/h/' + ROLL_B, 'gm3');
    await screen.findByRole('heading', { level: 1, name: 'Скатка следопыта' });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: t.edit })).toHaveAttribute(
        'href',
        '#/homebrew/hb_rangerrollaaaaaa'
      );
    });
    expect(sub().includes(t.itemFrom)).toBe(false);
    expect(screen.getByRole('link', { name: t.print })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.showInTable })).toHaveAttribute(
      'href',
      '#/tables/homebrew/hb_rangerrollaaaaaa'
    );
    expect(screen.queryByRole('button', { name: t.saveItem })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it("opens a rung of the author's line on its own page", async () => {
    const { router } = page('#/h/' + SWORD_1, null);
    await screen.findByRole('heading', { level: 1, name: 'Учебный палаш 1' });
    const rung = (await screen.findAllByRole('button', { name: /^Учебный палаш 2/ }))[0];
    await userEvent.click(rung as HTMLElement);
    await waitFor(() => {
      expect(router.hash()).toBe('#/h/' + uuid(622));
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Учебный палаш 2' })
    ).toBeInTheDocument();
  });
});

describe('the copy a sign-in left on the item page', () => {
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  async function mounted(hash: string, as: 'gm3' | 'gm2') {
    const app = new AppState(
      fakeEnv({
        cloud: fakeCloud(SEED, as),
        router: memoryRouter(hash),
        storage: memoryStorage(),
        data: fakeData(LOOT)
      })
    );
    app.start();
    await flush();
    app.saveItemFor = hash.slice(4);
    const id = app.route.kind === 'item' ? app.route.id : '';
    const view = render(ItemPage, { app, id });
    return { app, view };
  }

  it('is forgotten when the sign-in came back as the author', async () => {
    const { app } = await mounted('#/h/' + ROLL_B, 'gm3');
    await screen.findByRole('heading', { level: 1, name: 'Скатка следопыта' });
    await waitFor(() => {
      expect(app.saveItemFor).toBeNull();
    });
    expect(app.homebrew?.items).toHaveLength(39);
    app.stop();
  });

  it('is forgotten when the item is gone', async () => {
    const { app } = await mounted('#/h/' + uuid(9999), 'gm2');
    await screen.findByRole('heading', { level: 1, name: t.notFound });
    await waitFor(() => {
      expect(app.saveItemFor).toBeNull();
    });
    app.stop();
  });
});
