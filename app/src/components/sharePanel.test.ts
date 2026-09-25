/* The share panel of an account list, through `App` on the list's page over
 * the fake cloud as gm1: both links ready on open, a link made only for an
 * audience that never had one, and a deleted link that stays deleted.
 * docs/specs/FEATURES.md, "Account lists". */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { fakeClipboard, fakeData, fakeEnv, memoryRouter } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

Element.prototype.scrollIntoView = () => {};

const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'ci1',
        src: 'core',
        kind: 'item',
        roll: 1,
        en: 'Bedroll',
        ende: '',
        ru: 'Мешок',
        rud: ''
      }
    ]
  },
  eq: [],
  refs: {}
};

const ru = dict('ru');
const SHOP = uuid(101);
const TROPHIES = uuid(103);

function openShare(
  listId: string,
  cloud: FakeCloud = fakeCloud(SEED, 'gm1'),
  over: Partial<Env> = {}
) {
  const hash = '#/lists/' + listId;
  const clipboard = fakeClipboard();
  const view = render(App, {
    env: fakeEnv({
      router: memoryRouter(hash),
      data: fakeData(LOOT),
      cloud,
      clipboard,
      ...over
    })
  });
  return { ...view, cloud, clipboard };
}

async function pressShare(): Promise<HTMLElement> {
  const button = await screen.findByRole('button', { name: ru.share });
  await userEvent.click(button);
  return button;
}

/* A row by its label, once the panel has read the links. */
async function row(label: string): Promise<HTMLElement> {
  const b = await screen.findByText(label, { selector: 'b' });
  return b.closest('.sharerow') as HTMLElement;
}

describe('the share panel', () => {
  it('shows both seed links with their buttons and makes none', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const create = vi.spyOn(cloud.shares, 'create');
    const { container } = openShare(SHOP, cloud);
    const button = await pressShare();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const players = await row(ru.shareLinkPlayers);
    expect(within(players).getByRole('link', { name: '#/s/player-token-1' })).toHaveAttribute(
      'href',
      '#/s/player-token-1'
    );
    expect(
      within(players)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual([ru.shareCopy, ru.shareDelete]);
    const gm = await row(ru.shareLinkGm);
    expect(within(gm).getByRole('link', { name: '#/s/gm-token-1' })).toBeInTheDocument();
    expect(screen.getByText(ru.shareHint)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(ru.shareHint)).not.toBeInTheDocument();
  });

  it('makes both links on open for a list that has none, players first', async () => {
    openShare(TROPHIES);
    await pressShare();
    expect(
      within(await row(ru.shareLinkPlayers)).getByRole('link', { name: '#/s/share-token-1' })
    ).toBeInTheDocument();
    expect(
      within(await row(ru.shareLinkGm)).getByRole('link', { name: '#/s/share-token-2' })
    ).toBeInTheDocument();
  });

  it('keeps a deleted link deleted on the next open, until Создать ссылку', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container } = openShare(SHOP, cloud);
    const button = await pressShare();
    await userEvent.click(
      within(await row(ru.shareLinkGm)).getByRole('button', { name: ru.shareDelete })
    );
    expect(await screen.findByText(ru.shareDeleted)).toBeInTheDocument();
    await userEvent.click(button);
    const create = vi.spyOn(cloud.shares, 'create');
    await userEvent.click(button);
    const gm = await row(ru.shareLinkGm);
    await waitFor(() => {
      expect(within(gm).getByText(ru.shareStopped)).toBeInTheDocument();
    });
    expect(
      within(gm)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual([ru.shareCreate]);
    expect(create).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
    await userEvent.click(within(gm).getByRole('button', { name: ru.shareCreate }));
    expect(
      await within(gm).findByRole('link', { name: '#/s/share-token-1' })
    ).toBeInTheDocument();
    expect(screen.getByText(ru.shareCreated)).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith(SHOP, 'gm');
  });

  it("keeps the focus in the row when a delete or a create swaps the row's buttons", async () => {
    const { container } = openShare(SHOP);
    await pressShare();
    const gm = await row(ru.shareLinkGm);
    await userEvent.click(within(gm).getByRole('button', { name: ru.shareDelete }));
    const create = await within(gm).findByRole('button', { name: ru.shareCreate });
    await waitFor(() => {
      expect(document.activeElement).toBe(create);
    });
    await userEvent.click(create);
    const copy = await within(gm).findByRole('button', { name: ru.shareCopy });
    await waitFor(() => {
      expect(document.activeElement).toBe(copy);
    });
    await expectNoA11yViolations(container);
  });

  it("copies the full address and says which link, the GM's with its warning", async () => {
    const { clipboard } = openShare(SHOP);
    await pressShare();
    await userEvent.click(
      within(await row(ru.shareLinkPlayers)).getByRole('button', { name: ru.shareCopy })
    );
    expect(clipboard.last.text).toBe('https://example.test/#/s/player-token-1');
    expect(screen.getByText(ru.playersLinkCopied)).toBeInTheDocument();
    await userEvent.click(
      within(await row(ru.shareLinkGm)).getByRole('button', { name: ru.shareCopy })
    );
    expect(clipboard.last.text).toBe('https://example.test/#/s/gm-token-1');
    expect(screen.getByText(ru.gmShareCopied)).toBeInTheDocument();
  });

  it('says a failed change offline and keeps the row', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    openShare(SHOP, cloud);
    await pressShare();
    const players = await row(ru.shareLinkPlayers);
    cloud.setOffline(true);
    await userEvent.click(within(players).getByRole('button', { name: ru.shareDelete }));
    expect(await screen.findByText(ru.shareFailed)).toBeInTheDocument();
    expect(
      within(players).getByRole('link', { name: '#/s/player-token-1' })
    ).toBeInTheDocument();
  });

  it('reloads the panel when a change is refused', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    openShare(SHOP, cloud);
    await pressShare();
    const players = await row(ru.shareLinkPlayers);
    const list = vi.spyOn(cloud.shares, 'list');
    cloud.shares.revoke = () => Promise.resolve({ ok: false, error: 'refused' });
    await userEvent.click(within(players).getByRole('button', { name: ru.shareDelete }));
    expect(await screen.findByText(ru.shareFailed)).toBeInTheDocument();
    await waitFor(() => {
      expect(list).toHaveBeenCalledOnce();
    });
  });

  it('says the links did not load when a missing link cannot be made', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.shares.create = () => Promise.resolve({ ok: false, error: 'network' });
    openShare(TROPHIES, cloud);
    await pressShare();
    expect(await screen.findByText(ru.shareLoadFailed)).toBeInTheDocument();
  });

  it('says the links did not load, and loads them on Повторить', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container } = openShare(SHOP, cloud);
    await screen.findByRole('button', { name: ru.share });
    cloud.setOffline(true);
    await pressShare();
    expect(await screen.findByText(ru.shareLoadFailed)).toBeInTheDocument();
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: ru.retry }));
    expect(await row(ru.shareLinkPlayers)).toBeInTheDocument();
  });
});
