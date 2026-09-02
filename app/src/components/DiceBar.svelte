<script lang="ts">
  /* The five roll buttons of the Core rules page, off `.dicebar` in style.css.

     All five are the same action with a different number of d12, so all five
     look like the roll button on every other page - gold, with a die. There is
     no primary one: you pick by the rarity you are rolling for, which is the
     caption, not by position. The word "Roll" is written once, on the first,
     and read across the rest by proximity. */
  import Die from './Die.svelte';
  import type { DiceChoice } from '../lib/std.js';

  interface Props {
    dice: DiceChoice[];
    /** What each rarity is called, already in the language on screen. */
    rarityName: (key: string) => string;
    /** The word on the first button only. */
    rollWord: string;
    onroll: (n: number) => void;
  }

  const { dice, rarityName, rollWord, onroll }: Props = $props();

  const caption = (d: DiceChoice): string => d.rarities.map(rarityName).join(' / ');
</script>

<div class="dicebar">
  {#each dice as d, i (d.n)}
    <button
      type="button"
      class="btn primary"
      title="{rollWord} {d.n}d12 — {caption(d)}"
      onclick={() => {
        onroll(d.n);
      }}
    >
      <span class="dl"><Die faces={12} />{i === 0 ? `${rollWord} ` : ''}{d.n}d12</span>
      <small>{caption(d)}</small>
    </button>
  {/each}
</div>

<style>
  /* off `.dicebar` in style.css */
  .dicebar {
    display: flex;
    align-items: stretch;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* The caption adds a second line, so the fixed `.btn` height has to give way.
     These repeat `.btn` rather than composing it because the live rule does the
     same - `.dicebar .btn` overrides the shared button, and copying the
     override is what keeps the two rows of five the same height. */
  .dicebar .btn {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    height: auto;
    min-height: 46px;
    font-variant-numeric: tabular-nums;
    padding: 5px 11px;
    line-height: 1.2;
  }

  .dl {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  small {
    font-size: 9.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    opacity: 0.62;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Copied from `.btn` and `.btn.primary`, because this button is not the
     shared component: it has two lines and its own height. */
  .btn {
    border: 1px solid #e8c27c;
    background: linear-gradient(180deg, #e2b76c, var(--gold));
    color: #1a1206;
    border-radius: var(--r-sm);
    font-size: 14px;
    font-weight: 700;
    transition: 0.15s;
    display: inline-flex;
    cursor: pointer;
  }

  .btn:hover {
    filter: brightness(1.07);
  }
</style>
