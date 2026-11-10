<script lang="ts">
  /* The picker of the list head up to 760 px: the page's own name as its visible heading,
     with a chevron, that opens the page's sheet (docs/specs/FEATURES.md, "Tables and
     search"). One face on the roll pages, the tables and «Мои предметы». */
  import Icon from './Icon.svelte';

  interface Props {
    /** The accessible name, «Таблица: <name>». */
    label: string;
    /** The visible name, two lines at most. */
    name: string;
    /** A line above the name, where the page has one (a table's book). */
    book?: string | undefined;
    /** The canonical key the route contract reads, where the control stands for a page. */
    section?: string | undefined;
    onclick: () => void;
    el?: HTMLButtonElement | undefined;
  }

  let { label, name, book, section, onclick, el = $bindable() }: Props = $props();
</script>

<button
  bind:this={el}
  type="button"
  class="picker"
  aria-haspopup="dialog"
  aria-label={label}
  data-section={section}
  {onclick}
  ><span class="picker-t"
    >{#if book}<span class="picker-book">{book}</span>{/if}{name}</span
  ><Icon name="chevron" /></button
>

<style>
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
</style>
