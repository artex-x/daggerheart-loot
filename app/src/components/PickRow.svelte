<script lang="ts">
  /* The card's pick row on the record page, in the record modal and on `#/h/`: add to a
     list, print, «Изменить» on an own item, and «Сохранить себе» on another account's item
     with a line under the row saying what the copy does (docs/specs/FEATURES.md, "Records").
     Signed out the press opens the sign-in prompt under the row, and the copy is made once
     the sign-in comes back and the account's items are read. */
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import { homebrewItemHash, itemHash, printHash } from '../lib/hash.js';
  import { isHomebrewRecord } from '../lib/homebrew.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    it: Record_;
    /** The add-to-list menu opens inside the record modal. */
    inModal?: boolean;
    /** On `#/h/`, whether the reader is the item's author; undefined elsewhere. */
    owner?: boolean | undefined;
  }

  const { app, it, inModal = false, owner }: Props = $props();

  const t = $derived(app.t);
  const hid = $derived(isHomebrewRecord(it) ? it.hid : undefined);
  const foreign = $derived(owner === undefined ? app.isForeignItem(it) : !owner);
  const offered = $derived(
    !!app.env.cloud && foreign && typeof hid === 'string' && isHomebrewRecord(it)
  );
  const saved = $derived(!!app.homebrew?.has(it.id));
  const toLists = $derived(offered && app.relinkTargets(it).length > 0);
  let asking = $state(false);

  function press(): void {
    const target = app.newListTarget;
    if (target === 'prompt') asking = !asking;
    else if (target === 'cloud' && isHomebrewRecord(it)) void app.saveItem(it);
  }

  /* The copy a sign-in left for this item, once the account's items are read. */
  $effect(() => {
    if (!offered || !isHomebrewRecord(it) || app.saveItemFor !== hid) return;
    const status = app.homebrew?.status;
    if (status === 'ready') {
      app.saveItemFor = null;
      void app.saveItem(it);
    } else if (status === 'error') {
      app.saveItemFor = null;
      app.say((t) => t.hbLoadFailed, { error: true });
    }
  });
</script>

<AddToList {app} key={it.id} ids={[it.id]} primary {inModal} />
{#if owner !== false}
  <Button size="sm" href={printHash([it.id])} sameTab title={t.printHint}
    ><Icon name="print" />{t.print}</Button
  >
{/if}
{#if app.homebrew?.has(it.id) && !foreign}
  <Button size="sm" href={homebrewItemHash(it.id)} sameTab>{t.edit}</Button>
{/if}
{#if offered && typeof hid === 'string'}
  <Button
    size="sm"
    disabled={saved || app.savingItem === hid || app.newListTarget === 'wait'}
    expanded={app.newListTarget === 'prompt' ? asking : undefined}
    onclick={press}>{saved ? t.saveItemDone : t.saveItem}</Button
  >
  {#if !saved}
    <p class="savenote">{toLists ? t.saveItemNoteList : t.saveItemNote}</p>
  {/if}
  {#if asking && app.newListTarget === 'prompt'}
    <div class="saveprompt">
      <SignInPrompt
        {app}
        lead={t.signInToSaveItem}
        after={{ hash: inModal ? itemHash(hid) : app.hash, action: { do: 'saveItem', hid } }}
        boxed
      />
    </div>
  {/if}
{/if}

<style>
  .savenote {
    flex-basis: 100%;
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .saveprompt {
    flex-basis: 100%;
  }

  .saveprompt :global(.signin.boxed) {
    margin-bottom: 0;
  }
</style>
