/* The source select of the import's «Куда» rows and of the bulk move, rendered alone: the
   default source, the named sources by creation in the language on screen (the other one
   when it has none), the caller's options, the section select for a named source only, and
   each change (docs/specs/FEATURES.md, "Homebrew"). */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SourcePicker from './SourcePicker.svelte';
import type { BookRow } from '../lib/homebrew.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const book = (id: string, created: string, content: BookRow['content']): BookRow => ({
  id,
  key: 'hb_' + id.padEnd(16, 'a'),
  content,
  revision: 1,
  created_at: created,
  updated_at: created
});
const BOOKS = [
  book('b', '2026-09-02', { en: 'Forge' }),
  book('a', '2026-09-01', {
    ru: 'Мастерская',
    en: 'Workshop',
    sections: [{ key: 'hb_sectaaaaaaaaaaaa', ru: 'Пистоли' }]
  })
];
const label = (text: string) =>
  createRawSnippet(() => ({ render: () => '<span>' + text + '</span>' }));
const options = (el: HTMLElement): string[] =>
  [...el.querySelectorAll('option')].map((o) => o.textContent);

describe('SourcePicker', () => {
  it('lists the default source, then the named ones by creation, then the extra options', async () => {
    const onchange = vi.fn();
    const { container } = render(SourcePicker, {
      id: 'p',
      label: label('Куда'),
      books: BOOKS,
      lang: 'ru',
      value: '',
      home: 'В «Хоумбрю»',
      held: (name: string) => 'В «' + name + '»',
      extra: [{ value: 'custom', label: '+ Новый источник...' }],
      inline: true,
      describedby: 'note',
      onchange
    });
    const select = screen.getByLabelText('Куда');
    expect(options(select)).toEqual([
      'В «Хоумбрю»',
      'В «Мастерская»',
      'В «Forge»',
      '+ Новый источник...'
    ]);
    expect(select).toHaveAttribute('aria-describedby', 'note');
    expect(container.querySelector('.pick')).toHaveClass('inline');
    expect(screen.queryAllByRole('combobox')).toHaveLength(1);
    await userEvent.selectOptions(select, 'В «Forge»');
    expect(onchange).toHaveBeenCalledWith('b');
    await expectNoA11yViolations(container);
  });

  it('draws the section select for a named source only, in English when asked', async () => {
    const onsection = vi.fn();
    const props = {
      id: 'm',
      label: label('Source'),
      books: BOOKS,
      lang: 'en' as const,
      home: 'Homebrew',
      onchange: vi.fn(),
      section: { label: 'Section', value: '', none: 'No section', onchange: onsection }
    };
    const view = render(SourcePicker, { ...props, value: '' });
    expect(options(screen.getByLabelText('Source'))).toEqual(['Homebrew', 'Workshop', 'Forge']);
    expect(screen.queryByLabelText('Section')).toBeNull();
    await view.rerender({ ...props, value: 'a' });
    const section = screen.getByLabelText('Section');
    expect(options(section)).toEqual(['No section', 'Пистоли']);
    await userEvent.selectOptions(section, 'Пистоли');
    expect(onsection).toHaveBeenCalledWith('hb_sectaaaaaaaaaaaa');
    await expectNoA11yViolations(view.container);
  });

  it('follows every prop it is given again: books, value, language, options and section', async () => {
    const base = {
      id: 'r',
      label: label('Источник'),
      books: BOOKS,
      lang: 'ru' as const,
      value: 'a',
      home: 'Хоумбрю',
      onchange: vi.fn(),
      section: { label: 'Раздел', value: '', none: 'Без раздела', onchange: vi.fn() }
    };
    const view = render(SourcePicker, base);
    const ruOnly = book('c', '2026-09-03', { ru: 'Только по-русски' });
    /* A row the validators never let in: no name in either language draws nothing. */
    const nameless = book('d', '2026-09-04', {});
    await view.rerender({
      ...base,
      books: [...BOOKS, ruOnly, nameless],
      lang: 'en',
      value: 'c',
      held: (name: string) => '> ' + name,
      extra: [{ value: 'new', label: 'New' }],
      describedby: 'line',
      inline: true,
      section: { ...base.section, value: '' }
    });
    expect(options(screen.getByLabelText('Источник'))).toEqual([
      'Хоумбрю',
      '> Workshop',
      '> Forge',
      '> Только по-русски',
      '> ',
      'New'
    ]);
    expect(options(screen.getByLabelText('Раздел'))).toEqual(['Без раздела']);
    await view.rerender({
      ...base,
      value: 'a',
      section: { ...base.section, value: 'hb_sectaaaaaaaaaaaa' }
    });
    expect(screen.getByLabelText<HTMLSelectElement>('Раздел').value).toBe(
      'hb_sectaaaaaaaaaaaa'
    );
    await view.rerender({ ...base, value: '', section: undefined });
    expect(screen.queryByLabelText('Раздел')).toBeNull();
  });
});
