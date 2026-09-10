<script lang="ts">
  /* The add-to-list control: a button and the menu it opens, off
     `addToListBtn`/`listMenuHTML` in app.js (1879-1891, 1831-1859) and
     `.seldrop`/`.dropmenu` in style.css.

     One component, menu included - `listMenuHTML` has one caller, and a
     separate `ListMenu.svelte` would be an abstraction ahead of need. `key`
     is the opener (a record id on a card today; the bar and a shared page
     will pass their own once they exist), `ids` is what a chip acts on. */
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import Icon from './Icon.svelte';
  import type { StoredList } from '../lib/lists.js';
  import type { AppState } from '../state/app.svelte.js';

  /** `S.lists.length >= PICKER_SEARCH_AT` in app.js - the picker grows a
   *  search box once there are more lists than fit without one. */
  const PICKER_SEARCH_AT = 8;

  interface Props {
    app: AppState;
    key: string;
    ids: readonly string[];
    /** The card's own control is primary; a future bar's is not. */
    primary?: boolean;
  }

  const { app, key, ids, primary }: Props = $props();

  const t = $derived(app.t);
  const open = $derived(app.menuFor === key);
  /* A single record's menu names it - `t.inLists` even where it lies in no
     list at all, matching the live app's own reading of `listMenuHTML`. */
  const one = $derived(ids.length === 1 ? ids[0] : undefined);
  const label = $derived(one !== undefined ? t.inLists : t.addTo);

  /* Newest first, off `listMenuHTML`'s own `created` descending sort. */
  const sorted = $derived(
    [...app.lists.lists].sort((a, b) => (b.created ?? 0) - (a.created ?? 0))
  );
  const showSearch = $derived(sorted.length >= PICKER_SEARCH_AT);

  let pickQ = $state('');
  const query = $derived(pickQ.trim().toLowerCase());
  const shown = $derived(
    query ? sorted.filter((l) => l.name.toLowerCase().includes(query)) : sorted
  );

  const inList = (l: StoredList): boolean => one !== undefined && l.ids.includes(one);

  let newListFor = $state(false);
  let draft = $state('');
  let newInput = $state<HTMLInputElement | undefined>(undefined);

  let root = $state<HTMLDivElement | undefined>(undefined);
  let up = $state(false);

  function toggle(): void {
    app.menuFor = open ? '' : key;
    newListFor = false;
  }

  /* `ListStore.save()` already says `saveFailed` itself on a refusal - a
     success message must not be shown on top of it, or the two would race
     for the same toast and the failure would never be seen. app.js's own
     `addIdsTo` shows both unconditionally, one after the other on the same
     tick, which means the success message always wins there and a refusal
     is never actually seen - not reproduced here, since the acceptance this
     batch is held to is that a refusal is seen. */
  function pick(l: StoredList): void {
    if (one !== undefined && l.ids.includes(one)) {
      app.lists.removeId(l, one);
      if (app.lists.save()) app.say(t.removedFrom.replace('%s', l.name));
      return;
    }
    const knows = (id: string): boolean => !!app.index?.byId.has(id);
    const fresh = app.lists.addIds(l, ids, knows);
    if (app.lists.save()) {
      app.say(
        t.addedTo.replace('%s', l.name) + (ids.length > 1 ? ': ' + String(fresh.length) : '')
      );
    }
  }

  function openNew(): void {
    newListFor = true;
    draft = '';
  }

  function cancelNew(): void {
    newListFor = false;
    draft = '';
  }

  function createNew(): void {
    const name = draft.trim();
    if (!name) {
      app.say(t.nameFirst, { error: true });
      newInput?.focus();
      return;
    }
    const l = app.lists.create(draft);
    const knows = (id: string): boolean => !!app.index?.byId.has(id);
    const fresh = app.lists.addIds(l, ids, knows);
    if (app.lists.save()) {
      app.say(
        t.addedTo.replace('%s', l.name) + (ids.length > 1 ? ': ' + String(fresh.length) : '')
      );
    }
    newListFor = false;
    draft = '';
  }

  /* Focuses the new-list input the moment its form appears - the live app's
     own `focusNew()`, called right after the form is drawn. */
  $effect(() => {
    if (newListFor && newInput) newInput.focus();
  });

  /* `placeMenu` in app.js, run after every render while the menu is open:
     flip it to whichever side has room, then scroll it into view. Reads
     `shown.length` and `newListFor` too, because either can change the
     menu's height without changing `open` itself. */
  $effect(() => {
    if (!open) return;
    void shown.length;
    void newListFor;
    void tick().then(() => {
      if (!root) return;
      const menu = root.querySelector<HTMLElement>('.dropmenu');
      const btn = root.querySelector<HTMLElement>('.btn');
      if (!menu || !btn) return;
      const below = window.innerHeight - btn.getBoundingClientRect().bottom;
      const need = menu.getBoundingClientRect().height + 16;
      up = below < need;
      menu.scrollIntoView({ block: 'nearest' });
    });
  });

  /* Any click outside `.seldrop`/`.dropmenu` closes the menu - checked
     against `app.menuFor === key` at the moment the click arrives, so a press
     on another control's own button - whose handler has already switched
     `menuFor` to its key - is never undone here; that instance's own `open`
     has already gone false through the derivation above.

     `key` is a prop derived from the record this control belongs to
     (`key={it.id}` on the caller's side), and a click that closes the modal
     the record was shown in - the close button, the backdrop - sets that
     record to null on the same synchronous pass this handler runs in:
     reactive reads see it immediately, but this component's own listener is
     not torn down until Svelte's next flush. Reading `key` in that instant
     throws; there is nothing to close by then anyway, since the modal and
     everything in it is already on its way out. */
  function onDocumentClick(e: MouseEvent): void {
    let mine: string;
    try {
      mine = key;
    } catch {
      return;
    }
    if (app.menuFor !== mine) return;
    if (root && e.target instanceof Node && root.contains(e.target)) return;
    app.menuFor = '';
    newListFor = false;
  }
