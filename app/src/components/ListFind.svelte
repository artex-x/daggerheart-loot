<script lang="ts">
  /* The search row of the two list pages (docs/specs/FEATURES.md, "Account and browser
     lists"): the search box, «Фильтры · N» while a filter row exists and «Выбрать» last,
     then the filter as a sheet at every width. The page owns the query, the picks and
     whether the sheet is open: the shared page opens it from its address. */
  import Button from './Button.svelte';
  import FilterPanel from './FilterPanel.svelte';
  import SearchBox from './SearchBox.svelte';
  import SelMode from './SelMode.svelte';
  import type { FacetRow } from '../lib/facets.js';
  import { chosenLabels, type FilterState } from '../lib/filters.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    rows: FacetRow[];
    picked: FilterState;
    /** The entries the filter and the query let through: «Показать N». */
    shown: number;
    query: string;
    onquery: (q: string) => void;
    open: boolean;
    onopen: () => void;
    onclose: () => void;
    onpick: (group: string, value: string) => void;
    onclear: (group: string) => void;
    onreset: () => void;
    /** Absent on the owner's page, whose filter is not in the address: no link. */
    oncopylink?: (() => void) | undefined;
    /** Draws «Выбрать». */
    selectable: boolean;
    onselect: () => void;
    /** «Фильтры», for the caller's focus. */
    toggle?: HTMLButtonElement | undefined;
  }

  let {
    app,
    rows,
    picked,
    shown,
    query,
    onquery,
    open,
    onopen,
    onclose,
    onpick,
    onclear,
    onreset,
    oncopylink,
    selectable,
    onselect,
    toggle = $bindable()
  }: Props = $props();

  const t = $derived(app.t);
  const n = $derived(chosenLabels(rows, picked).length);
</script>

<div class="lfind">
  <div class="grow">
    <SearchBox value={query} placeholder={t.searchShort} label={t.searchPh} oninput={onquery} />
  </div>
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

  .lfind :global(input[type='search']),
  .lfind :global(.btn.sm) {
    height: 40px;
  }

  @media (max-width: 760px) {
    .lfind {
      gap: 5px;
    }

    .lfind :global(input[type='search']),
    .lfind :global(.btn.sm) {
      padding: 0 9px;
    }
  }
</style>
