<script lang="ts">
  /* A name with the words a search matched marked: a table row's and a grid tile's
     (docs/specs/FEATURES.md, "Tables and search"). */
  import { markRuns, type Term } from '../lib/search.js';

  interface Props {
    text: string;
    /** The search terms; none draws the text alone. */
    terms?: readonly Term[] | undefined;
  }

  const { text, terms }: Props = $props();
</script>

<!-- No whitespace between the runs: the goldens compare the text byte for byte. -->
<!-- prettier-ignore -->
{#each markRuns(text, terms ?? []) as r, i (i)}{#if r.mark}<mark>{r.text}</mark>{:else}{r.text}{/if}{/each}

<style>
  /* The search highlight: a lit ground and an underline, not color alone (WCAG 1.4.1). */
  mark {
    background: var(--surface2);
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
