<script lang="ts">
  /* Search, `#/search`: both languages at once, over loot and gear together, in the list
     head of the catalog (docs/specs/FEATURES.md, "Tables and search"). Up to 760 px a
     visible `h1` row with «Ещё», then the search row with «Фильтры» and «Выбрать»; from
     761 px the page head, the search row and a row of kind chips. Then up to 300 rows
     ranked best first, the start state with example queries, or the nothing-found state.
     A signed-in author's own items rank with the catalog's, the catalog's record first on
     a tie, and the «Свои предметы» switch hides them for the visit. The kinds are search's
     own (`AppState.searchKinds`), apart from the roll pages'. */
  import { onDestroy, tick, untrack } from 'svelte';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Empty from './Empty.svelte';
  import FilterPanel from './FilterPanel.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import NoData from './NoData.svelte';
  import PageHead from './PageHead.svelte';
  import PinItem from './PinItem.svelte';
  import RecordHost from './RecordHost.svelte';
  import SearchBox from './SearchBox.svelte';
  import SelMode from './SelMode.svelte';
  import Switch from './Switch.svelte';
  import TableRows from './TableRows.svelte';
  import { kindOf } from '../lib/data.js';
  import type { FacetRow } from '../lib/facets.js';
  import type { FilterState } from '../lib/filters.js';
  import { kindGlyph } from '../lib/label.js';
  import { hayFor, parseQuery, rankHits, statLineFor } from '../lib/search.js';
  import { plural } from '../lib/plural.js';
  import { KINDS } from '../lib/types.js';
  import type { Dict } from '../lib/dict.js';
  import type { Kind } from '../lib/types.js';
  import type { Band } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  /* The results a page draws at most; the count line says the rest. */
  const CAP = 300;

  const KIND_LABEL: Record<Kind, keyof Dict> = {
    item: 'fItems',
    consumable: 'fCons',
    equip: 'fEquip'
  };

  const t = $derived(app.t);
  const band = $derived(app.band);
  const index = $derived(app.index);
  /* The row pool only: `RecordHost` keeps `index`. */
  const browse = $derived(app.browse);
  const own = $derived(app.homebrew?.records.length ?? 0);
  /* The catalog count stays; the own items add a sentence, whatever the switch. */
  const intro = $derived(
    own > 0 ? t.subSearch + ' ' + plural(own, t.subSearchOwn, app.lang) : t.subSearch
  );

  /* Page memory only, the same as `TablesPage`'s own `q` - `docs/specs/STATE.md` is
     explicit that what was asked on a page is not remembered. */
  let q = $state('');

  const terms = $derived(parseQuery(q));
  const statLine = $derived(statLineFor(app.lang, t));
  const hay = $derived(hayFor(statLine));
  /* Ranked once over every kind, then filtered: the rank is per record, so the order is
     the order of ranking the filtered pool, and the count line can name the whole. */
  const all = $derived(
    !browse || !terms.length ? [] : rankHits(browse.searchable, terms, statLine, hay)
  );
  const matched = $derived(all.filter((it) => app.searchKinds[kindOf(it)]));
  const found = $derived(matched.slice(0, CAP));

  const picked = $derived(KINDS.filter((k) => app.searchKinds[k]));
  const narrowed = $derived(picked.length < KINDS.length);
  const kindState = $derived<FilterState>(narrowed ? { kind: picked } : {});
  const rows = $derived<FacetRow[]>([
    {
      group: 'kind',
      label: t.kindF,
      values: KINDS.map((k) => ({ value: k, label: t[KIND_LABEL[k]] }))
    }
  ]);
  const values = $derived(narrowed ? picked.map((k) => t[KIND_LABEL[k]]).join(', ') : '');
  const countText = $derived(
    t.shownOf.replace('%n', String(found.length)).replace('%m', String(all.length))
  );

  /* The nothing-found cause names the query, the picked kinds or both. One pass with a
     function: `$&` or `%v` in a query stays text. */
  const emptyCause = $derived(
    (narrowed ? t.emptyBoth : t.emptySearch).replace(/%[qv]/g, (m) =>
      m === '%q' ? q.trim() : values
    )
  );

  /* The selection bar's «Все» ticks the rows drawn here. */
  $effect(() => {
    const ids = found.map((it) => it.id);
    untrack(() => {
      app.setSelectable(ids);
    });
  });
  onDestroy(() => {
    app.setSelectable([]);
  });

  /* Ticks that arrive with the page (a sign-in that returns with them) open the mode. */
  $effect(() => {
    if (app.sel.size > 0 && !app.selecting) {
      untrack(() => {
        app.selecting = true;
      });
    }
  });

  /* «Выбрать» opens the selection mode; the focus moves to the bar's «Все». */
  async function startSelecting(): Promise<void> {
    app.selecting = true;
    await tick();
    document.querySelector<HTMLElement>('.selbarwrap .selall input')?.focus();
  }

  /* The kind sheet up to 760 px: page memory, closed when the band leaves `narrow`. */
  let filterOpen = $state(false);
  let filterToggle = $state<HTMLButtonElement | undefined>(undefined);
  let seenBand: Band | null = null;
  $effect.pre(() => {
    const now = band;
    untrack(() => {
      const moved = seenBand !== null && seenBand !== now;
      seenBand = now;
      if (moved && now !== 'narrow') filterOpen = false;
    });
  });

  const searchBox = (): HTMLElement | null =>
    document.querySelector<HTMLElement>('.searchrow input[type="search"]');

  /* An example fills the box; the box keeps the focus. */
  async function tryExample(text: string): Promise<void> {
    q = text;
    await tick();
    searchBox()?.focus();
  }

  /* Rule 20: the plate's button leaves with the plate. After a kind reset the focus goes
     to «Фильтры» or the first kind chip; after a cleared query, to the search box. */
  async function resetFromEmpty(): Promise<void> {
    const kinds = narrowed;
    if (kinds) app.resetKinds();
    else q = '';
    await tick();
    const target = kinds
      ? ((filterToggle?.isConnected ? filterToggle : null) ??
        document.querySelector<HTMLElement>('.kindrow .chip'))
      : searchBox();
    (target ?? document.getElementById('main'))?.focus();
  }
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet ownSwitch()}
  <Switch
    label={t.ownSwitch}
    on={app.homebrewShown}
    onchange={() => {
      app.toggleHomebrew();
    }}
  />
{/snippet}

