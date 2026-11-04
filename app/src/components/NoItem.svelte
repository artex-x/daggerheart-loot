<script lang="ts">
  /* The not-found page of the two item routes, `/i/<id>` and `/h/<uuid>`. The address
     is drawn as text, cut so that a long one stays a sentence (docs/specs/FEATURES.md,
     "Records"). */
  import Button from './Button.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import { pathOf } from '../lib/address.js';
  import { sectionHash } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  const ADDRESS_MAX = 80;

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const address = $derived.by(() => {
    const path = pathOf(app.hash, app.lang);
    return path.length > ADDRESS_MAX ? path.slice(0, ADDRESS_MAX) + '...' : path;
  });
  const parts = $derived(t.noItemSub.split('%s'));
</script>

<ErrorPage title={t.noItem}>
  {parts[0]}<code>{address}</code>{parts[1]}
  {#snippet actions()}
    <Button variant="primary" href={app.href(sectionHash('search'))} sameTab
      >{t.findItem}</Button
    >
    <Button href={app.href(sectionHash('tables'))} sameTab>{t.openTables}</Button>
  {/snippet}
</ErrorPage>
