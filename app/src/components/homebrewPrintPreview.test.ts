/* The item editor's print view: the view switch, the print card in the visit's layout,
   the follow after a pause, the clip warning and the cases a draft can reach.
   docs/specs/FEATURES.md, "Homebrew" and "Print". */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dict } from '../lib/dict.js';
import { PREVIEW_FIT_MS } from '../lib/print.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import {
  AXE,
  cropFile,
  editor,
  group,
  press,
  save,
  seeded,
  stored,
  toastSays
} from '../test/homebrewEditor.js';
import { emptyRanges, fakeLayout } from '../test/layout.js';

afterEach(cleanup);
emptyRanges();
/* jsdom does not implement scrollIntoView - the preview's add-to-list menu places
   itself with it once open. */
Element.prototype.scrollIntoView = vi.fn();

const t = dict('ru');
const printView = (): Promise<void> => press(t.hbPreviewShow, t.hbPreviewPrint);
const screenView = (): Promise<void> => press(t.hbPreviewShow, t.hbPreviewScreen);
const printCard = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('.preview .pframe .pcard');
const printText = (): string => printCard()?.querySelector('.pc-text')?.textContent ?? '';
const warning = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('.hbform .fld .box.warn');
const pressed = (groupName: string, option: string): string | null =>
  within(group(groupName)).getByRole('button', { name: option }).getAttribute('aria-pressed');

describe('the view switch', () => {
  it('draws «На экране» pressed at mount, with the screen card and its pick', async () => {
    const { container } = await editor(AXE);
    expect(pressed(t.hbPreviewShow, t.hbPreviewScreen)).toBe('true');
    expect(pressed(t.hbPreviewShow, t.hbPreviewPrint)).toBe('false');
    expect(container.querySelector('.preview article.card')).not.toBeNull();
    expect(screen.getByRole('button', { name: t.addToList })).toBeInTheDocument();
    expect(printCard()).toBeNull();
    expect(screen.queryByRole('group', { name: t.printTitle })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it("draws the print card in the visit's layout with the print page's two groups and no pick", async () => {
    const { app, container } = await editor(AXE);
    await printView();
    /* gm1's Display default: black and white, compact. */
    expect(app.shownPrintBW).toBe(true);
    expect(app.shownPrintCompact).toBe(true);
    expect(pressed(t.printTitle, t.printBW)).toBe('true');
    expect(pressed(t.printSize, t.printCompact)).toBe('true');
    expect(printCard()).toHaveClass('bw');
    expect(container.querySelector('.preview .pframe')).toHaveClass('compact');
    expect(container.querySelector('.preview article.card')).toBeNull();
    expect(screen.queryByRole('button', { name: t.addToList })).toBeNull();
    expect(container.querySelector('.keepnote')).toBeNull();
    expect(printCard()?.querySelector('.pc-name')).toHaveTextContent('Топор Тлеющих Углей');
    /* The first draw takes the draft at once. */
    expect(printText()).toContain('Лезвие тлеет');
    await expectNoA11yViolations(container);
  });

  it('writes the visit pick from its switches and remounts the card on a size change', async () => {
    const { app, container } = await editor(AXE);
    await printView();
    await press(t.printTitle, t.printColor);
    expect(app.shownPrintBW).toBe(false);
    expect(printCard()).not.toHaveClass('bw');
    const before = printCard();
    await press(t.printSize, t.printStd);
    expect(app.shownPrintCompact).toBe(false);
    expect(container.querySelector('.preview .pframe')).not.toHaveClass('compact');
    expect(printCard()).not.toBe(before);
    await press(t.printTitle, t.printBW);
    expect(app.shownPrintBW).toBe(true);
    expect(printCard()).toHaveClass('bw');
  });

  it('keeps the switches in the interface language and the card in the text language', async () => {
    const { container } = await editor(AXE);
    await printView();
    await press(t.hbTextLang, 'EN');
    expect(container.querySelector('.preview')).toHaveAttribute('lang', 'en');
    expect(container.querySelector('.preview .pviews')).toHaveAttribute('lang', 'ru');
    await waitFor(() => {
      expect(printCard()?.querySelector('.pc-name')).toHaveTextContent('Ember Axe');
    });
    expect(printText()).toContain('The blade smoulders');
  });
});

describe("the print card at the column's width", () => {
  /* jsdom lays nothing out: the preview column's width is stubbed on `.pwrap`. */
  function columnOf(width: number): () => void {
    const base = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement): number {
        return this.classList.contains('pwrap') ? width : (base?.get?.call(this) as number);
      }
    });
    return () => {
      Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    };
  }
  const scaleOf = (): { cell: string; card: string } => ({
    cell:
      document
        .querySelector<HTMLElement>('.preview .pframe')
        ?.style.getPropertyValue('--pv-scale') ?? '',
    card: printCard()?.style.getPropertyValue('--pc-scale') ?? ''
  });

  it.each([
    [328, '1.97', '1.37'],
    [340, '2.04', '1.42'],
    [420, '2.52', '1.76']
  ])('draws a %i px column at %s compact and %s standard', async (width, compact, std) => {
    const restore = columnOf(width);
    try {
      const { container } = await editor(AXE);
      await printView();
      expect(scaleOf()).toEqual({ cell: compact, card: compact });
      await press(t.printSize, t.printStd);
      expect(scaleOf()).toEqual({ cell: std, card: std });
      await expectNoA11yViolations(container);
    } finally {
      restore();
    }
  });

  it('draws the card at scale 1 with no inline scale before the column has a width', async () => {
    await editor(AXE);
    await printView();
    expect(
      document
        .querySelector<HTMLElement>('.preview .pframe')
        ?.style.getPropertyValue('--pv-scale')
    ).toBe('1');
    expect(printCard()?.getAttribute('style')).toBeNull();
  });
});

