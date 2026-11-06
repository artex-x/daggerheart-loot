<script lang="ts">
  /* The search row of the list pages (docs/specs/FEATURES.md, "Account and browser lists",
     "Lists"): the search box, «Фильтры · N» while a filter row exists and «Выбрать» last,
     then the filter as a sheet at every width. The page owns the query, the picks and
     whether the sheet is open: the shared page opens it from its address. The lists index
     passes no filter rows: a list has only a name. */
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import FilterPanel from './FilterPanel.svelte';
  import SearchBox from './SearchBox.svelte';
  import SelMode from './SelMode.svelte';
  import type { FacetRow } from '../lib/facets.js';
  import { chosenLabels, type FilterState } from '../lib/filters.js';
  import type { AppState } from '../state/app.svelte.js';

  const NONE = (): void => undefined;

  interface Props {
    app: AppState;
    /** The filter's rows; none draws no «Фильтры» and no sheet, and the props up to
     *  `onreset` are then not read. */
    rows?: FacetRow[];
    picked?: FilterState;
    /** The entries the filter and the query let through: «Показать N». */
    shown?: number;
    query: string;
    onquery: (q: string) => void;
    open?: boolean;
    onopen?: () => void;
    onclose?: () => void;
    onpick?: (group: string, value: string) => void;
    onclear?: (group: string) => void;
    onreset?: () => void;
    /** Absent on the owner's page, whose filter is not in the address: no link. */
    oncopylink?: (() => void) | undefined;
    /** The search box's placeholder and name, where the page names its own. */
    placeholder?: string | undefined;
    label?: string | undefined;
    /** Draws «Выбрать». */
    selectable: boolean;
    onselect: () => void;
    /** After the search box, in the same row (the lists index's count from 761 px). */
    beside?: Snippet | undefined;
    /** «Фильтры», for the caller's focus. */
    toggle?: HTMLButtonElement | undefined;
  }

  let {
    app,
    rows = [],
    picked = {},
    shown = 0,
    query,
    onquery,
    open = false,
    onopen = NONE,
    onclose = NONE,
    onpick = NONE,
    onclear = NONE,
    onreset = NONE,
    oncopylink,
    placeholder,
    label,
    selectable,
    onselect,
    beside,
    toggle = $bindable()
  }: Props = $props();

  const t = $derived(app.t);
  const n = $derived(rows.length ? chosenLabels(rows, picked).length : 0);
</script>

<div class="lfind">
  <div class="grow">
    <SearchBox
      value={query}
      placeholder={placeholder ?? t.searchShort}
      label={label ?? t.searchPh}
      oninput={onquery}
    />
  </div>
  <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
  {@render beside?.()}
  {#if rows.length}
    <Button
      size="sm"
      variant={n ? 'toggle' : 'plain'}
      expanded={open}
      bind:el={toggle}
      onclick={onopen}>{n ? t.filtersN.replace('%n', String(n)) : t.filters}</Button
    >
  {/if}
  {#if selectable}<SelMode label={t.selectMode} onclick={onselect} />{/if}
</div>
{#if rows.length}
  <FilterPanel
    {app}
    {rows}
    {picked}
    {shown}
    band="mid"
    {open}
    onclose={() => {
      onclose();
      toggle?.focus();
    }}
    {onpick}
    {onclear}
    {onreset}
    {oncopylink}
  />
{/if}

<style>
  .lfind {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
  }

  .lfind .grow {
    flex: 1 1 0;
    min-width: 0;
  }

  /* DESIGN.md "Components", "The Field Measure Rule": the next controls follow the box. */
  @media (min-width: 761px) {
    .lfind .grow {
      max-width: 720px;
    }
  }

  .lfind :global(input[type='search']),
  .lfind :global(.btn.sm) {
    height: 40px;
  }

  @media (max-width: 760px) {
    .lfind {
      gap: 5px;
      margin-bottom: 8px;
    }

    /* 36 px, as mock F, and the thumb target up to 600 px: the first entry must start in
       the first screen at 360x640, so the row gives the growth back from its margin. */
    .lfind :global(input[type='search']),
    .lfind :global(.btn.sm),
    .lfind :global(.selmode) {
      height: max(36px, var(--thumb));
      padding: 0 9px;
    }
  }

  @media (max-width: 600px) {
    .lfind {
      margin-bottom: 4px;
    }
  }
</style>
