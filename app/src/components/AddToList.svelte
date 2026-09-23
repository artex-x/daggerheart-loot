<script lang="ts">
  /* The add-to-list control: a button and the menu it opens, off
     `addToListBtn`/`listMenuHTML` in app.js (1879-1891, 1831-1859) and
     `.seldrop`/`.dropmenu` in style.css.

     One component, menu included - `listMenuHTML` has one caller, and a
     separate `ListMenu.svelte` would be an abstraction ahead of need. `key`
     is the opener: a record id on a card, or the selection bar's own key.
     `ids` is what a chip acts on. */
  import { tick, flushSync } from 'svelte';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import Icon from './Icon.svelte';
  import type { ListEntryMeta } from '../lib/listLink.js';
  import {
    itemMeta,
    LIST_SEARCH_AT,
    matchLists,
    pickerOrder,
    type StoredList
  } from '../lib/lists.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    key: string;
    ids: readonly string[];
    /** The card's own control is primary; a future bar's is not. */
    primary?: boolean;
    /** The meta to copy along in place of the shared page's own - the bar's taken counts. */
    meta?: Readonly<Record<string, ListEntryMeta>> | undefined;
  }

  const { app, key, ids, primary, meta }: Props = $props();

  const t = $derived(app.t);
  const open = $derived(app.menuFor === key);
  /* Non-null exactly where the live `metaForKey` would return `S.shared.meta`
     for this key - `app.shared` is the route gate, set only while the shared
     page is mounted. */
  const shared = $derived(app.shared);
  const carried = $derived(meta ?? shared?.meta);
  /* A single record's menu names it - `t.inLists` even where it lies in no
     list at all, matching the live app's own reading of `listMenuHTML`. */
  const one = $derived(ids.length === 1 ? ids[0] : undefined);
  const label = $derived(one !== undefined ? t.inLists : t.addTo);

  /* Taken when the menu opens, so a pressed chip keeps its place until the
     menu opens again: the lists holding `one`, and every list there was. */
  let held = $state.raw(new Set<string>());
  let known = $state.raw(new Set<string>());

  /* Newest first, off `listMenuHTML`'s own `created` descending sort; a
     one-record menu puts the lists holding the record first (issue 68), and
     a list created while it is open joins them. */
  const sorted = $derived(
    pickerOrder(
      app.lists.lists,
      (l) => one !== undefined && (held.has(l.id) || !known.has(l.id))
    )
  );
  const showSearch = $derived(sorted.length >= LIST_SEARCH_AT);

  let pickQ = $state('');
  const shown = $derived(showSearch ? matchLists(sorted, pickQ) : sorted);

  const inList = (l: StoredList): boolean => one !== undefined && l.ids.includes(one);

  let newListFor = $state(false);
  let draft = $state('');
  let newInput = $state<HTMLInputElement | undefined>(undefined);

  let root = $state<HTMLDivElement | undefined>(undefined);
  let up = $state(false);

  function toggle(): void {
    if (!open) {
      const all = app.lists.lists;
      const record = one;
      known = new Set(all.map((l) => l.id));
      held = new Set(
        record === undefined ? [] : all.filter((l) => l.ids.includes(record)).map((l) => l.id)
      );
    }
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
      const entryId = one;
      const at = l.ids.indexOf(entryId);
      const meta = { ...itemMeta(l, entryId) };
      app.lists.removeId(l, entryId);
      if (app.lists.save()) {
        /* P5: every other destructive action here offers an undo -
           `restoreEntry` is the same one the list page's own row-remove
           cross already uses. */
        app.say(t.removedFrom.replace('%s', l.name), {
          action: {
            label: t.undo,
            run: () => {
              app.lists.restoreEntry(l.id, entryId, at, meta);
            }
          }
        });
      }
      return;
    }
    const knows = (id: string): boolean => !!app.index?.byId.has(id);
    const fresh = app.lists.addIds(l, ids, knows, carried);
    if (app.lists.save()) {
      app.say(
        t.addedTo.replace('%s', l.name) + (ids.length > 1 ? ': ' + String(fresh.length) : '')
      );
    }
  }

  /* The search already holds the name a person looked for and did not find. */
  function openNew(): void {
    newListFor = true;
    draft = showSearch ? pickQ.trim() : '';
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
    const fresh = app.lists.addIds(l, ids, knows, carried);
    if (app.lists.save()) {
      app.say(
        t.addedTo.replace('%s', l.name) + (ids.length > 1 ? ': ' + String(fresh.length) : '')
      );
    }
    newListFor = false;
    draft = '';
    pickQ = '';
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
    /* app.js redraws the menu's markup on every render, so `placeMenu` always
       measures from the default (downward) side; re-measuring from wherever
       the menu already sits reads a different `below` and can flip the wrong
       way once the form grows the menu (DEBT.md D6). */
    up = false;
    void tick().then(() => {
      if (!root) return;
      const menu = root.querySelector<HTMLElement>('.dropmenu');
      /* D6, paid off: the toggle, not whichever `.btn` happens to render
         first - `.dropmenu` now sits after the toggle in the markup, but
         `:scope >` makes the intent explicit rather than relying on order. */
      const btn = root.querySelector<HTMLElement>(':scope > .btn');
      if (!menu || !btn) return;
      /* D6, paid off: measured against the tightest clipping box - the
         record card (`overflow: clip` in RecordCard.svelte), the modal's own
         card, the window - rather than always against the window, which let
         `scrollIntoView` look for room past the modal's edge and drag the
         card's scroll position along, and let a menu on a record page at 360
         wide open down past the card and lose its lower part (issue 68). */
      const from = root;
      const clipBottom = Math.min(
        window.innerHeight,
        ...['.card', '.modal-card'].map(
          (sel) => from.closest(sel)?.getBoundingClientRect().bottom ?? Infinity
        )
      );
      const below = clipBottom - btn.getBoundingClientRect().bottom;
      const need = menu.getBoundingClientRect().height + 16;
      up = below < need;
      /* `classList.toggle` precedes `scrollIntoView` in `placeMenu` - the class
         has to be on the menu before it is scrolled into view. */
      flushSync();
      menu.scrollIntoView({ block: 'nearest' });
    });
  });

  /* P4(a): Escape closes the menu and returns focus to the toggle that
     opened it, the way any other disclosure on this page already does -
     without it, the browser's own default (nothing, since a plain `<div>`
     menu has no dismissal of its own) left a keyboard user with no way out
     but Tab. A `<svelte:window>` listener rather than one on `.seldrop`
     itself - a `<div>` with its own key handler is a non-interactive
     element eslint-plugin-svelte's a11y rules flag either way (a role that
     satisfies one rule trips the other), and `app.menuFor` is a single
     global value, so only the one instance whose own menu is actually open
     ever does anything here. `preventDefault` on top of the early return -
     not `stopPropagation`, which only matters between listeners on the same
     target - keeps the record modal's own native Escape-to-close from also
     firing on the same press when this menu is open inside it; a second,
     unclaimed Escape then closes the modal normally. */
  function onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Escape' || !open) return;
    e.preventDefault();
    app.menuFor = '';
    newListFor = false;
    root?.querySelector<HTMLElement>(':scope > .btn')?.focus();
  }

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
    /* A trusted click runs a microtask checkpoint after each listener; Svelte 5
       flushes state in that microtask (svelte/src/internal/client/dom/task.js).
       Between the app root's delegated handler (which can flip `newListFor` or
       close the modal) and this document listener, the `{#if}` block that held
       the pressed control may have already replaced it - `e.target` is then
       detached from the document, `root.contains(e.target)` reads false, and
       the menu closes under its own click. A detached target was either
       inside this control or was removed by the same flush; the guard cannot
       tell them apart, so an outside click whose target Svelte removes during
       the flush (a filter pill's cross, a toast's undo) leaves the menu open
       where the live app closes it. No reachable path to that case was found
       - `RecordModal.svelte`'s close and `app.svelte.ts`'s `menuFor = ''` on
       modal close and navigation cover the known ones - and `onclickcapture`,
       which would decide "inside?" before any mutation, is the recorded
       fallback if one is. */
    if (root && e.target instanceof Node && !e.target.isConnected) return;
    if (root && e.target instanceof Node && root.contains(e.target)) return;
    app.menuFor = '';
    newListFor = false;
  }
</script>

<svelte:document onclick={onDocumentClick} />
<svelte:window onkeydown={onKeydown} />

<div class="seldrop" bind:this={root}>
  <Button
    size="sm"
    variant={primary ? 'primary' : 'plain'}
    on={open}
    expanded={open}
    caret
    onclick={toggle}><Icon name="plus" />{t.addToList}</Button
  >
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
            aria-label={t.newList}
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
     lists than fit without one. Only the chips scroll, so the label, the
     search and «+ Новый список» stay in view (issue 68). */
  .dropmenu.long {
    max-height: min(60vh, 340px);
  }

  .dropmenu > :global(*) {
    flex-shrink: 0;
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

  /* The padding and the equal negative margin keep a chip's 2px + 2px focus
     ring (tokens.css) inside the scroll box, which would clip it. */
  .pickchips {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px;
    margin: -4px;
  }

  .dropmenu.long > .pickchips {
    overflow: auto;
    min-height: 0;
    flex: 1 1 auto;
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
