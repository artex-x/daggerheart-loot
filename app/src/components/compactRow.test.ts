/* CompactRow.svelte on its own: the folded row of a list up to 760 px, its meta line, its one
   line, the press that unfolds it and the quantity beside the button (docs/specs/FEATURES.md,
   "Lists"). */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CompactRow from './CompactRow.svelte';
import type { Record_ } from '../lib/types.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const rec = (over: Partial<Record_>): Record_ => ({
  id: 'ci1',
  src: 'core',
  kind: 'item',
  en: 'Premium Bedroll',
  ru: 'Спальный мешок',
  ende: 'Clear a **Stress**.',
  rud: 'Очистите **Стресс**.',
  ...over
});

const SWORD = rec({
  id: 'q1',
  en: 'Sword',
  ru: 'Меч',
  ende: '',
  rud: '',
  eq: {
    t: 'weapon',
    tier: 1,
    cls: 'phy',
    bu: 1,
    dmg: 'd6',
    dt: 'phy',
    tr: 'agility',
    rg: 'melee'
  }
});

const field = createRawSnippet(() => ({
  render: () =>
    '<input type="number" class="cqf" data-qty aria-label="Кол-во: Спальный мешок" />'
}));
const unfolded = createRawSnippet(() => ({ render: () => '<p>unfolded</p>' }));

function row(over: Record<string, unknown> = {}) {
  const props = {
    it: rec({}),
    id: 'ci1',
    no: 3,
    lang: 'ru' as const,
    artBroken: () => false,
    onartfail: vi.fn(),
    open: false,
    ontoggle: vi.fn(),
    ...over
  };
  return { ...render(CompactRow, props), props };
}

describe('the compact row', () => {
  it('draws the number, the name, the kind, no Core tag and the text with no markup', async () => {
    const { container } = row();
    const body = screen.getByRole('button', { expanded: false });
    expect(body.querySelector('.cno')).toHaveTextContent('3');
    expect(body.querySelector('.cname')).toHaveTextContent('Спальный мешок');
    expect(body.querySelector('.cmeta .badge')).toHaveTextContent('Предмет');
    expect(body.querySelector('.csrc')).toBeNull();
    expect(body.querySelector('.cfx')).toHaveTextContent(/^Очистите Стресс\.$/);
    expect(body).not.toHaveAttribute('aria-controls');
    await expectNoA11yViolations(container);
  });

  it("draws a weapon's stats as its line and another book's tag cut on one line", () => {
    row({ it: SWORD });
    expect(document.querySelector('.cfx')).toHaveTextContent('d6 физ · Вплотную');
    cleanup();
    row({ it: rec({ src: 'hnf' }) });
    expect(document.querySelector('.csrc')).toHaveTextContent('Hope & Fear');
  });

  it('draws the price in place of the source, and no line for a record with no text', () => {
    row({ it: rec({ src: 'hnf', ende: '', rud: '' }), price: '99999 зол.' });
    expect(document.querySelector('.cpr')).toHaveTextContent('99999 зол.');
    expect(document.querySelector('.csrc')).toBeNull();
    expect(document.querySelector('.cfx')).toBeNull();
  });

  it('marks a note and a GM-only entry with an icon and a hidden name', () => {
    row({ note: true, gmOnly: true });
    const marks = [...document.querySelectorAll('.cmark .vh')].map((e) => e.textContent);
    expect(marks).toEqual([', Заметка', ', Только для мастера']);
    expect(document.querySelector('.cart.gm')).toBeInTheDocument();
  });

  it('draws a row the page has not read as its key and «Предмет не загружен»', () => {
    row({ it: null, id: 'hb_goneaaaaaaaaaaaa' });
    const body = screen.getByRole('button');
    expect(body.querySelector('.cname')).toHaveTextContent('hb_goneaaaaaaaaaaaa');
    expect(body.querySelector('.cmeta')).toHaveTextContent('Предмет не загружен');
    expect(body.querySelector('.cfx')).toBeNull();
  });

  it('calls the press and draws the unfolded part with its id while open', async () => {
    const { props, container } = row({ open: true, children: unfolded });
    const body = screen.getByRole('button', { expanded: true });
    expect(body).toHaveAttribute('aria-controls', 'crow-ci1');
    expect(document.getElementById('crow-ci1')).toHaveTextContent('unfolded');
    await userEvent.click(body);
    expect(props.ontoggle).toHaveBeenCalledOnce();
    await expectNoA11yViolations(container);
  });

  it('draws the field beside the button, not inside it, and the text where no field is', async () => {
    const { container } = row({ field });
    const input = screen.getByRole('spinbutton', { name: 'Кол-во: Спальный мешок' });
    expect(input.closest('button')).toBeNull();
    expect(input.parentElement).toHaveClass('crow');
    expect(container.querySelector('.crow')).not.toHaveClass('ro');
    await expectNoA11yViolations(container);
    cleanup();
    row({ qtyText: '×2' });
    expect(document.querySelector('.cqv')).toHaveTextContent('×2');
    expect(document.querySelector('.crow')).toHaveClass('ro');
  });

  it('draws the glyph alone for a broken picture and reports a failed one', () => {
    const onartfail = vi.fn();
    row({ it: rec({ img: 'ci1.webp' }), onartfail });
    const img = document.querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    expect(onartfail).toHaveBeenCalledWith('ci1');
    cleanup();
    row({ it: rec({ img: 'ci1.webp' }), artBroken: () => true });
    expect(document.querySelector('img')).toBeNull();
  });
});
