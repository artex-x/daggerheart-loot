<script lang="ts">
  /* The one selection bar of a list page (DESIGN.md, "Components"): the tri-state «Все»
     with its label always visible, the polite summary, the page's actions and «Снять
     выделение» last, pinned to the bottom of the screen. Props only: `SelBar.svelte`
     gives it the catalog's, search's and the shared page's facts and actions.

     The caller's snippet markup keeps the caller's CSS scope. */
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import { watchBarHeight } from './barHeight.js';

  interface Props {
    /** The region's name. */
    label: string;
    /** The rows the page draws. */
    total: number;
    /** How many of them are ticked. */
    picked: number;
    /** The «Все» box's accessible name and its visible text. */
    allLabel: string;
    allText: string;
    /** The ticked count as text, first in the summary. */
    count: string;
    clearText: string;
    onall: (checked: boolean) => void;
    onclear: () => void;
    /** More of the summary after the count (the shared page's total). */
    summary?: Snippet | undefined;
    actions: Snippet;
    /** A full-width line under the actions (the shared page's sent line). */
    below?: Snippet | undefined;
    /** Visually hidden while nothing is ticked: the shared page keeps the region mounted. */
    idle?: boolean;
  }

  const {
    label,
    total,
    picked,
    allLabel,
    allText,
    count,
    clearText,
    onall,
    onclear,
    summary,
    actions,
    below,
    idle = false
  }: Props = $props();

  let wrap = $state<HTMLElement | undefined>(undefined);

  /* The page's scroll padding follows the bar's height, so a tab stop under it scrolls
     into view (WCAG 2.4.11). */
  $effect(() => (wrap ? watchBarHeight(wrap, '--selbar-h') : undefined));
</script>

<!-- A labeled region: the bar sits after the footer, outside every other landmark. -->
<section class="selbarwrap" class:idle class:vh={idle} aria-label={label} bind:this={wrap}>
  <div class="selbar">
    <!-- A page that registers no drawn rows (the own items and list pages, which keep
         their own strip until their batches) draws no «Все». An idle bar is only clipped,
         so a control in it would be a tab stop nobody sees. -->
    {#if total > 0 && !idle}
      <label class="selall"
        ><input
          type="checkbox"
          aria-label={allLabel}
          checked={picked >= total}
          indeterminate={picked > 0 && picked < total}
          onchange={(e) => {
            onall(e.currentTarget.checked);
          }}
        /><span aria-hidden="true">{allText}</span></label
      >
    {/if}
    <!-- Mounted while idle and empty, so the first tick is announced. -->
    <span class="selsumm" aria-live="polite"
      >{#if !idle}<span class="selcount">{count}</span>{@render summary?.()}{/if}</span
    >
    {#if !idle}
      <div class="selacts">{@render actions()}</div>
      <span class="selclear"
        ><Button size="sm" variant="ghost" onclick={onclear}>{clearText}</Button></span
      >
      {@render below?.()}
    {/if}
  </div>
</section>

<style>
  /* The sticky bottom place, the safe-area padding and the blur of the bar before it;
     the ground and the top border are neutral (no gold). */
  .selbarwrap {
    padding-bottom: env(safe-area-inset-bottom);
    position: sticky;
    bottom: 0;
    z-index: 45;
    background: rgb(16 14 24 / 96%);
    border-top: 1px solid var(--muted2);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .selbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    grid-template-areas: 'all summ acts clear' 'below below below below';
    align-items: center;
    column-gap: 12px;
    row-gap: 8px;
    padding: 10px 0;
    width: var(--wrap);
    margin-inline: auto;
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  .selall {
    grid-area: all;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding-right: 4px;
    font-size: var(--t-small);
    font-weight: 600;
    color: var(--txt);
    cursor: pointer;
  }

  .selall input {
    accent-color: var(--txt);
    width: 18px;
    height: 18px;
    margin: 0;
    cursor: pointer;
  }

  .selsumm {
    grid-area: summ;
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 12px;
    row-gap: 6px;
    min-width: 0;
    font-size: var(--t-small);
    line-height: 1.3;
    color: var(--txt);
  }

  .selcount {
    font-weight: 650;
    white-space: nowrap;
  }

  .selacts {
    grid-area: acts;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .selclear {
    grid-area: clear;
    display: flex;
  }

  .selbar > :global(:not(.selall, .selsumm, .selacts, .selclear)) {
    grid-area: below;
  }

  @media (max-width: 760px) {
    .selbar {
      grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-areas: 'all summ clear' 'acts acts acts' 'below below below';
    }

    .selacts {
      justify-content: stretch;
    }

    .selacts :global(.btn) {
      flex: 1 1 0;
      min-width: 0;
      width: 100%;
      justify-content: center;
      overflow: hidden;
    }
  }

  /* On a phone held upright the add control has its own line; in landscape the actions
     share one, which holds the bar under 45% of the height with no scroll: a scroll here
     would clip the add menu that opens upward (189 px at 640x360, measured 2026-11-03). */
  @media (max-width: 760px) and (min-height: 481px) {
    .selacts :global(.seldrop) {
      flex: 1 1 100%;
    }
  }

  @media print {
    .selbarwrap {
      display: none;
    }
  }
</style>
