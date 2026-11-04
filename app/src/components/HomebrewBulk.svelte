<script lang="ts">
  /* The own items' actions in the selection bar: the move, the JSON download and the delete
     of the ticked items, with the copy in «Ещё» up to 760 px. `SelBar.svelte` mounts it on the
     Items tab; the page drops a tick the search or the filter hides, so `ids` holds drawn rows
     only (docs/specs/FEATURES.md, "The Items tab", "The bulk move"). */
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import Sheet from './Sheet.svelte';
  import SourcePicker from './SourcePicker.svelte';
  import StatusRegion from './StatusRegion.svelte';
  import type { ItemRow } from '../lib/homebrew.js';
  import { deleteItemAsk } from '../lib/homebrewForm.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    /** The ticked ids. */
    ids: readonly string[];
    copy: () => void;
  }

  const { app, store, ids, copy }: Props = $props();

  const t = $derived(app.t);
  const rows = $derived.by(() => {
    const on = new Set(ids);
    return store.items.filter((r) => on.has(r.key));
  });
  const n = $derived(rows.length);
  const moveText = $derived(t.hbMove.replace('%n', String(n)));
  const jsonText = $derived(`${t.exportJson} (${String(n)})`);
  const delText = $derived(`${t.del} (${String(n)})`);

  /* «Переместить (N)»: the sheet, the chosen source and section, and the line a `gone` answer
     leaves under the selects. */
  let moving = $state(false);
  let moveBook = $state('');
  let moveSection = $state('');
  let moveGone = $state<'book' | 'section' | null>(null);
  let moveSending = $state(false);
  let opener: HTMLElement | null = null;
  /* A bulk delete in flight, one request for all; the region says the start once, and the
     toast says the end. */
  let deleting = $state(false);
  let deletingSaid = $state('');

  /* An item's place as the selects name it: a source id (`''` the default) and a section. */
  const placeOf = (r: ItemRow): { book: string; section: string } => {
    const book = r.book_id === null ? undefined : store.book(r.book_id);
    if (!book) return { book: '', section: '' };
    const section = r.content.section;
    const held = section !== undefined && book.content.sections?.some((s) => s.key === section);
    return { book: book.id, section: held ? section : '' };
  };
  const toMove = $derived(
    rows.filter((r) => {
      const at = placeOf(r);
      return at.book !== moveBook || at.section !== (moveBook ? moveSection : '');
    })
  );

  const allBox = (): HTMLElement | null =>
    document.querySelector<HTMLElement>('.selbarwrap .selall input');

  /* Rule 20: after a move or a delete that empties the bar the focus goes to «Выбрать». */
  function focusAfter(): void {
    (
      allBox() ??
      document.querySelector<HTMLElement>('button.selmode') ??
      document.getElementById('main')
    )?.focus();
  }

  /* Up to 760 px «Ещё» took the focus back before this runs, so it is the opener there. */
  function openMove(): void {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    moving = true;
    moveGone = null;
  }

  function closeMove(): void {
    moving = false;
    moveGone = null;
    opener?.focus();
  }

  async function movePicked(): Promise<void> {
    if (moveSending || !toMove.length) return;
    const moved = toMove;
    const bookId = moveBook || null;
    const section = (bookId && moveSection) || null;
    moveSending = true;
    moveGone = null;
    try {
      const r = await store.moveItems(moved, bookId, section);
      if (r.ok) {
        const done = moved.length;
        moving = false;
        app.clearSel();
        app.say((t) => t.hbMovedN.replace('%n', String(done)));
        await tick();
        focusAfter();
      } else if (r.error === 'gone') {
        moveGone = bookId !== null && !store.book(bookId) ? 'book' : 'section';
      } else if (r.error === 'conflict') {
        app.say((t) => t.hbMoveChanged, { error: true });
      } else if (r.error === 'refused' || r.error === 'limit') {
        app.say((t) => t.hbMoveRefused, { error: true });
      } else {
        app.say((t) => t.hbMoveFailed, { error: true });
      }
    } finally {
      moveSending = false;
    }
  }

  async function deletePicked(): Promise<void> {
    if (deleting || !n) return;
    const gone = rows;
    const count = gone.length;
    const lead = t.hbDeleteMany.replace('%n', String(count));
    if (!app.env.dialog.confirm(deleteItemAsk(lead, true, t))) return;
    deleting = true;
    deletingSaid = t.hbDeletingN.replace('%n', String(count));
    /* The bar's actions are disabled while it runs, so the focus waits on «Все». */
    allBox()?.focus();
    try {
      const { result, deleted } = await store.removeItems(gone);
      /* Each request is all or none: after a failure the rows not yet deleted keep their
         ticks, so a second press deletes the rest. */
      if (result.ok) {
        app.clearSel();
        app.say((t) => t.hbDeletedN.replace('%n', String(count)));
      } else if (deleted) {
        app.say((t) => `${t.hbDeletedN.replace('%n', String(deleted))}. ${t.hbDeleteFailed}`, {
          error: true
        });
      } else app.say((t) => t.hbDeleteFailed, { error: true });
    } finally {
      deleting = false;
      deletingSaid = '';
    }
    await tick();
    focusAfter();
  }

  const download = (): void => {
    void app.exportHomebrew({ items: rows.map((r) => r.key) }, null);
  };
