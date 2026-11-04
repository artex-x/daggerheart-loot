<script lang="ts">
  /* The page of an address this build reads but draws nothing for: an old list link, and
     a route that needs sign-in in a build without it (docs/specs/ROUTES.md). The address
     is kept and quoted as text, cut so that a long one stays a sentence. */
  import Button from './Button.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import { shortPath } from '../lib/address.js';
  import { sectionHash } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const parts = $derived(t.nowhereSub.split('%s'));
</script>

<ErrorPage title={t.nowhereTitle} said>
  {parts[0]}<code>{shortPath(app.hash, app.lang)}</code>{parts[1]}
  {#snippet actions()}
    <Button variant="primary" href={app.href(sectionHash('roll/std'))} sameTab
      >{t.toStart}</Button
    >
    <Button href={app.href(sectionHash('tables'))} sameTab>{t.openTables}</Button>
  {/snippet}
</ErrorPage>
