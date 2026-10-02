<script lang="ts">
  /* `#/homebrew`, «Мои предметы» (m02, m03, m15, m24 in the homebrew mocks): the count, the
     folds «Источники» and «Карты», «Новый предмет» and «Импорт предметов», and the own items
     under one heading per source and section. A row opens the editor; its tick feeds the
     frame's selection bar, and the strip above the rows moves, downloads and deletes the
     ticked items (docs/specs/FEATURES.md, "Homebrew"). The import loads as a lazy chunk on
     its first open. `PageTitle`, not `PageHead`: the page may not be pinned. */
  import { tick } from 'svelte';
  import BatchBar from './BatchBar.svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import HomebrewCards from './HomebrewCards.svelte';
  import HomebrewSources from './HomebrewSources.svelte';
  import Icon from './Icon.svelte';
  import LoadState from './LoadState.svelte';
  import PageTitle from './PageTitle.svelte';
  import Panel from './Panel.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import SourcePicker from './SourcePicker.svelte';
  import TableRows from './TableRows.svelte';
  import type HomebrewImport from './HomebrewImport.svelte';
  import { HOMEBREW_HASH, homebrewItemHash } from '../lib/hash.js';
  import { groupsOf, type ItemRow } from '../lib/homebrew.js';
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

  /* «Импорт предметов»: the toggle, and the panel's component once its chunk loaded. */
  type ImportView = typeof HomebrewImport;
  let importing = $state(false);
  let importSending = $state(false);
  let importView = $state<ImportView | null>(null);
  let importFailed = $state(false);
  let importRow = $state<HTMLDivElement | undefined>(undefined);

  async function loadImport(): Promise<void> {
    importFailed = false;
    const m = await import('./HomebrewImport.svelte').catch(() => null);
    if (m) importView = m.default;
    else importFailed = true;
  }

  function toggleImport(): void {
    if (importing) {
      void closeImport();
      return;
    }
    importing = true;
    if (!importView) void loadImport();
  }

  /* Focus goes back to the toggle, which stays where the panel was. */
  async function closeImport(): Promise<void> {
    importing = false;
    await tick();
    importRow?.querySelector<HTMLButtonElement>('button[aria-expanded]')?.focus();
  }

  /* «Переместить (N)»: the panel under the strip, the chosen source and section, and the
     line a `gone` answer leaves under the selects. */
  let moving = $state(false);
  let moveBook = $state('');
  let moveSection = $state('');
  let moveGone = $state<'book' | 'section' | null>(null);
  let moveSending = $state(false);

  const tickedRows = $derived(store.items.filter((r) => ticked.includes(r.key)));
  /* An item's place as the selects name it: a source id (`''` the default) and a section. */
  const placeOf = (r: ItemRow): { book: string; section: string } => {
    const book = r.book_id === null ? undefined : store.book(r.book_id);
    if (!book) return { book: '', section: '' };
    const section = r.content.section;
    const held = section !== undefined && book.content.sections?.some((s) => s.key === section);
    return { book: book.id, section: held ? section : '' };
  };
  const toMove = $derived(
    tickedRows.filter((r) => {
      const at = placeOf(r);
      return at.book !== moveBook || at.section !== (moveBook ? moveSection : '');
    })
  );

  function toggleMove(): void {
    moving = !moving;
    moveGone = null;
  }

  async function movePicked(): Promise<void> {
    if (moveSending || !toMove.length) return;
    const rows = toMove;
    const bookId = moveBook || null;
    const section = (bookId && moveSection) || null;
    moveSending = true;
    moveGone = null;
    try {
      const r = await store.moveItems(rows, bookId, section);
      if (r.ok) {
        const n = rows.length;
        app.clearSel();
        moving = false;
        app.say((t) => t.hbMovedN.replace('%n', String(n)));
      } else if (r.error === 'gone') {
        moveGone = bookId !== null && !store.book(bookId) ? 'book' : 'section';
      } else if (r.error === 'conflict') {
        app.say((t) => t.hbMoveChanged, { error: true });
      } else if (r.error === 'refused') {
        app.say((t) => t.hbMoveRefused, { error: true });
      } else if (r.error === 'limit') {
        app.say((t) => t.hbMoveRefused, { error: true });
      } else {
        app.say((t) => t.hbMoveFailed, { error: true });
      }
    } finally {
      moveSending = false;
    }
  }

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
        <div class="acts" bind:this={importRow}>
          <Button variant="primary" href={homebrewItemHash(null)} sameTab
            ><Icon name="plus" />{t.hbNewItem}</Button
          >
          <Button
            variant="ghost"
            caret
            on={importing}
            expanded={importing}
            disabled={importSending}
            onclick={toggleImport}>{t.hbImport}</Button
          >
        </div>
        {#if importing}
          <Panel style="margin-top:14px">
            {#if importView}
              {@const View = importView}
              <View
                {app}
                {store}
                bind:sending={importSending}
                onclose={() => void closeImport()}
              />
            {:else}
              <LoadState
                {t}
                failed={importFailed}
                text={t.hbImportChunkFailed}
                onretry={() => void loadImport()}
              />
            {/if}
          </Panel>
        {/if}
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
              <Button size="sm" caret on={moving} expanded={moving} onclick={toggleMove}
                >{t.hbMove.replace('%n', String(ticked.length))}</Button
              >
              <Button size="sm" onclick={() => void app.exportHomebrew({ items: ticked }, null)}
                >{`${t.exportJson} (${String(ticked.length)})`}</Button
              >
              <Button
                size="sm"
                variant="danger"
                disabled={deleting !== null}
                onclick={() => void deletePicked()}
                >{`${t.del} (${String(ticked.length)})`}</Button
              >
            {/snippet}
            {#snippet below()}
              {#if moving && ticked.length}
                <div class="move">
                  <SourcePicker
                    id="hb-move"
                    books={store.books}
                    lang={app.lang}
                    value={moveBook}
                    home={t.srcHomebrew}
                    describedby={moveGone || !toMove.length ? 'hb-move-note' : undefined}
                    onchange={(v: string) => {
                      moveBook = v;
                      moveSection = '';
                      moveGone = null;
                    }}
                    section={{
                      label: t.hbSection,
                      value: moveSection,
                      none: t.hbNoSection,
                      onchange: (k: string) => {
                        moveSection = k;
                        moveGone = null;
                      }
                    }}
                  >
                    {#snippet label()}{t.hbSource}{/snippet}
                  </SourcePicker>
                  {#if moveGone}
                    <p class="move-note err" id="hb-move-note" role="alert">
                      {moveGone === 'book' ? t.hbMoveBookGone : t.hbMoveSectionGone}
                    </p>
                  {:else if !toMove.length}
                    <p class="move-note" id="hb-move-note">{t.hbMoveHere}</p>
                  {/if}
                  <div class="move-go">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={moveSending || !toMove.length}
                      onclick={() => void movePicked()}
                      >{moveSending ? t.hbMoving : t.hbMoveGo}</Button
                    >
                  </div>
                </div>
              {/if}
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

  /* minmax(0, 1fr): a select's long option never widens the column past the page. */
  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }

  /* The move panel, off the list page's price panel (`.guess`): full width in the strip. */
  .move {
    flex: 0 0 100%;
    margin-top: 10px;
    padding: 11px 0 8px;
    border-top: 1px solid var(--line);
  }

  .move-note {
    margin: 8px 0 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--muted2);
  }

  .move-note.err {
    color: var(--danger-text);
  }

  .move-go {
    margin-top: 10px;
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