</script>

<svelte:document onclick={onDocumentClick} />

<div class="seldrop" bind:this={root}>
  {#if open}
    <div class="dropmenu" class:long={showSearch} class:up>
      <span class="lbl">{label}</span>
      {#if showSearch}
        <input
          type="search"
          class="pickq"
          value={pickQ}
          placeholder={t.findList}
          aria-label={t.findList}
          oninput={(e) => {
            pickQ = e.currentTarget.value;
          }}
        />
      {/if}
      <div class="pickchips">
        {#if shown.length}
          {#each shown as l (l.id)}
            <Chip
              label={(inList(l) ? '✓ ' : '') + l.name}
              on={inList(l)}
              onclick={() => {
                pick(l);
              }}
            />
          {/each}
        {:else}
          <span class="picker-none">{t.nothing}</span>
        {/if}
      </div>
      {#if newListFor}
        <span class="picker-new">
          <input
            type="text"
            bind:this={newInput}
            value={draft}
            placeholder={t.listNamePh}
            oninput={(e) => {
              draft = e.currentTarget.value;
            }}
          />
          <Button size="sm" variant="primary" onclick={createNew}>{t.create}</Button>
          <Button size="sm" variant="ghost" onclick={cancelNew}>{t.cancel}</Button>
        </span>
      {:else}
        <Chip label={'+ ' + t.newList} on={false} onclick={openNew} />
      {/if}
    </div>
  {/if}
  <Button
    size="sm"
    variant={primary ? 'primary' : 'plain'}
    on={open}
    expanded={open}
    caret
    onclick={toggle}><Icon name="plus" />{t.addToList}</Button
  >
</div>

<style>
  /* off `.seldrop`/`.dropmenu` in style.css - the add-to-list menu, shared by
     the card and the selection bar. The base rule below (`bottom: calc(100% +
     8px)`) opens upward, which is the bar's own default - `placeMenu` in
     app.js always adds `up` at the bottom of the window, and style.css has no
     base `.dropmenu.up` rule to flip it, only `.cardpick .dropmenu.up`. The
     card's own `.cardpick :global(.dropmenu)` rules in RecordCard.svelte are
     what flip which side the card's copy opens on. */
  .seldrop {
    position: relative;
  }

  .dropmenu {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    min-width: 230px;
    max-width: min(320px, 90vw);
    z-index: 60;
    border: 1px solid var(--line2);
    border-radius: 11px;
    background: var(--surface);
    padding: 10px;
    box-shadow: 0 16px 40px -14px rgb(0 0 0 / 85%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: pop 0.16s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.985);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  /* off `.dropmenu .lbl` - a third copy of `.lbl`, after Field.svelte's and
     FilterBar.svelte's; extract only once a fourth wants it. */
  .lbl {
    display: block;
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 2px;
  }

  .dropmenu :global(.chip) {
    width: 100%;
    text-align: left;
    font-size: 13px;
  }

  /* off `.dropmenu.long` - the picker grows a search box once there are more
     lists than fit without one. */
  .dropmenu.long {
    max-height: min(60vh, 340px);
    overflow: auto;
  }

  input.pickq {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    margin-bottom: 8px;
    box-sizing: border-box;
    background: var(--bg2);
    border: 1px solid var(--line2);
    border-radius: 8px;
    color: var(--txt);
    font: inherit;
    font-size: 13px;
  }

  input.pickq:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  .pickchips {
    display: contents;
  }

  .picker-none {
    font-size: 12.5px;
    color: var(--muted2);
    padding: 2px 0;
  }

  .picker-new {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
  }

  .picker-new input {
    flex: 1;
    min-width: 150px;
    height: 32px;
    padding: 0 11px;
    border-radius: 8px;
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
    font-size: 13px;
  }

  .picker-new input:focus {
    outline: none;
    border-color: var(--gold);
  }

  /* off the 600px block in style.css - the menu grows to fill the width on a
     phone rather than spilling past the edge of the screen. */
  @media (max-width: 600px) {
    .dropmenu {
      left: 0;
      right: 0;
      max-width: none;
    }
  }
</style>