<!-- Up to 760 px its own line under the search row; from 761 px the end of the kind row. -->
{#snippet countLine()}
  {#if terms.length && (narrowed || all.length > CAP)}
    <p class="count">
      {#if values}<span class="vals">{values}</span><span>&nbsp;·&nbsp;</span>{/if}<span
        class="n">{countText}</span
      >
    </p>
  {/if}
{/snippet}

<!-- The list head (docs/specs/FEATURES.md, "Tables and search"): up to 760 px no picker
     fills the row, so the `h1` stays visible beside «Ещё». -->
{#if band === 'narrow'}
  <div class="headrow">
    <h1 class="page-h">{t.search}</h1>
    <MoreMenu {app} id="search-more" size="sm">
      {#snippet children(close)}
        <PinItem {app} onpicked={close} />
      {/snippet}
    </MoreMenu>
  </div>
  <p class="vh">{intro}</p>
{:else}
  <PageHead {app} title={t.search} sub={intro} help={null} />
{/if}

<RecordHost {app} {index}>
  {#snippet children(openRecord)}
    {#if !index}
      <NoData>{t.noData}</NoData>
    {:else}
      <div class="searchrow">
        <div class="grow">
          <SearchBox
            value={q}
            placeholder={t.searchShort}
            label={t.searchPh}
            focus
            oninput={(v: string) => {
              q = v;
            }}
          />
        </div>
        {#if band === 'narrow'}
          <Button
            size="sm"
            variant={narrowed ? 'toggle' : 'plain'}
            expanded={filterOpen}
            bind:el={filterToggle}
            onclick={() => {
              filterOpen = true;
            }}>{narrowed ? t.filtersN.replace('%n', String(picked.length)) : t.filters}</Button
          >
        {/if}
        {#if !app.selecting && found.length > 0}
          <SelMode
            label={t.selectMode}
            onclick={() => {
              void startSelecting();
            }}
          />
        {/if}
      </div>

      {#if band !== 'narrow'}
        <div class="kindhead">
          <div class="kindrow" role="group" aria-label={t.kindF}>
            <ChipRow>
              <Chip
                label={t.allShort}
                neutral
                on={!narrowed}
                onclick={() => {
                  app.resetKinds();
                }}
              />
              {#each KINDS as kind (kind)}
                <Chip
                  label={t[KIND_LABEL[kind]]}
                  filter={'kind:' + kind}
                  on={narrowed && app.searchKinds[kind]}
                  onclick={() => {
                    app.pickKind(kind);
                  }}
                />
              {/each}
            </ChipRow>
            {#if own > 0}{@render ownSwitch()}{/if}
          </div>
          {@render countLine()}
        </div>
      {:else}
        <FilterPanel
          {app}
          {rows}
          picked={kindState}
          shown={found.length}
          {band}
          open={filterOpen}
          onclose={() => {
            filterOpen = false;
            filterToggle?.focus();
          }}
          onpick={(_g: string, v: string) => {
            app.pickKind(v as Kind);
          }}
          onclear={() => {
            app.resetKinds();
          }}
          onreset={() => {
            app.resetKinds();
          }}
          own={own > 0
            ? {
                on: app.homebrewShown,
                onchange: () => {
                  app.toggleHomebrew();
                }
              }
            : undefined}
        />
        {@render countLine()}
      {/if}

      {#if !terms.length}
        <Empty title={t.searchWhat} glyph={kindGlyph('item', undefined)}>
          <p class="cause">{t.searchStartSub}</p>
          <ChipRow>
            {#each [t.searchEx1, t.searchEx2, t.searchEx3] as ex (ex)}
              <Chip label={ex} neutral on={false} onclick={() => void tryExample(ex)} />
            {/each}
          </ChipRow>
        </Empty>
      {:else if !found.length}
        <Empty title={t.nothing} glyph={kindGlyph('item', undefined)}>
          <p class="cause">{emptyCause}</p>
          <Button variant="primary" onclick={() => void resetFromEmpty()}
            >{narrowed ? t.resetFilters : t.clearSearch}</Button
          >
        </Empty>
      {:else}
        <!-- The first row is the page's primary content: no section head comes before it. -->
        <TableRows
          primary
          entries={found.map((it) => ({ it }))}
          view="list"
          lang={app.lang}
          ticks={app.selecting}
          {terms}
          numLabeled
          selected={(id: string) => app.sel.has(id)}
          artBroken={(id: string) => app.artBroken(id)}
          ontoggle={(id: string) => {
            app.toggleSel(id);
          }}
          onartfail={(id: string) => {
            app.markArtBroken(id);
          }}
          onopen={openRecord}
        />
      {/if}
    {/if}
  {/snippet}
</RecordHost>

<style>
  /* Up to 760 px: the visible `h1` and «Ещё» on one row. The row anchors the menu: up to
     760 px `MoreMenu`'s wrap is static. */
  .headrow {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  /* `PageHead`'s heading type. */
  .page-h {
    margin: 0;
    min-width: 0;
    font-size: var(--t-page);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    overflow-wrap: anywhere;
  }

  /* The search row: the box first, «Выбрать» last, every control at one height; one
     line at every width. */
  /* From 761 px the page head (its lead on two lines), this row and the kind row put the
     first result at 279.4 px of the 288 px limit at 1180x720, with a kind picked or not
     (measured 2026-11-04). */
  .searchrow {
    display: flex;
    gap: 10px;
    align-items: center;
    margin: 12px 0 6px;
  }

  .searchrow :global(input[type='search']),
  .searchrow :global(.btn.sm) {
    height: 40px;
  }

  .searchrow .grow {
    flex: 1 1 140px;
    min-width: 140px;
  }

  /* From 761 px: the kinds and the own-items switch, wrapped whole, then the count line at
     the row's end; a long count line takes its own line. */
  .kindhead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin: 0 0 4px;
  }

  .kindrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    min-width: 0;
  }

  .kindhead .count {
    margin: 0 0 0 auto;
  }

  /* The count line: the picked kinds cut to one line, the count never cut. */
  .count {
    display: flex;
    align-items: baseline;
    min-width: 0;
    max-width: 100%;
    margin: 0 0 10px;
    line-height: 16px;
    font-size: var(--t-data);
    color: var(--muted);
    white-space: nowrap;
  }

  .count .vals {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .count .n {
    flex: none;
    font-variant-numeric: tabular-nums;
  }

  .cause {
    margin: 0;
    max-width: var(--measure-line);
    text-wrap: balance;
    overflow-wrap: anywhere;
  }

  /* DESIGN.md "Components", "The Field Measure Rule": the next controls follow the box. */
  @media (min-width: 761px) {
    .searchrow .grow {
      max-width: 720px;
    }
  }

  @media (max-width: 760px) {
    .searchrow {
      margin: 0 0 8px;
      gap: 5px;
    }

    .searchrow :global(input[type='search']),
    .searchrow :global(.btn.sm) {
      padding: 0 9px;
    }
  }

  /* At 320 px «Фильтры · 1» and «Выбрать» passed the window by 36 px with the box at
     140 px (measured 2026-11-04): the insets of the selection bar's buttons, and a smaller
     box. */
  @media (max-width: 380px) {
    .searchrow {
      gap: 4px;
    }

    .searchrow :global(.btn.sm),
    .searchrow :global(button.selmode) {
      padding: 0 6px;
    }

    .searchrow .grow {
      flex-basis: 112px;
      min-width: 112px;
    }
  }
</style>
