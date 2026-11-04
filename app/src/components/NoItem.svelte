<script lang="ts">
  /* The not-found page of the two item routes, `/i/<id>` and `/h/<uuid>`. The address
     is drawn as text, cut so that a long one stays a sentence (docs/specs/FEATURES.md,
     "Records"). */
  import Button from './Button.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import { shortPath } from '../lib/address.js';
  import { sectionHash } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** Says the title through its own status region; off where the page's region says
     *  it, as for an item lost while open. */
    said?: boolean | undefined;
  }

  const { app, said = true }: Props = $props();

  const t = $derived(app.t);
  const address = $derived(shortPath(app.hash, app.lang));
  const parts = $derived(t.noItemSub.split('%s'));
</script>

<ErrorPage title={t.noItem} {said}>
  {parts[0]}<code>{address}</code>{parts[1]}
  {#snippet actions()}
    <Button variant="primary" href={app.href(sectionHash('search'))} sameTab
      >{t.findItem}</Button
    >
    <Button href={app.href(sectionHash('tables'))} sameTab>{t.openTables}</Button>
  {/snippet}
</ErrorPage>
