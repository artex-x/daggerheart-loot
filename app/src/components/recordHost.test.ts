/* RecordHost.svelte on its own: the modal closes when the page's index loses the record it
 * held at the open (a save that moved its row's key, a GM's removal of the row), and stays
 * for a record the index did not hold, or with no index (docs/specs/FEATURES.md, "Records").
 * The index's `byId` is a SvelteMap here, so a removal reaches the host as a page's new index
 * does; a `rerender` would replace every prop and re-run the navigation effect. The pages
 * hold the end-to-end cases: pickRow.test.ts (a save from a list row) and
 * sharedListPage.test.ts (a removed row). */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, flushSync } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { afterEach, describe, expect, it } from 'vitest';
import RecordHost from './RecordHost.svelte';
import { buildIndex, type Index, type Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';
import { fakeEnv } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'ci1',
        src: 'core',
        kind: 'item',
        en: 'Rope',
        ende: '',
        ru: 'Верёвка',
        rud: '',
        roll: 1
      },
      {
        id: 'ci2',
        src: 'core',
        kind: 'item',
        en: 'Lamp',
        ende: '',
        ru: 'Лампа',
        rud: '',
        roll: 2
      }
    ]
  }
};
const catalog = buildIndex(LOOT);
const rope = catalog.byId.get('ci1') as Record_;
const stranger: Record_ = { ...rope, id: 'hb_strangerropeaaaa' };

/* An index whose records a test can remove, and the page: one button that opens `r`. */
const live = (): { index: Index; byId: SvelteMap<string, Record_> } => {
  const byId = new SvelteMap(catalog.byId);
  return { index: { ...catalog, byId }, byId };
};
const opener = (r: Record_) =>
  createRawSnippet((openRecord: () => (r: Record_) => void) => ({
    render: () => '<button type="button">Открыть</button>',
    setup: (el: Element) => {
      el.addEventListener('click', () => {
        openRecord()(r);
      });
    }
  }));

function host(index: Index | null, r: Record_ = rope) {
  return render(RecordHost, { app: new AppState(fakeEnv()), index, children: opener(r) });
}

describe('the record modal of a page', () => {
  it('closes when the index no longer holds the record it held at the open', async () => {
    const { index, byId } = live();
    const view = host(index);
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await expectNoA11yViolations(view.container);
    flushSync(() => byId.delete('ci2'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    flushSync(() => byId.delete('ci1'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays open for a record the index did not hold at the open', async () => {
    const { index, byId } = live();
    host(index, stranger);
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    flushSync(() => byId.delete('ci2'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('draws no modal and closes nothing with no index', async () => {
    const view = host(null);
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await expectNoA11yViolations(view.container);
  });
});
