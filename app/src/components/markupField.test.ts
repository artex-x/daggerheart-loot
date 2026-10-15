/* The formatted text box: the toolbar's names, order and one tab stop, an edit through the
 * fallback path (jsdom has no `execCommand`), the shortcuts, the cap, and «Просмотр».
 * docs/specs/FEATURES.md, "Consistency rules", rule 18. */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MarkupField from './MarkupField.svelte';
import { dict } from '../lib/dict.js';
import type { MarkupTool } from '../lib/markupEdit.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const t = dict('ru');
const ALL: readonly MarkupTool[] = ['bold', 'italic', 'ul', 'ol', 'table'];

function field(
  over: {
    value?: string;
    tools?: readonly MarkupTool[];
    preview?: boolean;
    maxlength?: number;
    oninput?: () => void;
    textLang?: 'ru' | 'en';
  } = {}
) {
  const view = render(MarkupField, {
    id: 'f',
    label: 'Описание',
    t,
    tools: over.tools ?? ALL,
    value: over.value ?? '',
    preview: over.preview ?? false,
    ...(over.maxlength === undefined ? {} : { maxlength: over.maxlength }),
    ...(over.oninput ? { oninput: over.oninput } : {}),
    ...(over.textLang ? { textLang: over.textLang } : {})
  });
  /* The caller's FormField draws the caption. */
  const caption = document.createElement('label');
  caption.htmlFor = 'f';
  caption.textContent = 'Описание';
  view.container.prepend(caption);
  const box = view.container.querySelector('textarea') as HTMLTextAreaElement;
  const bar = screen.getByRole('toolbar', { name: 'Оформление: Описание' });
  return { ...view, box, bar };
}

const select = (box: HTMLTextAreaElement, from: number, to: number): void => {
  box.focus();
  box.setSelectionRange(from, to);
};

