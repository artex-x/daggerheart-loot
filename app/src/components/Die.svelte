<script lang="ts">
  /* The die on a roll button, or the wheel where no such die exists.
     Lines only and no fill, so the button shows through it - a fill of its own
     would vanish against either the gold or the dark. Each die has its own
     width, so only the height is set. */
  import { dieArt, WHEEL_SPOKES } from '../lib/dice.js';

  interface Props {
    /** How many faces the range has. */
    faces: number;
  }

  const { faces }: Props = $props();
  const art = $derived(dieArt(faces));
</script>

{#if art}
  <svg
    viewBox={art.viewBox}
    class="dieicon"
    fill="none"
    stroke="currentColor"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d={art.body} />
    <path d={art.faces} />
  </svg>
{:else}
  <svg
    viewBox="0 0 32 32"
    class="dieicon wheel"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="16" cy="16" r="9" />
    <circle cx="16" cy="16" r="14" />
    {#each WHEEL_SPOKES as [x1, y1, x2, y2], i (i)}
      <line {x1} {y1} {x2} {y2} />
    {/each}
    <line x1="11" y1="16" x2="21" y2="16" />
    <line x1="16" y1="21" x2="16" y2="11" />
    <circle cx="16" cy="11" r="1" />
    <circle cx="16" cy="16" r="1" />
    <circle cx="21" cy="16" r="1" />
    <circle cx="11" cy="16" r="1" />
    <circle cx="16" cy="21" r="1" />
  </svg>
{/if}

<style>
  /* off `.dieicon` in style.css. The stroke does not scale with the shape, or
     a d4 comes out heavier than a d20. */
  .dieicon {
    flex: none;
    height: 18px;
    width: auto;
    display: block;
    fill: none;
    stroke-width: 1.3;
    vector-effect: non-scaling-stroke;
  }

  .dieicon.wheel {
    stroke-width: 1.6;
  }
</style>
