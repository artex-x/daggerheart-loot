<script lang="ts">
  /* The share links of an account list, under its «Поделиться» button: a
     players' row and a GM row, both ready when the panel opens. A link is
     made on open only for an audience that never had one; a deleted link
     stays deleted until «Создать ссылку» (docs/specs/FEATURES.md, "Account
     lists"; docs/DECISIONS.md, 2026-09-25, "Share links are made when the
     Share panel opens; a deleted one stays deleted"). */
  import { onMount, tick } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Panel from './Panel.svelte';
  import { shareOf, type ShareAudience } from '../lib/cloudLists.js';
  import { shareHash } from '../lib/hash.js';
  import type { ShareRepository } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    listId: string;
  }

  const { app, listId }: Props = $props();

  const t = $derived(app.t);
  const AUDIENCES: readonly ShareAudience[] = ['player', 'gm'];

  /* A row's active link, or null when every link of its audience is deleted. */
  type Row = { id: string; token: string } | null;

  let status = $state<'loading' | 'ready' | 'error'>('loading');
  let rows = $state<Record<ShareAudience, Row>>({ player: null, gm: null });
  let busy = $state<Record<ShareAudience, boolean>>({ player: false, gm: false });
  const rowEls: Partial<Record<ShareAudience, HTMLElement>> = {};

  /* The panel is drawn only with a cloud: `ListPage` opens it on an account list. */
  const shares = (): ShareRepository | null => app.env.cloud?.shares ?? null;

  async function load(): Promise<void> {
    const repo = shares();
    status = 'loading';
    const read = repo ? await repo.list(listId) : { ok: false as const };
    if (!repo || !read.ok) {
      status = 'error';
      return;
    }
    const next: Record<ShareAudience, Row> = { player: null, gm: null };
    /* One audience after the other, so the links are made in a fixed order. */
    for (const audience of AUDIENCES) {
      const found = shareOf(read.shares, audience);
      if (found !== 'none') {
        next[audience] = found === 'stopped' ? null : found;
        continue;
      }
      const made = await repo.create(listId, audience);
      if (!made.ok) {
        status = 'error';
        return;
      }
      next[audience] = { id: made.id, token: made.token };
    }
    rows = next;
    status = 'ready';
  }

  onMount(() => {
    void load();
  });

  async function change(
    audience: ShareAudience,
    run: (
      repo: ShareRepository
    ) => Promise<{ ok: true; row: Row } | { ok: false; refused: boolean }>,
    done: string
  ): Promise<void> {
    const repo = shares();
    if (!repo || busy[audience]) return;
    busy = { ...busy, [audience]: true };
    const r = await run(repo);
    busy = { ...busy, [audience]: false };
    if (r.ok) {
      rows = { ...rows, [audience]: r.row };
      app.say(done);
      /* The pressed button is gone with the swap; the focus would fall to the page. */
      await tick();
      const at = document.activeElement;
      if (!at || at === document.body) rowEls[audience]?.querySelector('button')?.focus();
      return;
    }
    app.say(t.shareFailed, { error: true });
    if (r.refused) void load();
  }

  function remove(audience: ShareAudience, id: string): void {
    void change(
      audience,
      async (repo) => {
        const r = await repo.revoke(id);
        return r.ok ? { ok: true, row: null } : { ok: false, refused: r.error === 'refused' };
      },
      t.shareDeleted
    );
  }

  function create(audience: ShareAudience): void {
    void change(
      audience,
      async (repo) => {
        const r = await repo.create(listId, audience);
        return r.ok
          ? { ok: true, row: { id: r.id, token: r.token } }
          : { ok: false, refused: r.error === 'refused' };
      },
      t.shareCreated
    );
  }

  function copy(audience: ShareAudience, token: string): void {
    void app.copied(
      () => app.env.clipboard.writeText(app.linkTo(shareHash(token))),
      audience === 'player' ? t.playersLinkCopied : t.gmShareCopied
    );
  }
</script>

<Panel style="margin-bottom:16px">
  {#if status === 'loading'}
    <p class="state">{t.cloudLoading}</p>
  {:else if status === 'error'}
    <div class="state">
      <p>{t.shareLoadFailed}</p>
      <Button size="sm" onclick={() => void load()}>{t.retry}</Button>
    </div>
  {:else}
    {#each AUDIENCES as audience (audience)}
      {@const row = rows[audience]}
      <div class="sharerow" bind:this={rowEls[audience]}>
        <div class="who">
          <b>{audience === 'player' ? t.shareLinkPlayers : t.shareLinkGm}</b>
          {#if row}
            <a class="sharelink" href={shareHash(row.token)}>{shareHash(row.token)}</a>
          {:else}
            <span class="stopped">{t.shareStopped}</span>
          {/if}
        </div>
        <Actions>
          {#if row}
            <Button
              size="sm"
              variant="primary"
              onclick={() => {
                copy(audience, row.token);
              }}>{t.shareCopy}</Button
            >
            <Button
              size="sm"
              variant="danger"
              disabled={busy[audience]}
              onclick={() => {
                remove(audience, row.id);
              }}>{t.shareDelete}</Button
            >
          {:else}
            <Button
              size="sm"
              disabled={busy[audience]}
              onclick={() => {
                create(audience);
              }}>{t.shareCreate}</Button
            >
          {/if}
        </Actions>
      </div>
    {/each}
    <p class="hint">{t.shareHint}</p>
  {/if}
</Panel>

<style>
  .sharerow {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }

  .sharerow:first-child {
    border-top: 0;
    padding-top: 2px;
  }

  .who {
    flex: 1 1 220px;
    min-width: 0;
  }

  .who b {
    display: block;
    font-size: 14px;
  }

  .sharelink,
  .stopped {
    display: block;
    font: 12px/1.4 var(--mono);
    color: var(--muted2);
    overflow-wrap: anywhere;
  }

  .hint {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--muted);
  }

  .state {
    margin: 0;
    font-size: 13.5px;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .state p {
    margin: 0;
  }
</style>
