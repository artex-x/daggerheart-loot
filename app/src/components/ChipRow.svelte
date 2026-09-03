<script lang="ts">
  /* A row of chips that wraps, off `.chips` in style.css.

     One rule, one home. The section picker, the community picker and the
     source, kind and rarity rows of the other two modes are all this. */
  import type { Snippet } from 'svelte';

  interface Props {
    /**
     * The table nav's second row: a book's own sections, drawn smaller and set
     * off from the row of books above it. Off `.subchips` in style.css - the
     * table navigation's second use of this component.
     */
    sub?: boolean;
    children: Snippet;
  }

  const { sub = false, children }: Props = $props();
</script>

<div class="chips" class:subchips={sub}>{@render children()}</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .subchips {
    margin-top: 8px;
    padding-top: 9px;
    border-top: 1px solid var(--line);
  }
</style>
