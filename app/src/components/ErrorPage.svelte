<script lang="ts">
  /* A page that failed: the cause as the title, one sentence, the way out. No icon and no
     plate (DESIGN.md, "Error page"). */
  import { onMount, type Snippet } from 'svelte';
  import StatusRegion from './StatusRegion.svelte';

  interface Props {
    title: string;
    children: Snippet;
    actions: Snippet;
    /** Says the title once through a status region after the page arrives; for a page
     *  with no region of its own (docs/specs/FEATURES.md, rule 19). */
    said?: boolean | undefined;
  }

  const { title, children, actions, said = false }: Props = $props();

  /* A region inserted with its text is not announced, so the text follows the mount. */
  let arrived = $state(false);
  onMount(() => {
    const timer = setTimeout(() => {
      arrived = true;
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  });
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression --
     a `{@render}` tag reads as a void expression to this rule. -->
<div class="errpage">
  <h1 class="errtitle">{title}</h1>
  <p class="errtext">{@render children()}</p>
  <div class="erracts">{@render actions()}</div>
</div>
{#if said}<StatusRegion text={arrived ? title : ''} />{/if}

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
    max-width: var(--measure-line);
    text-wrap: balance;
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
