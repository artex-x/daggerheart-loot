<script lang="ts">
  /* The catalog's two-level navigation (docs/specs/FEATURES.md, "Tables and search"):
     the group chips, then the book or section of the group as tabs. Below 761 px both
     levels are the table picker's sheet: the picker, a group, a table - three taps to
     another group's table. On `#/tables/homebrew` with two sources or more the tabs are
     the sources, folded past `CHIP_FOLD_AT` (rule 12). */
  import { tick } from 'svelte';
  import Chip from './Chip.svelte';
  import FoldButton from './FoldButton.svelte';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';
  import type { FilterState } from '../lib/filters.js';
  import { CHIP_FOLD_AT, CHIP_FOLD_SHOWN, foldRows } from '../lib/folds.js';
  import { tablesHash } from '../lib/hash.js';
  import type { SourceChip } from '../lib/homebrew.js';
  import {
    TABLE_NAV,
    navGroupOf,
    navSubLabel,
    pickerLabel,
    pickerParts,
    type TableGroup
  } from '../lib/tables.js';
  import type { TableId } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    table: TableId;
    /** The own items' sources, two or more, else none. */
    sources: readonly SourceChip[];
    /** The chosen source on `homebrew`. */
    source: string | null;
    /** The filter in force: a source tab keeps its `kind`. */
    filter: FilterState;
    /** From 761 px, which level this instance draws: the group chips (the page head's
     *  pills) or the tabs under the head. Up to 760 px the one instance is the picker. */
    part?: 'groups' | 'tabs';
  }

  const { app, table, sources, source, filter, part = 'groups' }: Props = $props();

  const t = $derived(app.t);
  const groups = $derived(TABLE_NAV.filter((g) => g.id !== 'hb' || !!app.user));
  const group = $derived(navGroupOf(table));

  /* The source tabs' fold: page memory, closed when the page mounts (rule 12). */
  let srcOpen = $state(false);
  /* The picker's sheet and the group it shows; the current group when it opens. */
  let picking = $state(false);
  let sheetGroup = $state<TableGroup | null>(null);
  const shownGroup = $derived(sheetGroup ?? group);
  let pickerButton = $state<HTMLButtonElement | undefined>(undefined);

  /* Rule 20: a pick closes the sheet with no `close` event, and the pressed link leaves
     with it, so the focus returns to the picker once the sheet is gone. */
  function picked(): void {
    picking = false;
    void tick().then(() => {
      pickerButton?.focus();
    });
  }

  const srcHref = (key: string): string =>
    app.href(
      tablesHash('homebrew', {
        filter: { ...(filter['kind'] ? { kind: filter['kind'] } : {}), src: [key] }
      })
    );

  /* The captions of a group's tabs, or none: what the unseen copies in the tab slot draw.
     The homebrew group has none: its source tabs hold the GM's own text, up to 12 names of
     80 characters, and would push the rows of every table (DESIGN.md, "The Head Order Rule"). */
  function tabLabels(g: TableGroup): string[] {
    return g.id !== 'hb' && g.subs.length > 1 ? g.subs.map((sub) => t[navSubLabel(sub)]) : [];
  }

  const picker = $derived(pickerLabel(table, t));
  const parts = $derived(pickerParts(table, t));
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet tabs(g: TableGroup, close: (() => void) | null)}
  {#if g.id === 'hb' && sources.length > 1}
    {@const fold = foldRows(
      sources,
      srcOpen,
      CHIP_FOLD_AT,
      CHIP_FOLD_SHOWN,
      (s) => s.key === source
    )}
    <div class="tabs" role="group" aria-label={t.sourceLabel}>
      {#each fold.rows as s (s.key)}
        <a
          class="tab"
          href={srcHref(s.key)}
          aria-current={table === 'homebrew' && s.key === source ? 'page' : undefined}
          onclick={() => close?.()}>{s.label}</a
        >
      {/each}
      {#if sources.length > CHIP_FOLD_AT}
        <FoldButton
          open={srcOpen}
          more={t.andMore.replace('%n', String(fold.more))}
          {t}
          ontoggle={() => {
            srcOpen = !srcOpen;
          }}
        />
      {/if}
    </div>
  {:else if g.subs.length > 1 || close}
    <div class="tabs" role="group" aria-label={t[g.label]}>
      {#each g.subs as sub (sub)}
        <a
          class="tab"
          href={app.href(tablesHash(sub))}
          aria-current={sub === table ? 'page' : undefined}
          onclick={() => close?.()}>{t[navSubLabel(sub)]}</a
        >
      {/each}
    </div>
  {/if}
{/snippet}

{#if part === 'tabs'}
  <!-- Up to 760 px the tabs live in the picker's sheet. The slot holds every group's tabs unseen, so it takes the tallest row's height on
       every table, and a table with fewer tabs or none starts its rows where the others
       do (DESIGN.md, "The Head Order Rule"). -->
  {#if app.band !== 'narrow'}
    <div class="tabslot">
      {@render tabs(group, null)}
      <div class="ghosts" aria-hidden="true">
        {#each groups as g (g.id)}
          {@const labels = tabLabels(g)}
          {#if labels.length}
            <div class="tabs">
              {#each labels as label, i (i)}<span class="tab">{label}</span>{/each}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
{:else}
  <nav class="tablenav" class:narrow={app.band === 'narrow'} aria-label={t.tables}>
    {#if app.band === 'narrow'}
      <button
        bind:this={pickerButton}
        type="button"
        class="picker"
        aria-haspopup="dialog"
        aria-label={t.tablePick.replace('%s', picker)}
        onclick={() => {
          sheetGroup = null;
          picking = true;
        }}
        ><span class="picker-t"
          >{#if parts.book}<span class="picker-book">{parts.book}</span>{/if}{parts.name}</span
        ><Icon name="chevron" /></button
      >
      {#if picking}
        <Sheet
          {app}
          label={t.tablePick.replace('%s', picker)}
          title={t.tables}
          onclose={() => {
            picking = false;
          }}
        >
          <div class="groups" role="group" aria-label={t.groupLabel}>
            {#each groups as g (g.id)}
              <Chip
                label={t[g.label]}
                on={g.id === shownGroup.id}
                onclick={() => {
                  sheetGroup = g;
                }}
              />
            {/each}
          </div>
          {@render tabs(shownGroup, picked)}
        </Sheet>
      {/if}
    {:else}
      <div class="groups" role="group" aria-label={t.groupLabel}>
        {#each groups as g (g.id)}
          <Chip label={t[g.label]} on={g.id === group.id} href={app.href(tablesHash(g.top))} />
        {/each}
      </div>
    {/if}
  </nav>
{/if}

<style>
  .tablenav {
    min-width: 0;
  }

  /* The head's geometry follows the band, never the table (DESIGN.md, "The Head Order
     Rule"): the head's own gaps stand in for the tabs' top margin. */
  .tabslot > .tabs,
  .ghosts > .tabs {
    margin-top: 0;
  }

  .tabslot {
    display: grid;
  }

  .tabslot > :global(*),
  .ghosts > .tabs {
    grid-area: 1 / 1;
  }

  /* The current group's tabs keep their own height and underline inside the slot. */
  .tabslot > .tabs {
    align-self: start;
  }

  .ghosts {
    display: grid;
    visibility: hidden;
  }

  .groups {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  /* The second level: underlined tabs, the current one in gold. */
  .tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 18px;
    margin-top: 10px;
    border-bottom: 1px solid var(--line);
  }

  .tab {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    max-width: 100%;
    padding: 0 2px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    color: var(--muted);
    font-size: var(--t-small);
    font-weight: 600;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .tab:hover {
    color: var(--txt);
  }

  .tab[aria-current='page'] {
    color: var(--gold);
    border-bottom-color: var(--gold);
  }

  /* The picker: the table's name as the page's visible heading below 761 px. */
  .picker {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 100%;
    min-height: 40px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--txt);
    font: var(--h-page-weight) var(--t-small) / 1.2 var(--ui);
    letter-spacing: var(--h-page-spacing);
    text-align: left;
  }

  /* Two lines fit the row's 40 px. The Russian row leaves 94 px at 360 (measured
     2026-11-03): a larger face cuts «Расходники» and «Environments». */
  .picker-t {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    min-width: 0;
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  .picker-book {
    display: block;
    color: var(--muted);
    font-weight: 600;
  }

  /* A flex box, not a line box: a two-line picker would add the line's descent under it. */
  .narrow {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1 1 auto;
  }
</style>
