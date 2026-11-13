<script lang="ts">
  /* The way in: a button per provider and the terms the sign-in accepts. The account page
     draws it signed out, and so does the consent page, whose sign-in comes back to the
     same request (docs/specs/FEATURES.md, "Account" and "Connect an app"). */
  import Button from './Button.svelte';
  import Field from './Field.svelte';
  import Panel from './Panel.svelte';
  import ProviderLogo from './ProviderLogo.svelte';
  import { PROVIDER_NAME, PROVIDERS } from './providers.js';
  import type { SignInAfter } from '../lib/pending.js';
  import type { Provider } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The page the sign-in returns to; without it, the prompt that led to the account
     *  page (`app.signInFor`). */
    after?: SignInAfter | undefined;
  }

  const { app, after }: Props = $props();

  const t = $derived(app.t);
  let going = $state<Provider | null>(null);

  /* The port saves the way back and leaves for the provider; the fake signs in in place. */
  async function signIn(p: Provider): Promise<void> {
    if (going) return;
    going = p;
    if (after) app.signInFor = after;
    try {
      const r = await app.signIn(p);
      if (!r.ok) app.say((t) => t.accountFailed, { error: true });
    } finally {
      going = null;
    }
  }
</script>

<Panel style="margin-top:16px" primary>
  <Field label={t.signIn} heading>
    <div class="row-btns">
      {#each PROVIDERS as p (p)}
        <Button
          disabled={going !== null}
          onclick={() => {
            void signIn(p);
          }}
          ><ProviderLogo provider={p} />{(going === p ? t.redirecting : t.signInWith).replace(
            '%s',
            PROVIDER_NAME[p]
          )}</Button
        >
      {/each}
    </div>
    <p class="hint">
      {t.consentBefore}<a href={app.pagesDir + 'terms.html'}>{t.consentTerms}</a
      >{t.consentMid}<a href={app.pagesDir + 'privacy.html'}>{t.consentPrivacy}</a
      >{t.consentAfter}
    </p>
  </Field>
</Panel>

<style>
  .row-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hint {
    margin: 10px 0 0;
    font-size: var(--t-data);
    color: var(--muted);
  }
</style>
