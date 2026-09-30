<script lang="ts">
  /* The card's pick row on the record page and in the record modal: add to a
     list, print, and «Изменить» on an own item (docs/specs/FEATURES.md,
     "Records"). Extracted on its third change; both inline copies went. */
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { homebrewItemHash, printHash } from '../lib/hash.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    it: Record_;
    /** The add-to-list menu opens inside the record modal. */
    inModal?: boolean;
  }

  const { app, it, inModal = false }: Props = $props();
</script>

<AddToList {app} key={it.id} ids={[it.id]} primary {inModal} />
<Button size="sm" href={printHash([it.id])} sameTab title={app.t.printHint}
  ><Icon name="print" />{app.t.print}</Button
>
{#if app.homebrew?.has(it.id)}
  <Button size="sm" href={homebrewItemHash(it.id)} sameTab>{app.t.edit}</Button>
{/if}
