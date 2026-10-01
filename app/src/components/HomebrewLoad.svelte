<script lang="ts">
  /* The author's items are loading, or failed to load with «Повторить»: one line for the
     four pages that wait for them (docs/specs/FEATURES.md, "Homebrew"). */
  import Button from './Button.svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    failed: boolean;
  }

  const { app, failed }: Props = $props();
  const t = $derived(app.t);
</script>

{#if failed}
  <p class="note err" role="alert">{t.hbLoadFailed}</p>
  <Button onclick={() => void app.homebrew?.load()}>{t.retry}</Button>
{:else}
  <p class="note" role="status">{t.cloudLoading}</p>
{/if}

<style>
  .note {
    margin: 0 0 14px;
    font-size: 14px;
    color: var(--muted);
  }

  .note.err {
    color: var(--danger-text);
  }
</style>