describe('the toolbar', () => {
  it('names its buttons in order, with the shortcuts and no titles', async () => {
    const { container, bar } = field();
    const buttons = within(bar).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Жирный',
      'Курсив',
      'Список',
      'Нумерованный список',
      'Таблица'
    ]);
    expect(buttons[0]).toHaveAttribute('aria-keyshortcuts', 'Control+B Meta+B');
    expect(buttons[1]).toHaveAttribute('aria-keyshortcuts', 'Control+I Meta+I');
    expect(buttons.some((b) => b.hasAttribute('title'))).toBe(false);
    expect(within(bar).queryByRole('button', { name: t.mdPreview })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws no table button without the tool', () => {
    const { bar } = field({ tools: ['bold', 'italic', 'ul'] });
    expect(within(bar).getAllByRole('button')).toHaveLength(3);
    expect(within(bar).queryByRole('button', { name: 'Таблица' })).toBeNull();
  });

  it('holds one tab stop that the arrows, Home and End move', async () => {
    const { bar } = field({ preview: true });
    const buttons = within(bar).getAllByRole('button');
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);
    buttons[0]?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(buttons[1]).toHaveFocus();
    expect(buttons[1]?.tabIndex).toBe(0);
    expect(buttons[0]?.tabIndex).toBe(-1);
    await userEvent.keyboard('{End}');
    expect(buttons[5]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(buttons[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(buttons[5]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(buttons[0]).toHaveFocus();
  });
});

describe('an edit', () => {
  it('wraps the selection in bold on a press and fires one input', async () => {
    const oninput = vi.fn();
    const { box, bar } = field({ value: 'a long rest', oninput });
    select(box, 2, 6);
    await userEvent.click(within(bar).getByRole('button', { name: 'Жирный' }));
    expect(box).toHaveValue('a **long** rest');
    expect(oninput).toHaveBeenCalledOnce();
    expect([box.selectionStart, box.selectionEnd]).toEqual([4, 8]);
    expect(box).toHaveFocus();
  });

  it('does Bold on Ctrl+B and Italic on Cmd+I in the box', async () => {
    const { box } = field({ value: 'one two' });
    select(box, 0, 3);
    const ctrl = await fireEvent.keyDown(box, { key: 'b', ctrlKey: true });
    expect(ctrl).toBe(false);
    expect(box).toHaveValue('**one** two');
    select(box, 8, 11);
    await fireEvent.keyDown(box, { key: 'I', metaKey: true });
    expect(box).toHaveValue('**one** *two*');
  });

  it('leaves Ctrl+B to the browser on a field with no bold', async () => {
    const { box } = field({ value: 'one', tools: ['ul'] });
    select(box, 0, 3);
    expect(await fireEvent.keyDown(box, { key: 'b', ctrlKey: true })).toBe(true);
    expect(box).toHaveValue('one');
  });

  it('does nothing when the edit would pass the cap', async () => {
    const oninput = vi.fn();
    const { box, bar } = field({ value: 'abc', maxlength: 6, oninput });
    select(box, 0, 3);
    await userEvent.click(within(bar).getByRole('button', { name: 'Жирный' }));
    expect(box).toHaveValue('abc');
    expect(oninput).not.toHaveBeenCalled();
    await userEvent.click(within(bar).getByRole('button', { name: 'Курсив' }));
    expect(box).toHaveValue('*abc*');
  });

  it('prefixes lines and inserts a table with its head selected', async () => {
    const { box, bar } = field({ value: 'one\ntwo' });
    select(box, 0, 7);
    await userEvent.click(within(bar).getByRole('button', { name: 'Нумерованный список' }));
    expect(box).toHaveValue('1. one\n2. two');
    select(box, 13, 13);
    await userEvent.click(within(bar).getByRole('button', { name: 'Таблица' }));
    expect(box).toHaveValue('1. one\n2. two\n| Столбец 1 | Столбец 2 |\n|---|---|\n|  |  |');
    expect(box.value.slice(box.selectionStart, box.selectionEnd)).toBe('Столбец 1');
  });
});

describe('«Просмотр»', () => {
  it('draws the text in place of the box and returns to it with the selection', async () => {
    const { box, bar, container } = field({
      value: '**Доставка:** письмо\n- птица',
      preview: true,
      textLang: 'en'
    });
    expect(box).toHaveAttribute('lang', 'en');
    select(box, 2, 10);
    const toggle = within(bar).getByRole('button', { name: t.mdPreview });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    const pane = screen.getByRole('region', { name: 'Просмотр: Описание' });
    expect(pane).toHaveAttribute('lang', 'en');
    expect(pane.querySelector('b')?.textContent).toBe('Доставка:');
    expect(pane.querySelectorAll('li')).toHaveLength(1);
    expect(box).not.toBeVisible();
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toBeEnabled();
    expect(toggle.tabIndex).toBe(0);
    for (const name of ['Жирный', 'Курсив', 'Список', 'Нумерованный список', 'Таблица']) {
      expect(within(bar).getByRole('button', { name })).toBeDisabled();
    }
    await expectNoA11yViolations(container);
    await userEvent.click(toggle);
    expect(screen.queryByRole('region')).toBeNull();
    expect(box).toBeVisible();
    expect(box).toHaveFocus();
    expect([box.selectionStart, box.selectionEnd]).toEqual([2, 10]);
  });

  it('says there is no text yet for an empty box, in the interface language', async () => {
    const { bar } = field({ preview: true, textLang: 'en' });
    await userEvent.click(within(bar).getByRole('button', { name: t.mdPreview }));
    const pane = screen.getByRole('region', { name: 'Просмотр: Описание' });
    expect(pane).toHaveTextContent(t.mdPreviewEmpty);
    expect(pane).not.toHaveAttribute('lang');
  });
});

describe('a read-only box and the passed props', () => {
  const plain = (over: { readonly?: boolean; preview?: boolean; value?: string } = {}) =>
    render(MarkupField, {
      id: 'f',
      label: 'Описание',
      t,
      tools: ALL,
      value: over.value ?? '**a** b',
      preview: over.preview ?? true,
      readonly: over.readonly ?? true
    });

  it('draws no format buttons on a read-only box', () => {
    const { container } = plain();
    const bar = screen.getByRole('toolbar', { name: 'Оформление: Описание' });
    expect(
      within(bar)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual([t.mdPreview]);
    expect(container.querySelector('textarea')).toHaveAttribute('readonly');
  });

  it('draws no toolbar on a read-only box without «Просмотр»', () => {
    plain({ preview: false });
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('keeps «Просмотр» on a read-only box', async () => {
    const { container } = plain();
    const toggle = screen.getByRole('button', { name: t.mdPreview });
    expect(toggle.tabIndex).toBe(0);
    await userEvent.click(toggle);
    const pane = screen.getByRole('region', { name: 'Просмотр: Описание' });
    expect(pane.querySelector('b')).toHaveTextContent('a');
    await expectNoA11yViolations(container);
  });

  it('ignores the shortcuts on a read-only box', async () => {
    const { container } = plain();
    const box = container.querySelector('textarea') as HTMLTextAreaElement;
    select(box, 6, 7);
    expect(await fireEvent.keyDown(box, { key: 'b', ctrlKey: true })).toBe(true);
    expect(await fireEvent.keyDown(box, { key: 'i', ctrlKey: true })).toBe(true);
    expect(box).toHaveValue('**a** b');
  });

  it('passes the placeholder to the box', () => {
    const { container } = render(MarkupField, {
      id: 'f',
      label: 'Описание',
      t,
      tools: ALL,
      placeholder: 'Например: лавка закрыта'
    });
    expect(container.querySelector('textarea')).toHaveAttribute(
      'placeholder',
      'Например: лавка закрыта'
    );
  });

  it('passes the input event to the caller', async () => {
    const seen: (EventTarget | null)[] = [];
    const { container } = render(MarkupField, {
      id: 'f',
      label: 'Описание',
      t,
      tools: ALL,
      oninput: (e: Event) => {
        seen.push(e.currentTarget);
      }
    });
    const box = container.querySelector('textarea') as HTMLTextAreaElement;
    await userEvent.type(box, 'a');
    expect(seen).toEqual([box]);
  });
});