describe('the follow after a pause', () => {
  it('changes the print card only once the typing has paused', async () => {
    await editor(AXE);
    await printView();
    vi.useFakeTimers();
    try {
      const desc = screen.getByLabelText(t.hbDesc);
      await fireEvent.input(desc, { target: { value: 'Первый' } });
      await fireEvent.input(desc, { target: { value: 'Второй текст' } });
      await tick();
      expect(printText()).toContain('Лезвие тлеет');
      vi.advanceTimersByTime(PREVIEW_FIT_MS - 1);
      await tick();
      expect(printText()).toContain('Лезвие тлеет');
      vi.advanceTimersByTime(1);
      await tick();
      expect(printText()).toBe('Второй текст');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('the follow of a set member', () => {
  it('fits the card of a draft in a set once per pause, not per input', async () => {
    let reads = 0;
    const restore = fakeLayout(() => {
      reads++;
      return 50;
    }, 0);
    try {
      const cloud = await seeded({ [AXE]: { set: 'ember-spark' } });
      await editor(AXE, { cloud, real: true });
      await printView();
      expect(printText()).toContain('Пылающие близнецы');
      vi.useFakeTimers();
      try {
        const desc = screen.getByLabelText(t.hbDesc);
        const before = reads;
        await fireEvent.input(desc, { target: { value: 'Первый' } });
        await fireEvent.input(desc, { target: { value: 'Второй текст' } });
        await tick();
        expect(reads).toBe(before);
        vi.advanceTimersByTime(PREVIEW_FIT_MS);
        await tick();
        expect(reads).toBeGreaterThan(before);
        expect(printText()).toContain('Второй текст');
        expect(printText()).toContain('Пылающие близнецы');
      } finally {
        vi.useRealTimers();
      }
    } finally {
      restore();
    }
  });
});

describe('the clip warning', () => {
  it('shows a warning after the counter while the card cuts off text, and blocks nothing', async () => {
    const restore = fakeLayout(() => 140, 0);
    try {
      const { cloud, container } = await editor(AXE);
      await printView();
      await fireEvent.input(screen.getByLabelText(t.hbDesc), {
        target: { value: 'Долгий текст. '.repeat(250).slice(0, 2999) + '.' }
      });
      await waitFor(() => {
        expect(warning()).toHaveTextContent(t.hbPrintClipped);
      });
      /* The box is not a live region; the form's region says it once (rule 19). */
      expect(warning()).not.toHaveAttribute('role');
      expect(document.querySelector('.hbform .said[role="status"]')).toHaveTextContent(
        t.hbPrintClipped
      );
      expect(screen.queryByRole('alert')).toBeNull();
      const counter = container.querySelector('.fld .counter');
      expect(counter).toHaveTextContent('3000 / 3000');
      expect(counter?.parentElement).toBe(warning()?.parentElement);
      expect(
        (counter as Node).compareDocumentPosition(warning() as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      await expectNoA11yViolations(container);

      const button = screen.getByRole('button', { name: t.save });
      expect(button).toBeEnabled();
      await save();
      await toastSays(/^Сохранено/);
      expect(Array.from((await stored(cloud, AXE))?.rud ?? '')).toHaveLength(3000);

      await screenView();
      expect(warning()).toBeNull();
      await printView();
      await waitFor(() => {
        expect(warning()).not.toBeNull();
      });
    } finally {
      restore();
    }
  });

  it('draws no warning while the card fits', async () => {
    await editor(AXE);
    await printView();
    await tick();
    expect(printCard()).not.toBeNull();
    expect(warning()).toBeNull();
  });
});

describe('the drafts a print card draws', () => {
  it('draws «Новый предмет» for an empty new item, with no text and no warning', async () => {
    await editor(null);
    await printView();
    expect(printCard()?.querySelector('.pc-name')).toHaveTextContent(t.hbNewItem);
    expect(printText()).toBe('');
    expect(warning()).toBeNull();
  });

  it('draws a new weapon with a tier and no die', async () => {
    const { container } = await editor(null);
    await press(t.hbKind, t.fEquip);
    await press(t.tier, '2');
    await printView();
    expect(printCard()?.querySelector('.pc-strip')).not.toBeNull();
    expect(printCard()?.querySelector('.pc-die b')).toHaveTextContent('');
    await expectNoA11yViolations(container);
  });

  it('draws a chosen picture that is not saved on the colour card', async () => {
    await editor(null);
    await cropFile();
    await printView();
    await press(t.printTitle, t.printColor);
    const img = printCard()?.querySelector<HTMLImageElement>('.pc-img');
    expect(img?.src).toBe('blob:fake-2');
  }, 30_000);

  it("draws a draft's set bonus as the last text line", async () => {
    const cloud = await seeded({ [AXE]: { set: 'ember-spark' } });
    await editor(AXE, { cloud, real: true });
    await printView();
    const text = printCard()?.querySelector('.pc-text');
    expect(text?.lastElementChild?.tagName).not.toBe('TABLE');
    expect(text).toHaveTextContent(/Пылающие близнецы \(Комплект: /);
    expect(printText().indexOf('Лезвие тлеет')).toBeLessThan(
      printText().indexOf('Пылающие близнецы')
    );
    /* The set name in bold italic; the member list after it in italics only. */
    const name = text?.querySelector('b.pc-set > i');
    expect(name).toHaveTextContent(/^Пылающие близнецы$/);
    const members = name?.parentElement?.nextElementSibling;
    expect(members?.tagName).toBe('I');
    expect(members?.textContent).toMatch(/^ \(Комплект: .*\):$/);
  });
});
