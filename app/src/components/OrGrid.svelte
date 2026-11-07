<script lang="ts" generics="T">
  /* One roll's worth of cards, separated by OR.

     A roll offers a choice rather than a result: the player takes one of them,
     so the cards are laid out as alternatives and not as a list. One card
     fills the row; two sit either side of the separator; four make a 2x2 of row faces with
     a full-width separator between the rows. One or two name the `faces` container, so a
     roll that sits on one line draws the tall face (DESIGN.md, "The Roll Page Rule").

     The layout is computed into a flat list of cells rather than written out
     three times. That keeps the markup to one loop, and it makes the list
     itself the statement of what a layout is - easier to read than three
     branches, and easier to check. */
  import type { Snippet } from 'svelte';

  interface Props {
    /** The word between two options, which is the dictionary's. */
    or: string;
    /**
     * What the roll produced, in the order the live app lays them out.
     *
     * Generic because the alternate tables carry more than the record: which
     * die found it, and the face it showed. The grid only counts them.
     */
    items: T[];
    /** How to draw one of them. */
    card: Snippet<[T]>;
  }

  const { or, items, card }: Props = $props();

  type Cell =
    | { kind: 'card'; it: T }
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
  <div class="orwrap" class:faces={items.length <= 2}>
    <div class="orgrid" class:c2={items.length === 2} class:c4={items.length > 2}>
      {#each cells as cell, i (i)}
        {#if cell.kind === 'card'}
          <!-- Keyed on the item itself, not the slot: the live app rebuilds
               #view.innerHTML on every roll, so a new record's <img> always
               paints empty and fills. Positional keying let Svelte patch the
               existing node's src in place instead, and the previous artwork
               sat on screen until the new one decoded - invisible to a settled
               screenshot, which is why no parity state caught it. Object
               identity is the only key this generic
               component has - AltPanel's AltPick wrappers are a new object per
               roll, which matches. Rolling the *same* record twice is the one
               case this still keeps the node for (the image is identical, so
               nothing visible differs) - not a DEBT.md entry, since it is a
               divergence from live that parity never measured. -->
          <div>
            {#key cell.it}{@render card(cell.it)}{/key}
          </div>
        {:else if cell.kind === 'or'}
          <div class="ordiv"><i>{or}</i></div>
        {:else}
          <div class="wide">
            <div class="ordiv h"><i>{or}</i></div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  /* off `.orgrid` and `.ordiv` in style.css */
  .orwrap {
    container-type: inline-size;
  }

  .orwrap.faces {
    container-name: faces;
  }

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
    font: 700 var(--t-label)/1 var(--ui);
    letter-spacing: 0.18em;
    color: var(--muted);
    border: 1px solid var(--line2);
    border-radius: 999px;
    padding: 8px 11px;
    background: var(--bg2);
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

  /* The rule between the two rows of row faces: 42 px rather than 62. */
  @container (min-width: 641px) {
    .ordiv.h {
      padding: 6px 0;
    }
  }

  /* On a narrow pane the columns stack, so the separator becomes a rule across the width
     rather than a pill between two columns. The pane's own width: between 761 and 999 px the
     two-pane roll page leaves it 387-600 px, which a window rule cannot read. */
  @container (max-width: 640px) {
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
