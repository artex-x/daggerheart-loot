/* The homebrew editor cases that passed the 30 s test timeout under host load
   (2026-10-07; 5.3 s and 3.5 s on an idle host). They run in the `timed` vitest
   project, one file at a time after the parallel files (vite.config.mts), so
   another worker's load does not decide them. docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dict } from '../lib/dict.js';
import { uuid } from '../ports/fake-cloud-seed.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import {
  ALDER,
  AXE,
  editor,
  helpButton,
  openRel,
  picker,
  press,
  save,
  seeded,
  stored,
  toastSays
} from '../test/homebrewEditor.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - the preview's add-to-list menu places
   itself with it once open. */
Element.prototype.scrollIntoView = vi.fn();

const t = dict('ru');

describe('the «?» of a field', () => {
  const HELP: [string, string, string][] = [
    [t.hbSource, 'hb-book-help', t.hbSourceHelp],
    [t.hbAlt, 'hb-alt-help', t.hbAltHint],
    [t.hbLine, 'hb-line-help', t.hbLineHelp],
    [t.craftInto, 'hb-craft-help', t.hbCraftIntoHelp],
    [t.craftFrom, 'hb-craft-from-help', t.hbCraftFromHelp],
    [t.setLabel, 'hb-set-help', t.hbSetHelp],
    [t.hbRefs, 'hb-refs-help', t.hbRefsHelp]
  ];

  it('names its field, starts closed and shows its hint under the label on a press', async () => {
    const { container } = await editor(AXE);
    await openRel();
    for (const [label, id, text] of HELP) {
      const button = helpButton(label);
      const hint = document.getElementById(id);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', id);
      expect(hint).toHaveTextContent(text);
      expect(hint).not.toBeVisible();
    }
    await expectNoA11yViolations(container);
    for (const [label, id] of HELP) {
      await userEvent.click(helpButton(label));
      expect(helpButton(label)).toHaveAttribute('aria-expanded', 'true');
      expect(document.getElementById(id)).toBeVisible();
    }
    await expectNoA11yViolations(container);
  });
});

describe('the fold «Связи»', () => {
  it('picks and removes in every picker, picks a set, and cancels the inline forms', async () => {
    const cloud = await seeded({});
    await cloud.homebrew.createCard({
      id: uuid(7050),
      key: 'hb_forgerulecardaaa',
      kind: 'ref',
      book_id: ALDER,
      content: { ru: 'Клеймо кузни', rusub: 'Черта' }
    });
    const { container } = await editor(AXE, { cloud, real: true });
    await openRel();
    await press(t.hbLine, t.hbLineIn);
    await userEvent.type(picker(t.hbLinePick), 'Палаш');
    await userEvent.keyboard('{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Убрать: Палаш' }));
    expect(picker(t.hbLinePick)).toHaveFocus();
    await press(t.hbLine, t.hbLineUnique);
    for (const [label, query, name] of [
      [t.craftInto, 'Первоклассный Спальный', 'Первоклассный Спальный Мешок'],
      [t.craftFrom, 'Пронзительная', 'Пронзительная Свирель']
    ] as const) {
      await userEvent.type(picker(label), query);
      await userEvent.click(screen.getByRole('option', { name: new RegExp('^' + name) }));
      await userEvent.click(screen.getByRole('button', { name: 'Убрать: ' + name }));
    }
    await userEvent.type(picker(t.hbRefs), 'клеймо');
    expect(screen.getByRole('option', { name: /^Клеймо кузни/ })).toBeInTheDocument();
    expect(screen.getByText('Черта · Мастерская Ольхи (HB)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: /^Клеймо Ольхи/ }));
    await userEvent.type(picker(t.hbRefs), 'медл');
    await userEvent.keyboard('{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Убрать: Медленный' }));
    await userEvent.selectOptions(screen.getByLabelText(t.setLabel), 'ember-spark');
    await userEvent.selectOptions(screen.getByLabelText(t.setLabel), '__new');
    await userEvent.click(
      within(screen.getByRole('group', { name: t.hbNewSet })).getByRole('button', {
        name: t.cancel
      })
    );
    await waitFor(() => {
      expect(screen.getByLabelText(t.setLabel)).toHaveFocus();
    });
    expect(screen.getByLabelText(t.setLabel)).toHaveValue('ember-spark');
    await userEvent.click(screen.getByRole('button', { name: t.hbNewCard }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: t.hbNewCard })).toBeNull();
    await expectNoA11yViolations(container);
    await save();
    await toastSays(/^Сохранено/);
    const c = await stored(cloud, AXE);
    expect([c?.craft, c?.craft_from, c?.eq?.line]).toEqual([undefined, undefined, undefined]);
    expect([c?.set, c?.refs]).toEqual(['ember-spark', ['hb_alderrulecardaaa']]);
  });
});
