<script lang="ts">
  /* A row of chips that wraps, off `.chips` in style.css.

     One rule, one home. The section picker, the community picker and the
     source, kind and rarity rows of the other two modes are all this. */
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
</script>

<div class="chips">{@render children()}</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
</style>
