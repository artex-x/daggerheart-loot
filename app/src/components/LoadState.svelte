<script lang="ts">
  /* An account read in flight, or failed with «Повторить»: one shape for every load line
     (docs/specs/FEATURES.md, "Consistency rules", rule 6). `page` makes the retry primary
     where the failure is all the page holds. */
  import { onDestroy, tick } from 'svelte';
  import Button from './Button.svelte';
  import type { Dict } from '../lib/dict.js';

  interface Props {
    t: Dict;
    failed: boolean;
    /** The failure line; the loading line is always `cloudLoading`. */
    text: string;
    onretry: () => void;
    page?: boolean;
    /** The group's lead control, which takes the focus when the retry button leaves. */
    after?: (() => HTMLElement | null | undefined) | undefined;
  }

  const { t, failed, text, onretry, page = false, after }: Props = $props();

  let retry = $state<HTMLButtonElement | undefined>();
  /* Whether «Повторить» held the focus when it was pressed. */
  let pressed = false;

  function press(): void {
    pressed = !!retry && document.activeElement === retry;
    onretry();
  }

  /* Rule 20 (docs/specs/FEATURES.md): the read that answers removes the pressed retry, so
     focus goes to `after()`, else `#main`. A retry that fails keeps the button, and focus
     that moved elsewhere stays. */
  onDestroy(() => {
    if (!pressed) return;
    void tick().then(() => {
      const at = document.activeElement;
      if (at && at !== document.body && at.isConnected) return;
      const next = after?.();
      (next?.isConnected ? next : document.getElementById('main'))?.focus();
    });
  });
</script>

{#if failed}
  <p class="note err" role="alert">{text}</p>
  {#if page}
    <Button variant="primary" onclick={press} bind:el={retry}>{t.retry}</Button>
  {:else}
    <Button size="sm" onclick={press} bind:el={retry}>{t.retry}</Button>
  {/if}
{:else}
  <p class="note" role="status">{t.cloudLoading}</p>
{/if}

<style>
  .note {
    margin: 0 0 14px;
    font-size: var(--t-small);
    color: var(--muted);
  }

  .note.err {
    color: var(--danger-text);
  }
</style>
