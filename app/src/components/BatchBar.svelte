<script lang="ts">
  /* The selection strip above rows or cards of one page: «Выбрать все» with
     the mixed state, a polite summary, and the actions while anything is
     ticked. Extracted from the list page's strip on its second use, the
     account cards of `#/lists` (docs/specs/FEATURES.md, "Lists").

     The caller's snippet markup keeps the caller's CSS scope, so a class a
     snippet draws is styled by the caller, not here. */
  import type { Snippet } from 'svelte';

  interface Props {
    /** The rows or cards the strip can tick. */
    total: number;
    /** How many of them are ticked. */
    picked: number;
    /** The select-all box's name; also its visible text while nothing is ticked. */
    label: string;
    /** The ticked count as text, first in the live summary. */
    count: string;
    onall: (checked: boolean) => void;
    /** Joined to the rows under it (the list page): no bottom border, square bottom corners. */
    joined?: boolean;
    /** More of the summary after the count (the list page's total). */
    summary?: Snippet | undefined;
    /** The buttons, drawn while `picked` > 0. */
    actions: Snippet;
    /** A full-width part inside the strip (the list page's price panel). */
    below?: Snippet | undefined;
  }

  const {
    total,
    picked,
    label,
    count,
    onall,
    joined = false,
    summary,
    actions,
    below
  }: Props = $props();
</script>

<div class="batch" class:on={picked > 0} class:joined>
  <label class="batch-all"
    ><input
      type="checkbox"
      aria-label={label}
      checked={picked > 0 && picked === total}
      indeterminate={picked > 0 && picked < total}
      onchange={(e) => {
        onall(e.currentTarget.checked);
      }}
    />{#if !picked}{label}{/if}</label
  >
  <!-- Mounted while empty, so the first tick is announced too. -->
  <span class="batch-summ" aria-live="polite"
    >{#if picked}<span class="batch-count">{count}</span>&#32;{@render summary?.()}{/if}</span
  >
  {#if picked}
    <span class="batch-acts">{@render actions()}</span>
  {/if}
  {@render below?.()}
</div>

<style>
  /* off `.batch`, `.batch.on`, `.batch-all`, `.batch.on .batch-all`
     (style.css:1050-1058); the index's strip stands alone, the list page's
     joins the rows under it */
  .batch {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin: 0 0 14px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid var(--line2);
    background: var(--surface);
  }

  .batch.joined {
    margin: 16px 0 0;
    border-radius: 10px 10px 0 0;
    border-bottom: none;
  }

  .batch.on {
    border-color: var(--gold);
    background: rgb(216 171 94 / 7%);
  }

  .batch-all {
    font: 650 11px/1 var(--mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .batch-all {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .batch.on .batch-all {
    color: var(--gold-soft);
  }

  /* The selection summary, in the shared bar's type (`SelBar.svelte`
     `.selsumm`): the count and the total, one live region. */
  .batch-summ {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 12px;
    row-gap: 6px;
    font: 400 13.5px/1.3 var(--ui);
    color: var(--gold-soft);
  }

  .batch-count {
    font-weight: 650;
    white-space: nowrap;
  }

  /* off `.batch-acts` (style.css:1059) */
  .batch-acts {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  /* off `.batch .btn.sm` (style.css:1081) */
  .batch :global(.btn.sm) {
    height: 32px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
  }

  /* The summary keeps its line beside the box and wraps inside itself. */
  @media (max-width: 640px) {
    .batch-summ {
      flex: 1 1 0;
      min-width: 0;
    }

    .batch-acts {
      margin-left: 0;
      width: 100%;
    }

    /* The index's two actions share their own line half and half. */
    .batch:not(.joined) .batch-acts :global(.btn) {
      flex: 1 1 0;
      justify-content: center;
    }
  }
</style>
