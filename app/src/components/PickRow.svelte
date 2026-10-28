<script lang="ts">
  /* The card's pick row on the record page, in the record modal and on `#/h/`: add to a
     list, print, «Изменить» on an own item, and «Сохранить себе» on another account's item
     and on a catalog record, in a group of its own with the note saying what the copy does,
     tied to the button by `aria-describedby`; each press makes one more copy
     (docs/specs/FEATURES.md, "Records").
     Signed out the press opens the sign-in prompt under the row, and the copy is made once
     the sign-in comes back and the account's items are read. «Печать» makes a print set
     and opens `#/p/<id>`; signed out it opens its own sign-in prompt under the row, and the
     set is made once the sign-in comes back (docs/specs/FEATURES.md, "Print"). */
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import { homebrewItemHash, itemHash, recordHref } from '../lib/hash.js';
  import { isHomebrewRecord } from '../lib/homebrew.js';
  import { printAction } from '../lib/pending.js';
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
  /* What «Сохранить себе» copies: another account's item by its row id, a catalog record by
     its id. */
  const ref = $derived(hid ?? it.id);
  const foreign = $derived(owner === undefined ? app.isForeignItem(it) : !owner);
  const offered = $derived(
    !!app.env.cloud &&
      (isHomebrewRecord(it) ? foreign && typeof hid === 'string' : app.catalogCopyOffered)
  );
  const toLists = $derived(offered && app.relinkTargets(it).length > 0);
  /* The page can draw the row twice (the page and the record modal over it). */
  const noteId = $derived(`savenote-${inModal ? 'm' : 'p'}-${ref}`);
  let asking = $state(false);
  let printAsking = $state(false);

  function pressPrint(): void {
    const target = app.printTarget;
    if (target === 'prompt') printAsking = !printAsking;
    else if (target === 'cloud') void app.print([it.id]);
  }

  function press(): void {
    const target = app.newListTarget;
    if (target === 'prompt') asking = !asking;
    else if (target === 'cloud') void app.saveItem(it);
  }

  /* The copy a sign-in left for this record, once the account's items are read. Not gated
     on `offered`, which waits for that read: a failed read must still say so. */
  $effect(() => {
    if (!app.env.cloud || !app.user || app.saveItemFor !== ref) return;
    const status = app.homebrew?.status;
    if (status === 'ready') {
      app.saveItemFor = null;
      if (offered) void app.saveItem(it);
    } else if (status === 'error') {
      app.saveItemFor = null;
      app.say((t) => t.hbLoadFailed, { error: true });
    }
  });
</script>

<AddToList {app} key={it.id} ids={[it.id]} primary {inModal} />
{#if app.printTarget !== 'none'}
  <Button
    size="sm"
    title={t.printHint}
    disabled={app.printing || app.printTarget === 'wait'}
    expanded={app.printTarget === 'prompt' ? printAsking : undefined}
    onclick={pressPrint}><Icon name="print" />{t.print}</Button
  >
{/if}
{#if app.homebrew?.has(it.id) && !foreign}
  <Button size="sm" href={app.href(homebrewItemHash(it.id))} sameTab>{t.edit}</Button>
{/if}
{#if offered}
  <div class="savegroup">
    <Button
      size="sm"
      disabled={app.savingItem === ref || app.newListTarget === 'wait'}
      expanded={app.newListTarget === 'prompt' ? asking : undefined}
      describedby={noteId}
      onclick={press}>{t.saveItem}</Button
    >
    <p class="savenote" id={noteId}>{toLists ? t.saveItemNoteList : t.saveItemNote}</p>
  </div>
  {#if asking && app.newListTarget === 'prompt'}
    <div class="saveprompt">
      <SignInPrompt
        {app}
        lead={t.signInToSaveItem}
        after={{
          hash: inModal ? (hid ? itemHash(hid) : recordHref(it)) : app.hash,
          action: hid ? { do: 'saveItem', hid } : { do: 'saveItem', id: it.id }
        }}
        boxed
      />
    </div>
  {/if}
{/if}
{#if printAsking && app.printTarget === 'prompt'}
  <div class="saveprompt">
    <SignInPrompt
      {app}
      lead={t.signInToPrint}
      after={{
        hash: inModal ? recordHref(it) : app.hash,
        action: printAction(app.printEntriesOf([it.id]))
      }}
      boxed
    />
  </div>
{/if}

<style>
  /* A line of its own under the other pick buttons; the note beside the button where at
     least 16em fit, else under it. */
  .savegroup {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .savenote {
    flex: 1 1 16em;
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
