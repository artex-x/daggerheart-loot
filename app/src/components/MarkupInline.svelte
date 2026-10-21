<script lang="ts">
  /* The inline runs of formatted text: text, `<b>` and `<i>`, nested as written
     (lib/markup.ts). No whitespace between the tags and no `<span>`: a row's
     description is one clamped run, and print allows no whitespace text node in
     its text block. A space between two runs joins the first run's text (`glueSpaces`),
     so a button's name keeps it. A caller styles these elements with `:global` rules. */
  import MarkupInline from './MarkupInline.svelte';
  import { glueSpaces, type MarkupInline as Inline } from '../lib/markup.js';

  interface Props {
    c: readonly Inline[];
  }

  const { c }: Props = $props();
  const runs = $derived(glueSpaces(c));
</script>

<!-- prettier-ignore -->
{#each runs as n, i (i)}{#if n.t === 'text'}{n.v}{:else if n.t === 'b'}<b><MarkupInline c={n.c} /></b>{:else}<i><MarkupInline c={n.c} /></i>{/if}{/each}
