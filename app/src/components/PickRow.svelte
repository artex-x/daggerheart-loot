<script lang="ts">
  /* The action row on the record page, in the record dialog and on `#/h/`: «В список»,
     «Поделиться», «Печать», «Изменить» on an own item, and «Ещё», which holds the copies and
     «Сохранить себе» on another account's item and on a catalog record; its second line
     names what changes, tied to the item by `aria-describedby`; each press makes one more
     copy (docs/specs/FEATURES.md, "Records").
     Signed out the press opens the sign-in prompt under the row, and the copy is made once
     the sign-in comes back and the account's items are read. «Печать» makes a print set
     and opens `#/p/<id>`; signed out it opens its own sign-in prompt under the row, and the
     set is made once the sign-in comes back (docs/specs/FEATURES.md, "Print"). */
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import RecordActions from './RecordActions.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import { homebrewItemHash, itemHash, recordHref } from '../lib/hash.js';
  import { isHomebrewRecord } from '../lib/homebrew.js';
  import { printAction } from '../lib/pending.js';
  import type { Index } from '../lib/data.js';
  import type { ShareBlock } from '../lib/share.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    it: Record_;
    index: Index;
    /** The list entry's note, carried into a copy made in the record modal. */
    extra?: readonly ShareBlock[] | undefined;
    /** The add-to-list menu opens inside the record modal. */
    inModal?: boolean;
    /** On `#/h/`, whether the reader is the item's author; undefined elsewhere. */
    owner?: boolean | undefined;
  }

  const { app, it, index, extra, inModal = false, owner }: Props = $props();

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
  const menuId = $derived(`rec-more-${inModal ? 'm' : 'p'}-${ref}`);
  const second = $derived(
    toLists ? t.saveItemNoteList : app.newListTarget === 'prompt' ? t.saveItemSignIn : ''
  );
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

<AddToList {app} key={it.id} ids={[it.id]} primary size="md" {inModal} />
<RecordActions {app} {index} {it} row="share" {extra} />
{#if app.printTarget !== 'none'}
  <Button
    title={t.printHint}
    disabled={app.printing || app.printTarget === 'wait'}
    expanded={app.printTarget === 'prompt' ? printAsking : undefined}
    onclick={pressPrint}><Icon name="print" />{t.print}</Button
  >
{/if}
{#if app.homebrew?.has(it.id) && !foreign}
  <Button href={app.href(homebrewItemHash(it.id))} sameTab><Icon name="note" />{t.edit}</Button>
{/if}
<MoreMenu {app} id={menuId} flip={inModal}>
  {#snippet children(close: () => void)}
    <RecordActions {app} {index} {it} row="menu" {extra} onpicked={close} />
    {#if offered}
      <div role="separator" class="msep"></div>
      <button
        type="button"
        role="menuitem"
        tabindex="-1"
        disabled={app.savingItem === ref || app.newListTarget === 'wait'}
        aria-labelledby="{noteId}-l"
        aria-describedby={second ? noteId : undefined}
        onclick={() => {
          close();
          press();
        }}
      >
        <Icon name="plus" />
        <span class="mit">
          <span id="{noteId}-l">{t.saveItem}</span>
          {#if second}<small id={noteId}>{second}</small>{/if}
        </span>
      </button>
    {/if}
  {/snippet}
</MoreMenu>
{#if offered && asking && app.newListTarget === 'prompt'}
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
  .msep {
    height: 1px;
    margin: 4px 0;
    background: var(--line);
  }

  .mit small {
    display: block;
    max-width: 28ch;
    font-size: var(--t-data);
    font-weight: 400;
    color: var(--muted2);
  }

  .saveprompt {
    flex-basis: 100%;
    grid-column: 1 / -1;
  }

  .saveprompt :global(.signin.boxed) {
    margin-bottom: 0;
  }
</style>
