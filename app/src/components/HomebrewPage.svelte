<script lang="ts">
  /* `#/homebrew`, «Мои предметы» (m02, m03 in the homebrew mocks): the count, the folds
     «Источники» and «Карты», «Новый предмет», and the own items under one heading per
     source and section. A row opens the editor; its tick feeds the frame's selection
     bar, and the strip above the rows deletes the ticked items (docs/specs/FEATURES.md,
     "Homebrew"). `PageTitle`, not `PageHead`: the page may not be pinned. */
  import BatchBar from './BatchBar.svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import HomebrewCards from './HomebrewCards.svelte';
  import HomebrewSources from './HomebrewSources.svelte';
  import Icon from './Icon.svelte';
  import LoadState from './LoadState.svelte';
  import PageTitle from './PageTitle.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import TableRows from './TableRows.svelte';
  import { HOMEBREW_HASH, homebrewItemHash } from '../lib/hash.js';
  import { groupsOf } from '../lib/homebrew.js';
  import { countOf } from '../lib/plural.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
  }

  const { app, store }: Props = $props();

  const t = $derived(app.t);
  const groups = $derived(groupsOf(store.books, store.records, app.lang, t.srcHomebrew));
  const allIds = $derived(store.records.map((r) => r.id));
  const ticked = $derived(allIds.filter((id) => app.sel.has(id)));
  const count = $derived(
    countOf(store.items.length, store.itemLimit, t.hbItemsN, app.lang, t.ofLimit)
  );
  /* A bulk delete in flight: one request per item, so 300 items take about a minute. */
  let deleting = $state<{ done: number; of: number } | null>(null);

  async function deletePicked(): Promise<void> {
    if (deleting) return;
    const rows = store.items.filter((r) => ticked.includes(r.key));
    if (!rows.length) return;
    if (!app.env.dialog.confirm(t.hbDeleteMany.replace('%n', String(rows.length)))) return;
    const n = rows.length;
    deleting = { done: 0, of: n };
    try {
      const r = await store.removeItems(rows, (done) => {
        deleting = { done, of: n };
      });
      app.clearSel();
      if (r.ok) app.say((t) => t.hbDeletedN.replace('%n', String(n)));
      else app.say((t) => t.hbDeleteFailed, { error: true });
    } finally {
      deleting = null;
    }
  }
</script>

<PageTitle title={t.myItems} sub={t.subHomebrew} />

{#if app.user === null}
  <SignInPrompt {app} lead={t.hbSignIn} after={{ hash: HOMEBREW_HASH }} />
{:else if app.user}
  {#if store.status === 'error'}
    <LoadState {t} failed text={t.hbLoadFailed} onretry={() => void store.load()} />
  {:else if store.status !== 'ready'}
    <LoadState {t} failed={false} text={t.hbLoadFailed} onretry={() => void store.load()} />
  {:else}
    <p class="note">{count}</p>
    <div class="stack">
      <HomebrewSources {app} {store} />
      <HomebrewCards {app} {store} />
      <div>
        <Button variant="primary" href={homebrewItemHash(null)} sameTab
          ><Icon name="plus" />{t.hbNewItem}</Button
        >
      </div>
      {#if !groups.length}
        <Empty>{t.hbEmpty}</Empty>
      {:else}
        <div>
          <BatchBar
            total={allIds.length}
            picked={ticked.length}
            label={t.pickAll}
            count={`${t.selected} ${String(ticked.length)}`}
            onall={() => {
              app.toggleAllIn(allIds);
            }}
          >
            {#snippet actions()}
              <Button
                size="sm"
                variant="danger"
                disabled={deleting !== null}
                onclick={() => void deletePicked()}
                >{`${t.del} (${String(ticked.length)})`}</Button
              >
            {/snippet}
          </BatchBar>
          {#if deleting}
            <p class="note progress" role="status">
              {t.hbDeletingN
                .replace('%n', String(deleting.done))
                .replace('%m', String(deleting.of))}
            </p>
          {/if}
          {#each groups as g (g.id)}
            <h2 class="hbgroup">{g.label} <span class="n">{g.items.length}</span></h2>
            {#if app.index}
              <TableRows
                entries={g.items.map((it) => ({ it }))}
                view="list"
                index={app.index}
                lang={app.lang}
                selected={(id: string) => app.sel.has(id)}
                artBroken={(id: string) => app.artBroken(id)}
                ontoggle={(id: string) => {
                  app.toggleSel(id);
                }}
                onartfail={(id: string) => {
                  app.markArtBroken(id);
                }}
                onopen={(it: Record_) => {
                  app.go(homebrewItemHash(it.id));
                }}
              />
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .note {
    margin: 0 0 14px;
    font-size: 14px;
    color: var(--muted);
  }

  .note.progress {
    margin: 8px 0 0;
  }

  .stack {
    display: grid;
    gap: 18px;
  }

  .hbgroup {
    margin: 22px 0 10px;
    font-size: 16px;
    font-weight: 650;
  }

  .hbgroup .n {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted2);
  }
</style>
