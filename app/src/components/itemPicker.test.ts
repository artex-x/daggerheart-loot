/* ItemPicker.svelte on its own: the combobox the editor's «Связи» fold draws four times.
 * The editor's own tests drive it through the form (homebrewEditor.test.ts); this file
 * proves the list, the keys, the chosen rows and the full state every caller relies on.
 * docs/specs/FEATURES.md, "Homebrew", "Relations". */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ItemPicker from './ItemPicker.svelte';
import { dict } from '../lib/dict.js';
import type { PickOption } from '../lib/homebrewForm.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const scrolled: Element[] = [];
Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
  scrolled.push(this);
});

const t = dict('ru');

const OPTIONS: PickOption[] = Array.from({ length: 12 }, (_, i) => ({
  id: 'id' + String(i),
  name: 'Мешок ' + String(i + 1),
  meta: 'Предмет · Основная книга'
}));
OPTIONS.push({ id: 'pipe', name: 'Свирель', meta: '' });

/* Renders a picker whose chosen rows follow its own picks and removals, as a caller's
   draft does. */
function picker(opts: { chosen?: string[]; max?: number; full?: string | undefined } = {}) {
  let chosen = [...(opts.chosen ?? [])];
  const rows = (): PickOption[] =>
    chosen.map((id) => OPTIONS.find((o) => o.id === id) ?? { id, name: id, meta: '' });
  const picked: string[] = [];
  const removed: string[] = [];
  const view = render(ItemPicker, {
    id: 'hb-craft',
    label: t.craftInto,
    chosen: rows(),
    max: opts.max ?? 8,
    find: (q: string) =>
      OPTIONS.filter((o) => !chosen.includes(o.id) && o.name.toLowerCase().includes(q)),
    placeholder: t.hbFindItem,
    placeholderMore: t.hbFindMore,
    full: 'full' in opts ? opts.full : t.hbPickFull.replace('%n', '8'),
    t,
    onpick: (id: string) => {
      picked.push(id);
      chosen = [...chosen, id];
      void view.rerender({ chosen: rows() });
    },
    onremove: (id: string) => {
      removed.push(id);
      chosen = chosen.filter((x) => x !== id);
      void view.rerender({ chosen: rows() });
    }
  });
  return { ...view, picked, removed };
}

const field = (): HTMLElement => screen.getByRole('combobox', { name: t.craftInto });
const status = (c: Element): Element | null => c.querySelector('.pickmsg[role="status"]');

describe('the item picker', () => {
  it('opens the list with at most 8 options and says how many more there are', async () => {
    const { container } = picker();
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    expect(field()).not.toHaveAttribute('aria-controls');
    await expectNoA11yViolations(container);
    await userEvent.type(field(), 'мешок');
    const list = screen.getByRole('listbox', { name: t.craftInto });
    expect(screen.getAllByRole('option')).toHaveLength(8);
    expect(field()).toHaveAttribute('aria-expanded', 'true');
    expect(field()).toHaveAttribute('aria-controls', list.id);
    expect(status(container)).toHaveTextContent('Ещё 4 - уточните запрос');
    await expectNoA11yViolations(container);
  });

  it('says nothing was found, and keeps an empty status line while the field has focus', async () => {
    const { container } = picker();
    await userEvent.click(field());
    expect(status(container)).toBeInTheDocument();
    expect(status(container)?.textContent).toBe('');
    await userEvent.type(field(), 'zzz');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(status(container)).toHaveTextContent(t.hbPickNone);
    await userEvent.tab();
    expect(status(container)).toBeNull();
  });

  it('moves the active option with the arrows and scrolls it into view', async () => {
    picker();
    await userEvent.type(field(), 'мешок');
    const options = screen.getAllByRole('option');
    expect(field()).toHaveAttribute('aria-activedescendant', options[0]?.id);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    scrolled.length = 0;
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(field()).toHaveAttribute('aria-activedescendant', options[2]?.id);
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(scrolled.at(-1)).toBe(options[2]);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(field()).toHaveAttribute('aria-activedescendant', options[0]?.id);
  });

  it('picks with Enter and empties the field', async () => {
    const { picked } = picker();
    await userEvent.type(field(), 'мешок');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(picked).toEqual(['id1']);
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Убрать: Мешок 2' })).toBeInTheDocument();
    expect(field()).toHaveAttribute('placeholder', t.hbFindMore);
  });

  it('picks with a click and keeps the focus in the field', async () => {
    const { picked } = picker();
    await userEvent.type(field(), 'свир');
    await userEvent.click(screen.getByRole('option', { name: 'Свирель' }));
    expect(picked).toEqual(['pipe']);
    expect(field()).toHaveFocus();
  });

  it('keeps the list open and the focus in the field on a press of the list outside an option', async () => {
    const { container } = picker();
    await userEvent.type(field(), 'мешок');
    const drop = container.querySelector('.drop');
    if (!drop) throw new Error('The list has no .drop box. Restore it in ItemPicker.svelte.');
    await userEvent.pointer({ keys: '[MouseLeft>]', target: drop });
    expect(field()).toHaveFocus();
    expect(screen.getByRole('listbox', { name: t.craftInto })).toBeInTheDocument();
    await userEvent.pointer({ keys: '[/MouseLeft]', target: drop });
    expect(field()).toHaveFocus();
  });

  it('closes on Escape and opens again on the next input', async () => {
    picker();
    await userEvent.type(field(), 'меш');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(field(), 'о');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('removes the last chosen one with Backspace in an empty field', async () => {
    const { removed } = picker({ chosen: ['id0', 'pipe'] });
    await userEvent.click(field());
    await userEvent.keyboard('{Backspace}');
    expect(removed).toEqual(['pipe']);
  });

  it('removes a chosen one with its button and focuses the field', async () => {
    const { removed } = picker({ chosen: ['id0', 'pipe'] });
    await userEvent.click(screen.getByRole('button', { name: 'Убрать: Мешок 1' }));
    expect(removed).toEqual(['id0']);
    expect(field()).toHaveFocus();
  });

  it('draws a disabled field that says it is full, or no field without that text', async () => {
    const { container } = picker({ chosen: ['id0', 'pipe'], max: 2 });
    const full = screen.getByRole('textbox', { name: t.craftInto });
    expect(full).toBeDisabled();
    expect(full).toHaveAttribute('placeholder', 'Уже 8 - больше нельзя');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
    cleanup();
    picker({ chosen: ['id0'], max: 1, full: undefined });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('focuses the last remove button when a pick fills the picker', async () => {
    picker({ chosen: ['id0'], max: 2 });
    await userEvent.type(field(), 'свир');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Убрать: Свирель' })).toHaveFocus();
  });

  it('lets Enter pass on an empty field and stops it on typed text with no option', async () => {
    picker();
    const seen: boolean[] = [];
    const listen = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') seen.push(e.defaultPrevented);
    };
    window.addEventListener('keydown', listen);
    try {
      await userEvent.click(field());
      await userEvent.keyboard('{Enter}');
      await userEvent.type(field(), 'zzz');
      await userEvent.keyboard('{Enter}');
    } finally {
      window.removeEventListener('keydown', listen);
    }
    expect(seen).toEqual([false, true]);
  });
});