</script>

<StatusRegion text={deletingSaid} />
{#if app.band === 'narrow'}
  <span class="bulkmore">
    <MoreMenu {app} id="hb-bulk" up size="sm" disabled={deleting}>
      {#snippet children(close: () => void)}
        <button
          type="button"
          role="menuitem"
          tabindex="-1"
          disabled={!n}
          onclick={() => {
            close();
            copy();
          }}><Icon name="copy" />{t.copyText}</button
        >
        <button
          type="button"
          role="menuitem"
          tabindex="-1"
          disabled={!n}
          onclick={() => {
            close();
            openMove();
          }}>{moveText}...</button
        >
        <button
          type="button"
          role="menuitem"
          tabindex="-1"
          disabled={!n}
          onclick={() => {
            close();
            download();
          }}>{jsonText}</button
        >
        <div role="separator" class="msep"></div>
        <button
          type="button"
          role="menuitem"
          class="danger"
          tabindex="-1"
          disabled={!n}
          onclick={() => {
            close();
            void deletePicked();
          }}>{delText}</button
        >
      {/snippet}
    </MoreMenu>
  </span>
{:else}
  <Button
    size="sm"
    caret
    on={moving}
    expanded={moving}
    disabled={deleting || !n}
    onclick={openMove}>{moveText}</Button
  >
  <Button size="sm" disabled={!n} onclick={download}>{jsonText}</Button>
  <Button
    size="sm"
    variant="danger"
    disabled={deleting || !n}
    onclick={() => void deletePicked()}>{delText}</Button
  >
{/if}

{#if moving && n}
  <Sheet {app} label={moveText} title={moveText} onclose={closeMove}>
    <SourcePicker
      id="hb-move"
      books={store.books}
      lang={app.lang}
      value={moveBook}
      home={t.srcHomebrew}
      describedby={moveGone || !toMove.length ? 'hb-move-note' : undefined}
      onchange={(v: string) => {
        moveBook = v;
        moveSection = '';
        moveGone = null;
      }}
      section={{
        label: t.hbSection,
        value: moveSection,
        none: t.hbNoSection,
        onchange: (k: string) => {
          moveSection = k;
          moveGone = null;
        }
      }}
    >
      {#snippet label()}{t.hbSource}{/snippet}
    </SourcePicker>
    {#if moveGone}
      <p class="note err" id="hb-move-note" role="alert">
        {moveGone === 'book' ? t.hbMoveBookGone : t.hbMoveSectionGone}
      </p>
    {:else if !toMove.length}
      <p class="note" id="hb-move-note">{t.hbMoveHere}</p>
    {/if}
    {#snippet foot()}
      <Button
        size="sm"
        variant="ghost"
        onclick={() => {
          document.querySelector<HTMLDialogElement>('dialog.sheet')?.close();
        }}>{t.cancel}</Button
      >
      <Button
        size="sm"
        variant="primary"
        disabled={moveSending || !toMove.length}
        onclick={() => void movePicked()}>{moveSending ? t.hbMoving : t.hbMoveGo}</Button
      >
    {/snippet}
  </Sheet>
{/if}

<style>
  /* Up to 760 px the bar's button sits at the window's right edge: this box anchors the menu,
     and `MoreMenu` leaves its own wrap static there. */
  .bulkmore {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    display: flex;
  }

  .bulkmore :global(.morewrap) {
    flex: 1;
    min-width: 0;
  }

  /* The bar's actions share one row here: «В список» gives up the line it has elsewhere. */
  @media (max-width: 760px) {
    :global(.selbarwrap .selacts:has(.bulkmore) .seldrop) {
      flex: 1.5 1 0;
      min-width: 0;
    }
  }

  .note {
    margin: 8px 0 0;
    font-size: var(--t-data);
    line-height: 1.45;
    color: var(--muted2);
  }

  .note.err {
    color: var(--danger-text);
  }
</style>
