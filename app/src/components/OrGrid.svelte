<script lang="ts">
  /* One roll's worth of cards, separated by OR.

     A roll offers a choice rather than a result: the player takes one of them,
     so the cards are laid out as alternatives and not as a list. One card
     fills the row; two sit either side of the separator; four make a 2x2 with
     a full-width separator between the rows.

     The layout is computed into a flat list of cells rather than written out
     three times. That keeps the markup to one loop, and it makes the list
     itself the statement of what a layout is - easier to read than three
     branches, and easier to check. */
  import type { Record_ } from '../lib/types.js';
  import type { Snippet } from 'svelte';

  interface Props {
    /** The word between two options, which is the dictionary's. */
    or: string;
    /** What the roll produced, in the order the live app lays them out. */
    items: Record_[];
    /** How to draw one of them. */
    card: Snippet<[Record_]>;
  }

  const { or, items, card }: Props = $props();

  type Cell =
    | { kind: 'card'; it: Record_ }
    | { kind: 'or' }
    /* The separator between the two rows of a 2x2, which spans both columns. */
    | { kind: 'or-row' };

  const cells = $derived.by((): Cell[] => {
    const out: Cell[] = [];
    items.forEach((it, i) => {
      /* The third card starts a new row, so it gets the full-width rule above
         it rather than a pill beside it. */
      if (i === 2) out.push({ kind: 'or-row' });
      else if (i > 0) out.push({ kind: 'or' });
      out.push({ kind: 'card', it });
    });
    return out;
  });
</script>

{#if items.length}
  <div class="orgrid" class:c2={items.length === 2} class:c4={items.length > 2}>
    {#each cells as cell, i (i)}
      {#if cell.kind === 'card'}
        <div>{@render card(cell.it)}</div>
      {:else if cell.kind === 'or'}
        <div class="ordiv"><i>{or}</i></div>
      {:else}
        <div class="wide">
          <div class="ordiv h"><i>{or}</i></div>
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  /* off `.orgrid` and `.ordiv` in style.css */
  .orgrid {
    display: grid;
    gap: 0;
  }

  .orgrid > :global(*) {
    min-width: 0;
  }

  .orgrid.c2 {
    grid-template-columns: 1fr auto 1fr;
  }

  .orgrid.c4 {
    grid-template-columns: 1fr auto 1fr;
    row-gap: 0;
  }

  /* The live app writes this inline on the row separator's wrapper. */
  .wide {
    grid-column: 1 / -1;
  }

  .ordiv {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
  }

  .ordiv i {
    font-style: normal;
    font: 700 12px/1 var(--mono);
    letter-spacing: 0.18em;
    color: var(--gold);
    border: 1px solid var(--gold);
    border-radius: 999px;
    padding: 8px 11px;
    background: rgb(216 171 94 / 8%);
    white-space: nowrap;
  }

  .ordiv.h {
    width: 100%;
    padding: 16px 0;
  }

  .ordiv.h::before,
  .ordiv.h::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--line2), transparent);
  }

  .ordiv.h i {
    margin: 0 14px;
  }

  /* On a narrow screen the columns stack, so the separator becomes a rule
     across the width rather than a pill between two columns. */
  @media (max-width: 860px) {
    .orgrid.c2,
    .orgrid.c4 {
      grid-template-columns: 1fr;
    }

    .ordiv {
      padding: 14px 0;
      width: 100%;
    }

    .ordiv::before,
    .ordiv::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--line2), transparent);
    }

    .ordiv i {
      margin: 0 14px;
    }
  }
</style>
