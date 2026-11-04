/* The Items tab's actions in the selection bar up to 760 px (`HomebrewBulk.svelte`): the bar's
   «Ещё», the move sheet and the focus. The answers of the move and the delete run from 761 px
   in `homebrewPage.test.ts`, the same component. */
import { cleanup, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeViewport } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { page, t } from '../test/homebrewPage.js';

afterEach(cleanup);

Element.prototype.scrollIntoView = vi.fn();

const narrow = { env: { viewport: fakeViewport('narrow') } };

async function ticked(...names: string[]) {
  const view = page('gm1', narrow);
  await userEvent.click(await screen.findByRole('button', { name: t.selectMode }));
  for (const name of names) await userEvent.click(screen.getByRole('checkbox', { name }));
  return view;
}

const barMore = (): HTMLElement =>
  within(document.querySelector('.selbarwrap') as HTMLElement).getByRole('button', {
    name: t.moreMenu
  });

describe('the bar up to 760 px', () => {
  it('holds «В список», «Печать» and «Ещё», and the menu holds the rest', async () => {
    const { container } = await ticked('Настой кузнеца', 'Whispering Cap');
    const acts = [...document.querySelectorAll('.selbarwrap .selacts .btn')].map((b) =>
      b.textContent.trim()
    );
    expect(acts).toEqual([t.toList, t.print, t.moreMenu]);
    await userEvent.click(barMore());
    const menu = within(screen.getByRole('menu', { name: t.moreMenu }));
    expect(menu.getAllByRole('menuitem').map((i) => i.textContent.trim())).toEqual([
      t.copyText,
      'Переместить (2)...',
      'Скачать JSON (2)',
      'Удалить (2)'
    ]);
    expect(document.getElementById('hb-bulk')).toHaveClass('up');
    expect(menu.getByRole('separator')).toBeInTheDocument();
    expect(menu.getByRole('menuitem', { name: 'Удалить (2)' })).toHaveClass('danger');
    await expectNoA11yViolations(container);
  });

  it('opens the move sheet from the menu and returns the focus to «Ещё» on «Отмена»', async () => {
    await ticked('Настой кузнеца');
    await userEvent.click(barMore());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Переместить (1)...' }));
    const sheet = screen.getByRole('dialog', { name: 'Переместить (1)' });
    expect(within(sheet).getByLabelText(t.hbSource)).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
    await userEvent.click(within(sheet).getByRole('button', { name: t.cancel }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(barMore()).toHaveFocus();
  });

  it('returns the focus to «Ещё» after the download', async () => {
    await ticked('Настой кузнеца');
    await userEvent.click(barMore());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Скачать JSON (1)' }));
    expect(barMore()).toHaveFocus();
  });

  it('deletes from the menu after its confirm, and leaves the mode', async () => {
    const { dialog } = await ticked('Настой кузнеца');
    await userEvent.click(barMore());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Удалить (1)' }));
    expect(dialog.asked.at(-1)).toMatch(/^Удалить предмет/);
    expect(await screen.findByText('Удалено предметов: 1')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: t.selectMode })).toHaveFocus();
    });
    expect(document.querySelector('.selbarwrap')).toBeNull();
  });
});
