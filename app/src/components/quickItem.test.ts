/* «Свой предмет» on an account list: the item first, then the entry that links it; the
 * refusals keep the text; a lost answer and a second press make one item; Enter adds and
 * Escape closes. docs/specs/FEATURES.md, "Lists". */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeEnv, fakePage, memoryRouter } from '../ports/index.js';
import type { CloudPort } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const LOOT: Loot = {
  items: {
    core_item: [
      { id: 'ci1', src: 'core', kind: 'item', roll: 1, en: 'A', ende: '', ru: 'А', rud: '' }
    ]
  },
  eq: [],
  refs: {}
};

const SHOP_ID = '00000000-0000-4000-8000-000000000101';

function openShop(options: FakeCloudOptions = {}) {
  const cloud = fakeCloud(SEED, 'gm1', options);
  const page = fakePage();
  const view = render(App, {
    env: fakeEnv({
      router: memoryRouter('#/lists/' + SHOP_ID),
      data: fakeData(LOOT),
      cloud,
      page
    })
  });
  return { ...view, cloud, page };
}

async function openPanel(): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole('button', { name: 'Свой предмет' }));
  return screen.getByRole('textbox', { name: 'Название*' });
}

/* The items the account holds with `name` in Russian. */
async function itemsNamed(cloud: CloudPort, name: string): Promise<number> {
  const read = await cloud.homebrew.load();
  return read.ok ? read.items.filter((i) => i.content.ru === name).length : -1;
}

