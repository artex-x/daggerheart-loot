/* The editor's preview index: typing the description rebuilds no index, typing the name
   does, and the card shows the typed description at once (docs/specs/FEATURES.md,
   "Homebrew", "The editor"). A file of its own, since it mocks lib/homebrew.js. */
import { cleanup, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withRecords } from '../lib/homebrew.js';
import type * as Homebrew from '../lib/homebrew.js';
import { AXE, editor } from '../test/homebrewEditor.js';

vi.mock('../lib/homebrew.js', async (importOriginal) => {
  const m = await importOriginal<typeof Homebrew>();
  return { ...m, withRecords: vi.fn(m.withRecords) };
});

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - the preview's add-to-list menu places
   itself with it once open. */
Element.prototype.scrollIntoView = vi.fn();

const calls = (): number => vi.mocked(withRecords).mock.calls.length;

describe('the preview index', () => {
  it('rebuilds on a name key and not on a description key', async () => {
    await editor(AXE);
    const desc = screen.getByRole('textbox', { name: 'Описание' });
    const before = calls();
    expect(before).toBeGreaterThan(0);
    await userEvent.click(desc);
    await userEvent.keyboard('{End}');
    await userEvent.type(desc, ' Пепел и угли раз два');
    expect(calls()).toBe(before);
    const preview = document.querySelector('.preview');
    expect(preview?.textContent).toContain('Пепел и угли раз два');
    await userEvent.type(screen.getByLabelText(/Название/), '!');
    expect(calls()).toBeGreaterThan(before);
  });
});
