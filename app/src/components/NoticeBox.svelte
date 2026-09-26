<script lang="ts">
  /* The box the move of browser lists speaks in: the one-time notice under
     the header and the status in the storage notice's slot
     (docs/specs/FEATURES.md, "Account and browser lists"). Gold for news,
     the warning tint for a list that did not move. The caller places it. */
  import type { Snippet } from 'svelte';

  interface Props {
    warn?: boolean;
    children: Snippet;
    actions?: Snippet | undefined;
  }

  const { warn = false, children, actions }: Props = $props();
</script>

<div class="box" class:warn role="status">
  <div class="lead">{@render children()}</div>
  {#if actions}{@render actions()}{/if}
</div>

<style>
  .box {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    padding: 11px 14px;
    border: 1px solid rgb(var(--gold-rgb) / 45%);
    border-radius: var(--r-sm);
    background: rgb(var(--gold-rgb) / 6%);
    font-size: 13px;
    line-height: 1.5;
  }

  .lead {
    flex: 1 1 320px;
    min-width: 0;
  }

  .box.warn {
    border-color: var(--warn-line);
    background: var(--warn-bg);
    color: var(--warn-text);
  }
</style>
