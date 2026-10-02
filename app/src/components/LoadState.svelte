<script lang="ts">
  /* An account read in flight, or failed with «Повторить»: one shape for every load line
     (docs/specs/FEATURES.md, "Consistency rules", rule 6). `page` makes the retry primary
     where the failure is all the page holds. */
  import Button from './Button.svelte';
  import type { Dict } from '../lib/dict.js';

  interface Props {
    t: Dict;
    failed: boolean;
    /** The failure line; the loading line is always `cloudLoading`. */
    text: string;
    onretry: () => void;
    page?: boolean;
  }

  const { t, failed, text, onretry, page = false }: Props = $props();
</script>

{#if failed}
  <p class="note err" role="alert">{text}</p>
  {#if page}
    <Button variant="primary" onclick={onretry}>{t.retry}</Button>
  {:else}
    <Button size="sm" onclick={onretry}>{t.retry}</Button>
  {/if}
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
