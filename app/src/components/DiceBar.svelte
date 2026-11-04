<script lang="ts">
  /* The five roll buttons of the Core rules page. All five are the same action with a
     different number of d12, and a die is an action rather than a choice, so none is gold and
     none is lit (DESIGN.md, "The Seal Rule"): you pick by the rarity you are rolling for,
     which is the caption. */
  import Die from './Die.svelte';
  import type { DiceChoice } from '../lib/std.js';

  interface Props {
    dice: DiceChoice[];
    /** What each rarity is called, already in the language on screen. */
    rarityName: (key: string) => string;
    /** The group's name: drawn from 761 px, read below. */
    rollWord: string;
    onroll: (n: number) => void;
  }

  const { dice, rarityName, rollWord, onroll }: Props = $props();

  const caption = (d: DiceChoice): string => d.rarities.map(rarityName).join(' - ');
  const count = (d: DiceChoice): string => `${String(d.n)}d12`;
  const hint = (d: DiceChoice): string => `${rollWord} ${count(d)} - ${caption(d)}`;
</script>

<div class="dicewrap" role="group" aria-labelledby="dice-word">
  <span class="lbl" id="dice-word">{rollWord}</span>
  <div class="dicebar">
    {#each dice as d (d.n)}
      <button
        type="button"
        class="die"
        title={hint(d)}
        onclick={() => {
          onroll(d.n);
        }}
      >
        <span class="d"><Die faces={12} />{count(d)}</span>
        <small>{caption(d)}</small>
      </button>
    {/each}
  </div>
</div>

<style>
  .dicewrap {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* `Field`'s caption; the `.vh` rule of `styles/tokens.css` up to 760 px, under a media
     query a class cannot carry. */
  .lbl {
    display: block;
    font-size: var(--t-label);
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin: 0 0 8px;
  }

  .dicebar {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .die {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 46px;
    padding: 5px 12px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface);
    color: var(--txt);
    font-size: var(--t-control);
    font-weight: 600;
    line-height: 1.2;
    text-align: left;
    transition: 0.15s;
    cursor: pointer;
  }

  .die:hover {
    border-color: var(--gold);
    background: var(--surface2);
  }

  .d {
    display: flex;
    align-items: center;
    gap: 6px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .d :global(.dieicon) {
    width: auto;
    height: 18px;
    fill: none;
  }

  small {
    min-width: 0;
    font-size: var(--t-data);
    font-weight: 400;
    color: var(--muted);
  }

  /* Three dice over two: each keeps its rarities on the first screen of a phone. */
  @media (max-width: 760px) {
    .lbl {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .dicebar {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .die {
      grid-column: span 2;
      flex-direction: column;
      justify-content: center;
      gap: 0;
      min-height: 50px;
      padding: 4px 2px;
      text-align: center;
    }

    .die:nth-child(n + 4) {
      grid-column: span 3;
    }

    .d :global(.dieicon) {
      display: none;
    }

    small {
      font-size: var(--t-label);
    }
  }
</style>
