<script lang="ts">
  /* The record badge - a card's kind/rarity/source chip and a table row's
     copy of the same thing, off `.badge` in style.css.

     Extracted on its third use: `RecordCard.svelte` and `RowMain.svelte`
     carried the base rule plus eight variants byte-identical to the
     character, and `ListsPage.svelte` carried the base plus `.num` alone,
     with a comment recording the decision not to extract - CLAUDE.md says
     extract on the second use, so this is one use late rather than early. */
  import type { Snippet } from 'svelte';

  interface Props {
    /** The variant - `item`, `cons`, `eq-weapon`, `eq-secondary`, `eq-armor`,
     *  `uniq`, `tier`, `src`, `num`, `hope` or `fear` - appended to `badge`
     *  as a second class. */
    cls: string;
    /** A hover explanation, where the live app gives one. */
    title?: string | undefined;
    children: Snippet;
  }

  const { cls, title, children }: Props = $props();
</script>

<span class="badge {cls}" {title}>{@render children()}</span>

<style>
  /* off `.badge` in style.css */
  .badge {
    font-size: 10.5px;
    font-weight: 650;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 3px 7px;
    border-radius: 6px;
    background: var(--badge-bg);
    border: 1px solid var(--line2);
    color: var(--muted);
  }

  .badge.item {
    color: var(--item);
    border-color: #7a8ee073;
  }

  .badge.cons {
    color: var(--cons);
    border-color: #9ec96a73;
  }

  /* Gear names the kind of gear rather than "item"; the three colours are the
     ones the equipment tables and tiles already use. */
  .badge.eq-weapon {
    color: var(--eq-weapon);
    border-color: #d48e6a73;
  }

  .badge.eq-secondary {
    color: var(--eq-secondary);
    border-color: #cf7fa673;
  }

  .badge.eq-armor {
    color: var(--eq-armor);
    border-color: #5ec9c473;
  }

  /* Dashed, because it is a property of the thing rather than a category. */
  .badge.uniq {
    color: var(--gold-soft);
    border-color: rgb(var(--gold-rgb) / 45%);
    border-style: dashed;
  }

  .badge.tier {
    color: var(--muted);
    border-color: var(--line2);
  }

  /* Neutral on purpose: --muted carries a violet tint that put this badge in
     the same family as the armour one. */
  .badge.src {
    color: #9a9aa6;
  }

  .badge.num {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0;
    color: var(--gold-soft);
    border-color: rgb(var(--gold-rgb) / 50%);
  }

  /* The two duality columns, in the colours the dice are named for - the
     alternate tables' own use, not one of the three duplicated copies this
     component was extracted to replace, but the same base rule either way. */
  .badge.hope {
    color: var(--hope);
    border-color: rgb(233 185 73 / 50%);
  }

  .badge.fear {
    color: var(--fear);
    border-color: rgb(138 114 214 / 55%);
  }
</style>
