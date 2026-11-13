/* The file row both imports share, rendered alone: the chooser, the schema link and the
   page "With AI assistants" through the language's pages directory (docs/specs/FEATURES.md,
   "Lists" and "Homebrew"). */
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ImportFileRow from './ImportFileRow.svelte';
import { dict } from '../lib/dict.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

function row(lang: 'ru' | 'en') {
  return render(ImportFileRow, {
    t: dict(lang),
    name: 'lists.json',
    schema: '/schema/import-v3.json',
    pagesDir: lang === 'ru' ? '/pages/' : '/pages/en/',
    onpick: vi.fn(),
    onread: vi.fn()
  });
}

describe('ImportFileRow', () => {
  it('draws the chooser with the format link and the AI assistants link in Russian', async () => {
    const { container } = row('ru');
    expect(screen.getByRole('button', { name: 'Выбрать файл...' })).toBeInTheDocument();
    const format = screen.getByRole('link', { name: 'Формат файла' });
    expect(format).toHaveAttribute('href', '/schema/import-v3.json');
    const ai = screen.getByRole('link', { name: 'ИИ-ассистенты' });
    expect(ai).toHaveAttribute('href', '/pages/ai.html');
    for (const a of [format, ai]) {
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener');
    }
    expect(format.closest('.links')).toBe(ai.closest('.links'));
    await expectNoA11yViolations(container);
  });

  it('opens the English page of the AI assistants in English', async () => {
    const { container } = row('en');
    expect(screen.getByRole('link', { name: 'File format' })).toHaveAttribute(
      'href',
      '/schema/import-v3.json'
    );
    expect(screen.getByRole('link', { name: 'AI assistants' })).toHaveAttribute(
      'href',
      '/pages/en/ai.html'
    );
    await expectNoA11yViolations(container);
  });
});