describe('the own-item panel', () => {
  it('opens under the row with the name focused, and Escape closes it back to the row', async () => {
    const { container } = openShop();
    const toggle = await screen.findByRole('button', { name: 'Свой предмет' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const name = await openPanel();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Свой предмет в этот список' })
    ).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText(/Предмет сохранится в «Мои предметы»/)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Название*' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Свой предмет' })).toHaveFocus();
    });
    await openPanel();
    const panel = screen.getByRole('region', { name: 'Свой предмет в этот список' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Отмена' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(toggle).toHaveFocus();
    });
  });

  it('makes the item, then the entry that links it, and clears the form', async () => {
    const { cloud, page } = openShop();
    const create = vi.spyOn(cloud.homebrew, 'createItem');
    const apply = vi.spyOn(cloud.lists, 'apply');
    const name = await openPanel();
    await userEvent.type(name, 'Фляга контрабандиста');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Описание' }),
      'Двойное дно: во второй половине можно спрятать письмо.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
    expect(
      await screen.findByText('Предмет «Фляга контрабандиста» создан и добавлен в список')
    ).toBeInTheDocument();
    expect(name).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Описание' })).toHaveValue('');
    expect(name).toHaveFocus();
    expect(create).toHaveBeenCalledOnce();
    const made = create.mock.calls[0]?.[0];
    /* The toast links the new item's editor in a new tab and leaves focus in the name. */
    const edit = screen.getByRole('link', { name: 'Изменить' });
    expect(edit).toHaveAttribute('href', '#/homebrew/' + (made?.key ?? ''));
    expect(edit).toHaveAttribute('target', '_blank');
    expect(edit).toHaveAttribute('rel', 'noopener');
    expect(edit.closest('.toast')).not.toBeNull();
    expect(name).toHaveFocus();
    expect(made).toMatchObject({
      book_id: null,
      content: {
        kind: 'item',
        ru: 'Фляга контрабандиста',
        rud: 'Двойное дно: во второй половине можно спрятать письмо.'
      }
    });
    /* The row is drawn at once, from the own item. */
    expect(screen.getByRole('button', { name: /^Фляга контрабандиста/ })).toBeInTheDocument();
    page.fireHidden();
    await waitFor(() => {
      expect(apply).toHaveBeenCalled();
    });
    /* The entry never leaves before its item exists. */
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(
      apply.mock.invocationCallOrder[0] ?? 0
    );
    const read = await cloud.lists.list();
    const shop = read.ok ? read.lists.find((l) => l.id === SHOP_ID) : undefined;
    expect(shop?.list_entries.at(-1)).toMatchObject({
      item_key: made?.key,
      source: 'homebrew',
      hb_item: made?.id
    });
  });

  it('adds on Enter in the name', async () => {
    const { cloud } = openShop();
    const name = await openPanel();
    await userEvent.type(name, 'Свечной огарок{Enter}');
    expect(
      await screen.findByText('Предмет «Свечной огарок» создан и добавлен в список')
    ).toBeInTheDocument();
    expect(await itemsNamed(cloud, 'Свечной огарок')).toBe(1);
  });

  it('refuses no name under the field, and writes nothing', async () => {
    const { cloud } = openShop();
    const create = vi.spyOn(cloud.homebrew, 'createItem');
    const name = await openPanel();
    await userEvent.type(screen.getByRole('textbox', { name: 'Описание' }), 'Без имени');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
    expect(screen.getByText('Введите название.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Введите название.');
    expect(screen.getByRole('textbox', { name: 'Описание' })).not.toHaveAttribute(
      'aria-invalid'
    );
    expect(name).toHaveFocus();
    expect(create).not.toHaveBeenCalled();
    await userEvent.type(name, 'Имя');
    expect(screen.queryByText('Введите название.')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Описание' })).toHaveValue('Без имени');
  });

  it('says the item limit and keeps the text', async () => {
    openShop({ limits: { items: 4 } });
    const name = await openPanel();
    await userEvent.type(name, 'Пятый');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
    expect(
      await screen.findByText(
        'Достигнут предел своих предметов: 4. Нужно больше - напишите на daggerheart.loot@gmail.com.'
      )
    ).toBeInTheDocument();
    expect(name).toHaveValue('Пятый');
  });

  it('makes no item at a full list and says the entry limit in the panel', async () => {
    const { cloud } = openShop({ limits: { entries: 4 } });
    const create = vi.spyOn(cloud.homebrew, 'createItem');
    const name = await openPanel();
    await userEvent.type(name, 'Лишний');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
    expect(
      await screen.findByText(
        'Достигнут предел позиций в списке: 4. Нужно больше - напишите на daggerheart.loot@gmail.com.'
      )
    ).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
    expect(await itemsNamed(cloud, 'Лишний')).toBe(0);
    expect(name).toHaveValue('Лишний');
  });

  it('stops the name and the description at their caps and counts the description past 2500', async () => {
    const { container } = openShop();
    const name = await openPanel();
    const desc = screen.getByRole('textbox', { name: 'Описание' });
    expect(name).toHaveAttribute('maxlength', '120');
    expect(desc).toHaveAttribute('maxlength', '3000');
    expect(container.querySelector('.counter')).toBeNull();
    await userEvent.click(desc);
    await userEvent.paste('я'.repeat(2501));
    expect(container.querySelector('.counter')?.textContent).toBe('2501 / 3000');
  });

  it('makes one item when a lost answer is followed by a second press', async () => {
    const { cloud } = openShop();
    const real = cloud.homebrew.createItem.bind(cloud.homebrew);
    vi.spyOn(cloud.homebrew, 'createItem').mockImplementationOnce(async (row) => {
      await real(row);
      return { ok: false, error: 'network' };
    });
    const name = await openPanel();
    await userEvent.type(name, 'Потерянный ответ');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
    expect(
      await screen.findByText(
        'Не получилось создать предмет. Проверьте соединение - текст остался в форме.'
      )
    ).toBeInTheDocument();
    expect(name).toHaveValue('Потерянный ответ');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
    expect(
      await screen.findByText('Предмет «Потерянный ответ» создан и добавлен в список')
    ).toBeInTheDocument();
    expect(await itemsNamed(cloud, 'Потерянный ответ')).toBe(1);
  });

  it('says a failed load of the own items and makes nothing', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    vi.spyOn(cloud.homebrew, 'load').mockResolvedValue({ ok: false });
    const create = vi.spyOn(cloud.homebrew, 'createItem');
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists/' + SHOP_ID),
        data: fakeData(LOOT),
        cloud
      })
    });
    const name = await openPanel();
    await userEvent.type(name, 'Не вовремя');
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));
    expect(screen.getByText('Не получилось загрузить ваши предметы.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
