<script lang="ts">
  /* A page that failed: the cause as the title, one sentence, the way out. No icon and no
     plate (DESIGN.md, "Error page"). */
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children: Snippet;
    actions: Snippet;
  }

  const { title, children, actions }: Props = $props();
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression --
     a `{@render}` tag reads as a void expression to this rule. -->
<div class="errpage">
  <h1 class="errtitle">{title}</h1>
  <p class="errtext">{@render children()}</p>
  <div class="erracts">{@render actions()}</div>
</div>

<style>
  .errtitle {
    margin: 0 0 8px;
    font-size: var(--t-page);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    overflow-wrap: anywhere;
  }

  .errtext {
    margin: 0 0 18px;
    max-width: 62ch;
    color: var(--muted);
    font-size: var(--t-small);
    overflow-wrap: anywhere;
  }

  .errtext :global(code) {
    padding: 1px 5px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    font: var(--t-data) var(--mono);
  }

  .erracts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
