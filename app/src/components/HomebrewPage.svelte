<script lang="ts">
  /* `#/homebrew`, «Мои предметы»: the list head of the catalog, then one of four tabs at its
     own address. Up to 760 px the name is read, not drawn, and the row holds the tab picker,
     the primary and «Ещё»; from 761 px the head holds the pin, the tab links and the primary.
     The Items tab: the search and the filter from the eighth item or a value in force (the
     picked values are the address `#/homebrew/f_...`), «Выбрать», and the own items under one
     heading per source and section. A row opens the editor; in the selection mode its tick
     feeds the one bar, which carries the move, the download and the delete
     (`HomebrewBulk.svelte`; docs/specs/FEATURES.md, "Homebrew"). The import loads as a lazy
     chunk on its first open and stays open across a tab press. */
  import { onDestroy, tick, untrack } from 'svelte';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import FilterPanel from './FilterPanel.svelte';
  import HomebrewCards from './HomebrewCards.svelte';
  import HomebrewSources from './HomebrewSources.svelte';
  import HomebrewTabs from './HomebrewTabs.svelte';
  import Icon from './Icon.svelte';
  import LoadState from './LoadState.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import PageHead from './PageHead.svelte';
  import PageTitle from './PageTitle.svelte';
  import Panel from './Panel.svelte';
  import PinItem from './PinItem.svelte';
  import SearchBox from './SearchBox.svelte';
  import SelMode from './SelMode.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import TableRows from './TableRows.svelte';
  import type HomebrewImport from './HomebrewImport.svelte';
  import { plainFacets } from '../lib/data.js';
  import { homebrewFacetRows, narrowRows } from '../lib/facets.js';
  import {
    chosenCount,
    chosenLabels,
    encodeFilter,
    groupsFor,
    inForceOf,
    passes,
    toggledFilter,
    type FilterState
  } from '../lib/filters.js';
  import {
    HOMEBREW_HASH,
    homebrewItemHash,
    homebrewTabHash,
    type HomebrewTab
  } from '../lib/hash.js';
  import { groupsOf } from '../lib/homebrew.js';
  import { matchRecords } from '../lib/homebrewForm.js';
  import { LIST_SEARCH_AT } from '../lib/lists.js';
  import { countOf } from '../lib/plural.js';
  import { hiddenTags } from '../lib/rowTags.js';
  import { parseQuery } from '../lib/search.js';
  import type { Record_ } from '../lib/types.js';
  import type { Band } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    tab: HomebrewTab;
    /** The card the address opens on the Sets or Rules tab. */
    openKey: string | null;
  }

  const { app, store, tab, openKey }: Props = $props();

  const t = $derived(app.t);
  const band = $derived(app.band);
  const ready = $derived(!!app.user && store.status === 'ready');

  /* The Items tab's filter: the picked values are the address (`#/homebrew/f_...`); the
     query and the sheet are page memory, empty each time the tab opens. A segment this page
     did not write (a filter address, Back, «Предметы» pressed) opens the sheet, as on the
     tables and shared pages (docs/specs/ROUTES.md, "Homebrew"; docs/specs/STATE.md). */
  const HB_GROUPS = groupsFor('homebrew');
  let findQ = $state('');
  let filterOpen = $state(false);
  let seenSeg = $state('');
  /* Whether the search box and the filter are drawn: from the eighth item or a value in
     force, latched until the tab is left, so dropping the last value never removes the
     control that has the focus. */
  let finding = $state(false);
  const picked = $derived<FilterState>(app.route.kind === 'homebrew' ? app.route.filter : {});
  $effect(() => {
    const route = app.route;
    const on = tab;
    untrack(() => {
      if (on !== 'items') {
        findQ = '';
        filterOpen = false;
        seenSeg = '';
        finding = false;
        return;
      }
      const seg = route.kind === 'homebrew' ? encodeFilter(route.filter, HB_GROUPS) : '';
      if (seg !== seenSeg) filterOpen = true;
      seenSeg = seg;
    });
  });
  const found = $derived(finding ? matchRecords(store.records, findQ) : store.records);
  const facetOf = (it: Record_, g: string): string => plainFacets(it)[g] ?? '';
  const facRows = $derived(
    narrowRows(
      homebrewFacetRows(found, t, app.lang, picked['src'] ?? []),
      found,
      facetOf,
      picked
    )
  );
  /* A picked value no row offers is not in force: a re-read that drops a source or a
     section, or a source pick that leaves another source's section. */
  const inForce = $derived(inForceOf(facRows, picked));
  const drawn = $derived(
    found.filter((it) => passes(inForce, HB_GROUPS, (g) => facetOf(it, g)))
  );
  $effect(() => {
    if (
      tab === 'items' &&
      !finding &&
      (store.records.length >= LIST_SEARCH_AT || chosenCount(inForce, HB_GROUPS) > 0)
    )
      finding = true;
  });

  /** Writes a filter into the address, marked as this page's own edit. */
  function applyFilter(next: FilterState): void {
    seenSeg = encodeFilter(next, HB_GROUPS);
    app.replace(homebrewTabHash('items', null, next));
  }

  function pickFacet(group: string, value: string): void {
    applyFilter(toggledFilter(facRows, inForce, group, value));
  }

  /* Rule 20: the empty state's «Сбросить фильтры» goes with the empty state; the focus goes to
     the first «Все» of the column, or to «Фильтры», else `#main`. */
  let filterToggle = $state<HTMLButtonElement | undefined>(undefined);
  function focusFilters(): void {
    const first = document.querySelector<HTMLElement>('.fcol .frow .chip');
    (
      first ?? (filterToggle?.isConnected ? filterToggle : document.getElementById('main'))
    )?.focus();
  }

  async function resetFromEmpty(): Promise<void> {
    applyFilter({});
    await tick();
    focusFilters();
  }

  /* A band change takes the sheet away with no `close` event. */
  let seenBand: Band | null = null;
  $effect.pre(() => {
    const now = band;
    untrack(() => {
      const moved = seenBand !== null && seenBand !== now;
      seenBand = now;
      if (!moved || now !== 'wide' || !filterOpen) return;
      filterOpen = false;
      void tick().then(() => {
        if (document.activeElement === document.body) focusFilters();
      });
    });
  });

  const groups = $derived(groupsOf(store.books, drawn, app.lang, t.srcHomebrew));
  const drawnIds = $derived(drawn.map((r) => r.id));
  /* Under a filter of one source the head names the section alone: the filter says the source. */
  const shownBook = $derived.by(() => {
    const src = inForce['src'];
    if (src?.length !== 1) return null;
    const content = store.books.find((b) => b.key === src[0])?.content;
    if (!content) return null;
    return app.lang === 'ru' ? content.ru || content.en : content.en || content.ru;
  });
  const groupLabel = (label: string): string =>
    shownBook && label.startsWith(`${shownBook} · `)
      ? label.slice(shownBook.length + 3)
      : label;

  /* A tick the search or the filter hides is dropped, so the bar never acts on a row out of
     sight. The other tabs keep the ticks (docs/specs/STATE.md, the UI row). */
  $effect(() => {
    if (tab !== 'items') return;
    const shown = new Set(drawnIds);
    untrack(() => {
      for (const id of [...app.sel]) {
        if (store.has(id) && !shown.has(id)) {
          app.sel.delete(id);
          app.picked.delete(id);
        }
      }
    });
  });

  /* Ticks that arrive with the tab open the mode; a tab without rows leaves an empty one. */
  $effect(() => {
    const on = tab === 'items';
    const n = app.sel.size;
    untrack(() => {
      if (on && n > 0) app.selecting = true;
      else if (!on && n === 0) app.selecting = false;
    });
  });

  /* «Выбрать» opens the selection mode; the focus moves to the bar's «Все». */
  async function startSelecting(): Promise<void> {
    app.selecting = true;
    await tick();
    document.querySelector<HTMLElement>('.selbarwrap .selall input')?.focus();
  }

  $effect(() => {
    const ids = tab === 'items' ? drawnIds : [];
    untrack(() => {
      app.setSelectable(ids);
    });
  });
  onDestroy(() => {
    app.setSelectable([]);
  });

  const count = $derived(
    countOf(store.items.length, store.itemLimit, t.hbItemsN, app.lang, t.ofLimit)
  );
  const atLimit = $derived(store.itemLimit !== null && store.items.length >= store.itemLimit);
  const counts = $derived<Record<HomebrewTab, number>>({
    items: store.items.length,
    sources: store.books.length,
    sets: store.cards.filter((c) => c.kind === 'set').length,
    rules: store.cards.filter((c) => c.kind === 'ref').length
  });

  /* The count line while a filter or a query narrows the list, and the empty state's cause. */
  const terms = $derived(parseQuery(findQ));
  const chosen = $derived(chosenLabels(facRows, inForce));
  const narrowed = $derived(chosen.length > 0 || terms.length > 0);
  const values = $derived(chosen.map((c) => c.label).join(', '));
  const shownText = $derived(
    t.shownOf.replace('%n', String(drawn.length)).replace('%m', String(store.records.length))
  );
  const emptyCause = $derived.by(() => {
    const fill = (s: string): string =>
      s.replace(/%[qv]/g, (m) => (m === '%q' ? findQ.trim() : values));
    if (chosen.length) return fill(terms.length ? t.emptyBoth : t.emptyFilters);
    return terms.length ? fill(t.emptyQuery) : '';
  });
  const hide = $derived(hiddenTags('homebrew', inForce, false));

  /* «Импорт из файла»: the toggle, and the panel's component once its chunk loaded. */
  type ImportView = typeof HomebrewImport;
  let importing = $state(false);
  let importSending = $state(false);
  let importView = $state<ImportView | null>(null);
  let importFailed = $state(false);
  let importButton = $state<HTMLButtonElement | undefined>(undefined);
  /* What opened the panel: up to 760 px «Ещё», which has the focus back by then. */
  let importOpener: HTMLElement | null = null;

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
    importOpener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    importing = true;
    if (!importView) void loadImport();
  }

  /* Focus goes back to the toggle of the tab in view, else to what opened the panel. */
  async function closeImport(): Promise<void> {
    importing = false;
    await tick();
    (
      [importButton, importOpener].find((e) => e?.isConnected) ??
      document.getElementById('main')
    )?.focus();
  }
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet newItem(plus: boolean)}
  <Button
    variant="primary"
    size={plus ? 'md' : 'sm'}
    href={app.href(homebrewItemHash(null))}
    sameTab
    >{#if plus}<Icon name="plus" />{/if}{t.hbNewItem}</Button
  >
{/snippet}

{#snippet tabs()}
  <HomebrewTabs {app} {tab} {counts} limitText={count} />
{/snippet}

<!-- The head's primary from 761 px, on the Items tab only: on the Sources, Sets and Rules tabs
     the first button under the head is the tab's own, whose form opens in its place. From
     1000 px those tabs keep its place hidden, so the pills wrap at one width on every tab
     (DESIGN.md, "The Head Order Rule"). -->
{#snippet headNew()}
  {#if tab === 'items'}
    <span class="headnew">{@render newItem(true)}</span>
  {:else}
    <span class="headnew reserve" aria-hidden="true" inert>{@render newItem(true)}</span>
  {/if}
{/snippet}

{#snippet importToggle()}
  <Button
    size="sm"
    caret
    on={importing}
    expanded={importing}
    disabled={importSending}
    bind:el={importButton}
    onclick={toggleImport}><Icon name="upload" />{t.importOpen}</Button
  >
{/snippet}

{#if band === 'narrow' && ready}
  <h1 class="vh">{t.myItems}</h1>
  <p class="vh">{t.subHomebrew}</p>
  <div class="pickrow">
    {@render tabs()}
    {#if tab === 'items'}{@render newItem(false)}{/if}
    <MoreMenu {app} id="hb-more" size="sm">
      {#snippet children(close: () => void)}
        <button
          type="button"
          role="menuitem"
          tabindex="-1"
          disabled={importSending}
          onclick={() => {
            close();
            toggleImport();
          }}><Icon name="upload" />{t.importOpen}</button
        >
        <PinItem {app} home={HOMEBREW_HASH} onpicked={close} />
      {/snippet}
    </MoreMenu>
  </div>
{:else if band === 'narrow'}
  <PageTitle title={t.myItems} />
{:else}
  <PageHead
    {app}
    title={t.myItems}
    sub={t.subHomebrew}
    help={null}
    home={HOMEBREW_HASH}
    pin={ready}
    nav={ready ? tabs : undefined}
    navBelow={band === 'mid'}
    extra={ready && (tab === 'items' || band === 'wide') ? headNew : undefined}
  />
{/if}

{#if app.user === null}
  <SignInPrompt {app} lead={t.hbSignIn} after={{ hash: app.hash }} />
{:else if app.user}
  {#if store.status === 'error'}
    <LoadState {t} failed text={t.hbLoadFailed} onretry={() => void store.load()} />
  {:else if store.status !== 'ready'}
    <LoadState {t} failed={false} text={t.hbLoadFailed} onretry={() => void store.load()} />
  {:else}
    <div class="stack">
      {#if importing}
        <Panel>
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
      {#if tab === 'sources'}
        <HomebrewSources {app} {store} tools={band === 'narrow' ? undefined : importToggle} />
      {:else if tab === 'sets'}
        <HomebrewCards
          {app}
          {store}
          kind="set"
          {openKey}
          tools={band === 'narrow' ? undefined : importToggle}
        />
      {:else if tab === 'rules'}
        <HomebrewCards
          {app}
          {store}
          kind="ref"
          {openKey}
          tools={band === 'narrow' ? undefined : importToggle}
        />
      {:else}
        <div>
          {#if finding || store.records.length || band !== 'narrow'}
            <div class="tools">
              {#if finding}
                <div class="grow">
                  <SearchBox
                    value={findQ}
                    placeholder={t.searchShort}
                    label={t.hbFindOwn}
                    oninput={(v: string) => {
                      findQ = v;
                    }}
                  />
                </div>
                {#if band !== 'wide' && facRows.length}
                  <Button
                    size="sm"
                    variant={chosen.length ? 'toggle' : 'plain'}
                    expanded={filterOpen}
                    bind:el={filterToggle}
                    onclick={() => {
                      filterOpen = true;
                    }}
                    >{chosen.length
                      ? t.filtersN.replace('%n', String(chosen.length))
                      : t.filters}</Button
                  >
                {/if}
              {/if}
              {#if band !== 'narrow'}
                {#if store.records.length}
                  <span class="count" class:over={atLimit}>{count}</span>
                  {#if narrowed}<span class="count">{shownText}</span>{/if}
                {/if}
                <span class="end">{@render importToggle()}</span>
              {/if}
              {#if !app.selecting && drawnIds.length > 0}
                <SelMode
                  label={t.selectMode}
                  onclick={() => {
                    void startSelecting();
                  }}
                />
              {/if}
            </div>
          {/if}
          {#if band === 'narrow' && narrowed}
            <p class="countline">
              <span class="vals">{values}</span><span class="n">{shownText}</span>
            </p>
          {/if}
          {#if band === 'narrow' && atLimit}
            <p class="countline over">{count}</p>
          {/if}
          <div class="body" class:withcol={band === 'wide' && finding && facRows.length > 0}>
            {#if finding && facRows.length}
              <FilterPanel
                {app}
                rows={facRows}
                picked={inForce}
                shown={drawn.length}
                {band}
                open={filterOpen}
                onclose={() => {
                  filterOpen = false;
                  filterToggle?.focus();
                }}
                onpick={pickFacet}
                onclear={(group: string) => {
                  applyFilter({ ...inForce, [group]: [] });
                }}
                onreset={() => {
                  applyFilter({});
                }}
              />
            {/if}
            <!-- The first group head is where the list starts (DESIGN.md, "The First-Screen
                 Rule"). -->
            <div class="hbrows" data-primary>
              {#if !store.records.length}
                <Empty title={t.hbEmptyTitle} glyph="kindItem">{t.hbEmpty}</Empty>
              {:else if !groups.length}
                <Empty title={t.nothing} glyph="kindItem">
                  {#if emptyCause}<p class="cause">{emptyCause}</p>{/if}
                  {#if chosenCount(inForce, HB_GROUPS) > 0}
                    <Button size="sm" onclick={() => void resetFromEmpty()}
                      >{t.resetFilters}</Button
                    >
                  {/if}
                </Empty>
              {:else}
                {#each groups as g (g.id)}
                  <h2 class="hbgroup">
                    {groupLabel(g.label)} <span class="n">{g.items.length}</span>
                  </h2>
                  {#if app.index}
                    <TableRows
                      entries={g.items.map((it) => ({ it }))}
                      view="list"
                      lang={app.lang}
                      ticks={app.selecting}
                      {hide}
                      {terms}
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
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  /* minmax(0, 1fr): a select's long option never widens the column past the page. */
  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    margin-top: 14px;
  }

  /* The primary ends the head row (DESIGN.md, "The Head Order Rule"). */
  .headnew {
    display: flex;
    flex: none;
    margin-left: auto;
  }

  .headnew.reserve {
    visibility: hidden;
  }

  /* Positioned: up to 760 px the row anchors the menu of «Ещё» (`MoreMenu.svelte`). */
  .pickrow {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .pickrow :global(.btn.sm) {
    flex: none;
    height: 40px;
    padding-inline: 11px;
  }

  /* The search row, as the catalog's: the search first, «Выбрать» last, one height. */
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }

  .tools :global(input[type='search']),
  .tools :global(.btn.sm) {
    height: 40px;
  }

  .grow {
    flex: 1 1 140px;
    min-width: 140px;
  }

  /* DESIGN.md "Components", "The Field Measure Rule": the next controls follow the box. */
  @media (min-width: 761px) {
    .tools .grow {
      max-width: 720px;
    }
  }

  .end {
    display: flex;
    margin-left: auto;
  }

  .grow ~ .end {
    margin-left: 0;
  }

  .count {
    font-size: var(--t-data);
    color: var(--muted);
    white-space: nowrap;
  }

  .count.over,
  .countline.over {
    color: var(--danger-text);
  }

  /* The count line: the chosen values cut to one line, the count never cut. */
  .countline {
    display: flex;
    align-items: baseline;
    margin: 6px 0 0;
    font-size: var(--t-data);
    line-height: 16px;
    color: var(--muted);
    white-space: nowrap;
  }

  .countline .vals {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .countline .n {
    flex: none;
    margin-left: auto;
    padding-left: 8px;
    font-variant-numeric: tabular-nums;
  }

  /* From 1000 px the filter column sits beside the rows. */
  .body {
    margin-top: 12px;
  }

  .body.withcol {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .hbrows {
    flex: 1;
    min-width: 0;
  }

  /* Beside the filter column the body takes the plate's gap (DESIGN.md, "Empty state"). */
  .body.withcol:has(> .hbrows > :global(.empty:first-child)) {
    margin-top: var(--gap-plate);
  }

  .body.withcol > .hbrows > :global(.empty:first-child) {
    margin-top: 0;
  }

  .cause {
    margin: 0;
    max-width: var(--measure-line);
    text-wrap: balance;
  }

  .hbgroup {
    margin: 22px 0 10px;
    font-size: var(--t-body);
    font-weight: 650;
    overflow-wrap: anywhere;
  }

  .hbgroup:first-child {
    margin-top: 0;
  }

  .hbgroup .n {
    font-size: var(--t-data);
    font-weight: 500;
    color: var(--muted2);
  }

  /* Up to 760 px the search row is one line: the search, «Фильтры», «Выбрать». */
  @media (max-width: 760px) {
    .tools {
      gap: 5px;
    }

    .tools :global(input[type='search']),
    .tools :global(.btn.sm) {
      padding: 0 9px;
    }
  }
</style>
