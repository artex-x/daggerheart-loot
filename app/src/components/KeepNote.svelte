<script lang="ts">
  /* The line under the print bar or the tables toolbar while a page switch
   * differs from its default: the pick lasts until a reload, and the default
   * is set on `#/account` (docs/specs/FEATURES.md, "Account"). A build
   * without sign-in has no place to set a default, so it draws nothing. */
  import { ACCOUNT_HASH } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  const { app }: { app: AppState } = $props();

  const t = $derived(app.t);
</script>

{#if app.env.cloud}
  <!-- Not `.printnote`: tests/app/print.js counts those on the print page. -->
  <p class="keepnote">{t.keepBefore}<a href={ACCOUNT_HASH}>{t.keepLink}</a>{t.keepAfter}</p>
{/if}

<style>
  .keepnote {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
