<script lang="ts">
  /* The add-to-list control: a button and the menu it opens, off
     `addToListBtn`/`listMenuHTML` in `git show 23c00a6^:app.js` and
     `.seldrop`/`.dropmenu` in `git show 23c00a6^:style.css`.

     One component, menu included - `listMenuHTML` has one caller, and a
     separate `ListMenu.svelte` would be an abstraction ahead of need. `key`
     is the opener: a record id on a card, or the selection bar's own key.
     `menuScope` tells the open menu apart where the same record can be drawn
     twice at once. `ids` is what a chip acts on. */
  import { onDestroy, untrack } from 'svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import { focusBack, openOverlay } from './overlay.js';
  import { knownItems, NAME_MAX } from '../lib/cloudLists.js';
  import type { Msg } from '../lib/dict.js';
  import { recordHref } from '../lib/hash.js';
  import { isHomebrewKey } from '../lib/homebrew.js';
  import type { ListEntryMeta } from '../lib/lists.js';
  import {
    itemMeta,
    LIST_SEARCH_AT,
    matchLists,
    pickerOrder,
    type StoredList
  } from '../lib/lists.js';
  import { plural } from '../lib/plural.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    key: string;
    /** Prefixes the open menu's name, where `key` alone would match a second mounted
     *  control: a roll result and the record dialog over it. */
    menuScope?: string | undefined;
    ids: readonly string[];
    /** The card's own control is primary; a future bar's is not. */
    primary?: boolean;
    /** The meta to copy along in place of the shared page's own - the bar's taken counts. */
    meta?: Readonly<Record<string, ListEntryMeta>> | undefined;
    /** Drawn where the address does not hold the record - the record dialog, a roll result
     *  - so a sign-in returns to the record's own page. */
    returnToRecord?: boolean;
    /** The selection bar's control while nothing is ticked. */
    disabled?: boolean;
    /** `md` on the record's action row; the bar and the editor's preview keep `sm`. */
    size?: 'md' | 'sm';
  }

  const {
    app,
    key,
    menuScope,
    ids,
    primary,
    meta,
    returnToRecord = false,
    disabled = false,
    size = 'sm'
  }: Props = $props();

  const t = $derived(app.t);
  const menuName = (): string => (menuScope ? `${menuScope}-${key}` : key);
  const open = $derived(app.menuFor === menuName());
  /* Non-null exactly where the live `metaForKey` would return `S.shared.meta`
     for this key - `app.shared` is the route gate, set only while the shared
     page is mounted. */
  const shared = $derived(app.shared);
  const carried = $derived(meta ?? shared?.meta);
  /* A single record's menu toggles its rows; the selection bar's only adds. */
  const one = $derived(ids.length === 1 ? ids[0] : undefined);

  /* The account's lists, once read; none signed out or before the session is known. */
  const target = $derived(app.newListTarget);
  const all = $derived<StoredList[]>(
    app.cloudLists?.status === 'ready' && target === 'cloud' ? app.cloudLists.lists : []
  );

  /* Taken when the menu opens, so a pressed chip keeps its place until the
     menu opens again: the lists holding `one`, and every list there was. */
  let held = $state.raw(new Set<string>());
  let known = $state.raw(new Set<string>());

  /* Newest first, off `listMenuHTML`'s own `created` descending sort; a
     one-record menu puts the lists holding the record first (issue 68), and
     a list created while it is open joins them. */
  const sorted = $derived(
    pickerOrder(all, (l) => one !== undefined && (held.has(l.id) || !known.has(l.id)))
  );
  const showSearch = $derived(sorted.length >= LIST_SEARCH_AT);

  let pickQ = $state('');
  const shown = $derived(showSearch ? matchLists(sorted, pickQ) : sorted);

  /* The lists holding `one` now: a toggle in the open menu updates it; `held` keeps the
     open-time order only. One pass per change of the lists, not two per chip per draw. */
  const holding = $derived.by(() => {
    const record = one;
    return new Set(
      record === undefined ? [] : all.filter((l) => l.ids.includes(record)).map((l) => l.id)
    );
  });
  const inList = (l: StoredList): boolean => holding.has(l.id);

  let newListFor = $state(false);
  let draft = $state('');
  let newInput = $state<HTMLInputElement | undefined>(undefined);

  let root = $state<HTMLDivElement | undefined>(undefined);

  /* On the rising edge of `open`, whoever opened it - the button, or a
     sign-in that reopens the menu through `app.menuFor`. */
  let wasOpen = false;
  let openName = '';
  $effect.pre(() => {
    const isOpen = open;
    if (isOpen && !wasOpen) {
      untrack(() => {
        const record = one;
        openName = app.menuFor;
        known = new Set(all.map((l) => l.id));
        held = new Set(
          record === undefined ? [] : all.filter((l) => l.ids.includes(record)).map((l) => l.id)
        );
      });
    }
    wasOpen = isOpen;
  });

  /* A press that removes this control - a new roll takes its card away - flushes before the
     click reaches `onDocumentClick`, and a name left in `menuFor` holds the header (Shell). */
  onDestroy(() => {
    if (app.menuFor === openName) app.menuFor = '';
  });

  function toggle(): void {
    app.menuFor = open ? '' : menuName();
    newListFor = false;
  }

  /* A store that refused the write says why itself (`saved` false): a success message
     on top of it would race for the same toast and hide the failure. */
  const knows = (id: string): boolean => app.knows(id);

  /* An add that wrote nothing because a homebrew key was refused says why, not
     «Добавлено»: the list waits for the account's items. */
  function refusedText(): Msg {
    const status = app.homebrew?.status;
    if (status === 'error') return (t) => t.hbLoadFailed;
    if (status !== 'ready') return (t) => t.hbNotReady;
    return (t) => t.hbNotAdded;
  }

  /* After an add from the bar on a share link, signed in and not its owner: flow b
     asks whether to tell the owner, or sends, or not, by the remembered answer. A
     card's own menu never asks. */
  function added(name: string, fresh: readonly string[], held: readonly string[]): void {
    if (!fresh.length && ids.some((id) => isHomebrewKey(id) && !held.includes(id))) {
      app.say(refusedText(), { error: true });
      return;
    }
    const count = ids.length > 1 ? fresh.length : null;
    const text: Msg = (t) =>
      t.addedTo.replace('%s', name) + (count === null ? '' : ': ' + String(count));
    app.say(text);
    const token = app.requestToken;
    if (key !== 'sel' || !fresh.length || !app.user || token === null) return;
    const lines = ids.map((id) => ({ item: id, qty: carried?.[id]?.qty ?? 1 }));
    app.requestSender?.afterAdd(token, lines, text);
  }

  /* The list whose entries a remove waits for: its chip draws busy. */
  let busyId = $state<string | null>(null);

  /* Every other destructive action here offers an undo - `restoreEntry` is the same one the
     list page's own row-remove cross already uses. */
  function removeFrom(
    store: NonNullable<AppState['cloudLists']>,
    l: StoredList,
    entryId: string
  ) {
    const at = l.ids.indexOf(entryId);
    const meta = { ...itemMeta(l, entryId) };
    store.removeEntry(l.id, entryId);
    if (!store.saved) return;
    const name = l.name;
    const listId = l.id;
    app.say((t) => t.removedFrom.replace('%s', name), {
      action: {
        label: (t) => t.undo,
        run: () => {
          store.restoreEntry(listId, entryId, at, meta);
        }
      }
    });
  }

  async function pick(l: StoredList): Promise<void> {
    const store = app.cloudLists;
    if (!store) return;
    if (one !== undefined && inList(l)) {
      /* Taken before the read: the bar's `ids` follow its ticks and can change meanwhile. */
      const entryId = one;
      const listId = l.id;
      if (store.detailOf(listId) === 'ready') {
        removeFrom(store, l, entryId);
        return;
      }
      /* The undo writes back the entry's details, so they are read first. */
      busyId = listId;
      const ok = await store.detail([listId]);
      /* A press on another unread list meanwhile moved the mark: that read still runs. */
      if (busyId === listId) busyId = null;
      if (app.cloudLists !== store || store.status !== 'ready') return;
      if (!ok) {
        if (store.get(listId)) app.say((t) => t.cloudLoadFailed, { error: true });
        return;
      }
      const now = store.get(listId);
      if (now?.ids.includes(entryId)) removeFrom(store, now, entryId);
      return;
    }
    const fresh = store.add(l.id, ids, knows, carried);
    if (store.saved) added(l.name, fresh, l.ids);
  }

  /* The search already holds the name a person looked for and did not find. */
  function openNew(): void {
    newListFor = true;
    draft = showSearch ? pickQ.trim() : '';
  }

  /* Signed out, the create slot is the sign-in prompt; the return reopens
     this menu with the same rows. */
  const signInAfter = $derived.by(() => {
    const counts = Object.fromEntries(
      ids.flatMap((id) => {
        const n = app.picked.get(id);
        return n === undefined ? [] : [[id, n]];
      })
    );
    return {
      hash: returnToRecord ? recordHref(app.recordFor(key) ?? { id: key }) : app.hash,
      action: {
        do: 'addToList' as const,
        key,
        ids: [...ids],
        ...(Object.keys(counts).length ? { picked: counts } : {})
      }
    };
  });

  function cancelNew(): void {
    newListFor = false;
    draft = '';
  }

  function createNew(): void {
    const name = draft.trim();
    if (!name) {
      app.say((t) => t.nameFirst, { error: true });
      newInput?.focus({ preventScroll: true });
      return;
    }
    const store = app.cloudLists;
    if (!store || app.listsFull()) return;
    app.closeErrorToast();
    const l = store.create(draft);
    const fresh = store.add(l.id, ids, knows, carried);
    if (store.saved) added(l.name, fresh, []);
    newListFor = false;
    draft = '';
    pickQ = '';
  }

  /* Focuses the new-list input the moment its form appears - the live app's
     own `focusNew()`, called right after the form is drawn - or, signed
     out, the prompt's «Войти» that took the pressed chip's place. */
  $effect(() => {
    if (!newListFor) return;
    if (newInput) newInput.focus({ preventScroll: true });
    else root?.querySelector<HTMLElement>('.signin button')?.focus({ preventScroll: true });
  });

  /* The popover draws in the top layer, placed by the window's room (`overlay.ts`); it
     re-places itself when its height changes. A card's or a result's own row opens it from
     the control's left edge, the selection bar from its right. */
  $effect(() => {
    if (!open || !root) return;
    const menu = root.querySelector<HTMLElement>('.dropmenu');
    const btn = root.querySelector<HTMLElement>(':scope > .btn');
    if (!menu || !btn) return;
    return openOverlay(menu, btn, root.closest('.cardpick, .resacts') ? 'start' : 'end');
  });

  /* Escape closes the menu and returns focus to the toggle that
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
    focusBack(root?.querySelector<HTMLElement>(':scope > .btn'));
  }

  /* Any click outside `.seldrop`/`.dropmenu` closes the menu - checked
     against `app.menuFor` at the moment the click arrives, so a press on
     another control's own button - whose handler has already switched
     `menuFor` to its own name - is never undone here; that instance's own
     `open` has already gone false through the derivation above. This holds
     only while two mounted controls never share a name: `menuScope`.

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
      mine = menuName();
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

{#if target !== 'none'}
  <div class="seldrop" bind:this={root}>
    <Button
      {size}
      variant={primary ? 'primary' : 'plain'}
      on={open}
      expanded={open}
      caret
      {disabled}
      onclick={toggle}><Icon name="plus" />{t.toList}</Button
    >
    {#if open}
      <div class="dropmenu" class:long={showSearch}>
        <span class="lbl">{t.listsHead}</span>
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
        <!-- Signed out the reader holds no list: the menu is the create slot alone. -->
        {#if target !== 'prompt'}
          <div class="pickchips">
            {#if shown.length}
              {#each shown as l (l.id)}
                {@const busy = busyId === l.id}
                {@const rid = 'lr-' + menuName() + '-' + l.id}
                <!-- A one-record menu toggles; the selection bar's only adds, so its rows
                     carry no pressed state. The check, not a fill, says "holds it" (C61).
                     The name is the list's; the count is its description. -->
                <button
                  type="button"
                  class="lrow"
                  aria-labelledby={rid + '-n'}
                  aria-describedby={rid + '-c'}
                  aria-pressed={one !== undefined ? inList(l) : undefined}
                  aria-busy={busy ? 'true' : undefined}
                  aria-disabled={busy ? 'true' : undefined}
                  onclick={() => {
                    if (!busy) void pick(l);
                  }}
                  >{#if inList(l)}<Icon name="check" />{:else}<span class="sp"></span>{/if}<span
                    class="ln"
                    id={rid + '-n'}>{l.name}</span
                  ><span class="lc" id={rid + '-c'}
                    >{plural(knownItems(l, app.index?.byId).length, t.itemsN, app.lang)}</span
                  ></button
                >
              {/each}
            {:else}
              <span class="picker-none">{t.nothing}</span>
            {/if}
          </div>
        {/if}
        {#if newListFor && target === 'prompt'}
          <SignInPrompt
            {app}
            lead={t.signInToCreateShort}
            after={signInAfter}
            compact
            oncancel={cancelNew}
          />
        {:else if newListFor}
          <span class="picker-new">
            <input
              type="text"
              bind:this={newInput}
              value={draft}
              placeholder={t.listNamePh}
              maxlength={NAME_MAX}
              aria-label={t.newList}
              oninput={(e) => {
                draft = e.currentTarget.value;
              }}
              onkeydown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                createNew();
              }}
            />
            <Button size="sm" variant="primary" onclick={createNew}>{t.create}</Button>
            <Button size="sm" variant="ghost" onclick={cancelNew}>{t.cancel}</Button>
          </span>
        {:else if target !== 'wait'}
          {#if target !== 'prompt'}<span class="lsep" aria-hidden="true"></span>{/if}
          <button type="button" class="lnew" onclick={openNew}
            ><Icon name="plus" />{t.newList}</button
          >
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* off `.seldrop`/`.dropmenu` in style.css - the add-to-list menu, shared by the card and
     the selection bar. A popover in the top layer: `overlay.ts` sets its `top` and `left`, and
     the UA's `inset`, `margin`, `color` and `overflow` are reset as `Toast` does. */
  .seldrop {
    position: relative;
  }

  .dropmenu {
    position: fixed;
    inset: auto;
    margin: 0;
    color: var(--txt);
    min-width: 280px;
    max-width: min(320px, 90vw);
    z-index: 60;
    border: 1px solid var(--line2);
    border-radius: var(--r);
    background: var(--surface);
    padding: 10px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: pop 0.16s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  }

  .dropmenu:global([data-side='up']) {
    animation-name: popUp;
  }

  @keyframes popUp {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.985);
    }

    to {
      opacity: 1;
      transform: none;
    }
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

  /* off `.dropmenu .lbl` - a copy of `.lbl`, after Field.svelte's and FilterPanel.svelte's;
     extract only once a fourth wants it. */
  .lbl {
    display: block;
    font-size: var(--t-label);
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 2px;
  }

  /* A list row: the check (or its room), the name on one line, the count in words, never
     cut. 44 px tall up to 760 px, 36 px from 761 px. Neutral: no gold (C61). */
  .lrow,
  .lnew {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    /* A row target up to 600 px (DESIGN.md, "The Phone-First Rule"). */
    min-height: max(36px, var(--thumb) + 4px);
    padding: 0 8px;
    border: 0;
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--txt);
    font: inherit;
    font-size: var(--t-data);
    text-align: left;
    cursor: pointer;
  }

  .lrow:hover:not([aria-disabled='true']),
  .lnew:hover {
    background: var(--surface2);
  }

  .lrow[aria-disabled='true'] {
    opacity: 0.5;
    cursor: default;
  }

  .lrow :global(svg),
  .lnew :global(svg),
  .sp {
    flex: none;
    width: 14px;
    height: 14px;
    fill: currentcolor;
  }

  /* A list name wraps whole (DESIGN.md "Typography", "The Whole Message Rule"); the inset
     keeps a wrapped name off the row's edges. */
  .ln {
    flex: 1 1 auto;
    min-width: 0;
    padding-block: 6px;
    overflow-wrap: anywhere;
  }

  .lc {
    flex: none;
    color: var(--muted2);
    white-space: nowrap;
  }

  .lsep {
    height: 1px;
    margin: 2px 0;
    background: var(--line);
  }

  @media (max-width: 760px) {
    .lrow,
    .lnew {
      min-height: 44px;
    }
  }

  /* off `.dropmenu.long` - the picker grows a search box once there are more
     lists than fit without one. Only the rows scroll, so the heading, the
     search and «+ Новый список» stay in view (issue 68). */
  .dropmenu.long {
    max-height: min(60vh, 340px);
  }

  .dropmenu > :global(*) {
    flex-shrink: 0;
  }

  input.pickq {
    width: 100%;
    height: max(32px, var(--thumb));
    padding: 0 10px;
    margin-bottom: 8px;
    box-sizing: border-box;
    background: var(--bg2);
    border: 1px solid var(--line2);
    border-radius: 8px;
    color: var(--txt);
    font: inherit;
    font-size: var(--t-data);
  }

  input.pickq:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  /* The padding and the equal negative margin keep a row's 2px + 2px focus
     ring (tokens.css) inside the scroll box, which would clip it. */
  .pickchips {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    margin: -4px;
  }

  .dropmenu.long > .pickchips {
    overflow: auto;
    min-height: 0;
    flex: 1 1 auto;
  }

  .picker-none {
    font-size: var(--t-data);
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
    height: max(32px, var(--thumb));
    padding: 0 11px;
    border-radius: 8px;
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
    font-size: var(--t-data);
  }

  .picker-new input:focus {
    outline: none;
    border-color: var(--gold);
  }

  /* off the 600px block in style.css - the menu grows to fill the width on a
     phone rather than spilling past the edge of the screen. */
  @media (max-width: 600px) {
    .dropmenu {
      width: calc(100% - 32px);
      max-width: none;
    }
  }
</style>
