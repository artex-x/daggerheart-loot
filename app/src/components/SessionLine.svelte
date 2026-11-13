<script lang="ts">
  /* Who is signed in: the email in bold and «через <provider>» with its logo. The account
     page's «Способы входа» and the consent card's «Аккаунт» draw it. */
  import ProviderLogo from './ProviderLogo.svelte';
  import { PROVIDER_NAME } from './providers.js';
  import type { Dict } from '../lib/dict.js';
  import type { Session } from '../ports/index.js';

  interface Props {
    t: Dict;
    session: Session;
  }

  const { t, session }: Props = $props();
</script>

<div class="who">
  {#if session.email}<b>{session.email}</b>{/if}
  {#if session.provider}
    <span class="via"
      ><ProviderLogo provider={session.provider} />{t.via.replace(
        '%s',
        PROVIDER_NAME[session.provider]
      )}</span
    >
  {/if}
</div>

<style>
  .who {
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    overflow-wrap: anywhere;
  }

  .who b {
    font-size: var(--t-body);
    font-weight: 650;
  }

  .via {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--t-data);
    color: var(--muted);
  }

  .via :global(svg) {
    width: 15px;
    height: 15px;
    flex: none;
  }
</style>
