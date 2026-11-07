<script lang="ts">
  /* A record over the page it was opened from: the same dossier the record page draws,
     actions and all, centered from 761 px and a bottom sheet with a sticky action dock up
     to 760 px (DESIGN.md, "The Dossier Rule"). It is one element at every width, so a window
     that crosses 760 px remounts nothing.

     A modal is a state, not a URL, so no route-level check can see it:
     `tests/app/states.js` and `tests/app/golden.js` both visit it.

     A native <dialog> opened with showModal() gets the focus trap, the inert
     background and Escape from the browser. */
  import DialogClose from './DialogClose.svelte';
  import PickRow from './PickRow.svelte';
  import RecordCard from './RecordCard.svelte';
  import Toast from './Toast.svelte';
  import { watchBarHeight } from './barHeight.js';
  import { isHomebrewRecord } from '../lib/homebrew.js';
  import { nameOf } from '../lib/i18n.js';
  import type { ShareBlock } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';
  import type { Index } from '../lib/data.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    onclose: () => void;
    /* A rung of the tier ladder swaps which record the modal is showing, the
       way the live app replaces the modal's body rather than stacking one. */
    onopen?: ((r: Record_) => void) | undefined;
    /** The live `contextNote` block, forwarded to the card row's "Copy text" -
     *  a list's own row opens the same modal and the copy has to carry the
     *  entry's note the same way the row itself does. */
    extra?: readonly ShareBlock[] | undefined;
  }

  /* The index is a prop rather than read off `app`: a modal is only ever opened
     from a screen that already has one, so asking again would add a branch
     nothing can take. */
  const { app, index, it, onclose, onopen, extra }: Props = $props();

  let dialog = $state<HTMLDialogElement | null>(null);
  /* The own items as read, not `isForeignItem`: that answers false while they load, which
     would draw the author's links on another account's item for that moment. */
  const own = $derived(
    isHomebrewRecord(it) &&
      typeof it.hid === 'string' &&
      !!app.homebrew?.items.some((r) => r.id === it.hid)
  );

  /* Opened as a modal rather than shown: that is what makes the rest of the
     page inert to a screen reader as well as to the mouse. The flag follows
     `showModal()`: the top layer stacks in entry order, so a toast shown
     first would sit under the dialog's backdrop. The close button takes the
     focus: `showModal()` alone gives it to the card whenever the card scrolls
     (docs/specs/FEATURES.md, "Records"). */
  $effect(() => {
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('.dlg-x')?.focus();
    app.dialogOpen = true;
    return () => {
      app.dialogOpen = false;
    };
  });

  /* Up to 760 px the toast floats over the action dock, not over its buttons (`Toast`). */
  $effect(() => {
    void it;
    const dock = dialog?.querySelector<HTMLElement>('.cardpick');
    return dialog && dock ? watchBarHeight(dock, '--dock-h', dialog) : undefined;
  });

  /* Every way this dialog closes - the close button, the backdrop, Escape -
     ends in the browser firing the dialog's own "close" event, so one handler
     on it reaches all three paths. `app.menuFor` is folded first, matching the
     live app's own order (`S.menuFor = ''` ahead of `closeModal()`): without
     it, the card's add-to-list menu, left open when the modal closes, is
     still `open` the next time this same record's modal is shown. */
  function handleClose(): void {
    app.menuFor = '';
    onclose();
  }
</script>

<!-- Pressing the backdrop closes it, as pressing `.modal-back` does in the live
     app. The backdrop is not an element, so that press arrives on the dialog
     itself; anything inside the card arrives on the card. Escape is the
     browser's, and reaches `close` the same way. -->
<dialog
  bind:this={dialog}
  aria-label={nameOf(it, app.lang)}
  onclose={handleClose}
  onclick={(e) => {
    if (e.target === dialog) dialog?.close();
  }}
>
  <div class="modal-card">
    <!-- close() rather than a method="dialog" form: it is the same thing to a
         browser, and it is one call rather than a submission nobody submits.
         Escape reaches the same place, because the browser fires `close`. It stays the
         dialog's first button: `Toast` returns the focus there. -->
    <div class="modal-head">
      <DialogClose
        label={app.t.close}
        onclick={() => {
          dialog?.close();
        }}
      />
    </div>

    <RecordCard
      dossier
      {it}
      {index}
      lang={app.lang}
      artBroken={app.artBroken(it.id)}
      {onopen}
      pageLink
      onartfail={(bad: string) => {
        app.markArtBroken(bad);
      }}
      manage={own}
    >
      {#snippet pick()}
        <!-- The row toasts through `app.say`; the toast is drawn inside this dialog while
             it is open (Toast.svelte). -->
        <PickRow {app} {it} {index} {extra} inModal />
      {/snippet}
    </RecordCard>
  </div>
  <Toast {app} inDialog />
</dialog>

<style>
  /* off `.modal` and `.modal-back` in style.css. A native dialog fills the top
     layer itself, so the fixed positioning and the padding move onto it and the
     backdrop layer becomes ::backdrop. */
  dialog[open] {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border: 0;
    background: none;
    overflow: hidden;
  }

  dialog::backdrop {
    background: var(--scrim);
  }

  .modal-card {
    position: relative;
    z-index: 2;
    width: min(var(--dossier-w), 100%);
    max-height: 88vh;
    padding: 24px;
    overflow: auto;
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    box-shadow: var(--shadow);
    animation: pop 0.22s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  }

  /* The card fades itself in on a page. Here the modal is what arrives, and two
     entrances at once read as a stutter - as `.modal-card .card` says. */
  .modal-card :global(.card) {
    animation: none;
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

  /* No height, so the card starts under the padding; sticky, so a long text does not take
     the close away. `top` counts from the card's content box: 12 px under its edge. */
  .modal-head {
    position: sticky;
    top: -12px;
    z-index: 3;
    display: flex;
    justify-content: flex-end;
    height: 0;
    margin: -12px -12px 12px 0;
  }

  .modal-head :global(.dlg-x) {
    background: var(--surface);
  }

  .modal-card :global(.card-name) {
    padding-right: 112px;
  }

  /* The bottom sheet and its dock, which anchors both menus. */
  @media (max-width: 760px) {
    dialog[open] {
      padding: 0;
      align-items: flex-end;
    }

    .modal-card {
      width: 100%;
      max-height: min(92dvh, 100%);
      padding: 0;
      background: var(--surface);
      border-width: 1px 0 0;
      border-radius: var(--r) var(--r) 0 0;
    }

    .modal-head {
      top: 0;
      height: auto;
      margin: 0;
      padding: 8px 16px;
      background: var(--surface);
    }

    .modal-card :global(.card-name) {
      padding-right: 0;
    }

    .modal-card :global(.card.dossier) {
      padding: 0 16px;
    }

    .modal-card :global(.card.dossier .cardpick) {
      position: sticky;
      bottom: 0;
      z-index: 3;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 12px -16px 0;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      background: var(--surface);
      border-top: 1px solid var(--line);
    }

    .modal-card :global(.cardpick > .btn),
    .modal-card :global(.cardpick .morewrap),
    .modal-card :global(.cardpick .morewrap > .btn) {
      width: 100%;
      justify-content: center;
    }

    .modal-card :global(.cardpick > :last-child:nth-child(odd)) {
      grid-column: 1 / -1;
    }

    .modal-card :global(.card.dossier .cardpick .seldrop) {
      position: static;
    }

    /* The dock spans the sheet; the popover keeps the 16 px gutter of every caller. */
    .modal-card :global(.cardpick .dropmenu) {
      top: auto;
      right: 16px;
      bottom: calc(100% + 8px);
      left: 16px;
    }

    /* The sticky dock spans the card edge to edge: «Ещё» opens inside the same 16 px gutter. */
    .modal-card :global(.cardpick .recmenu) {
      right: 16px;
    }
  }

  /* A dock of two rows would take almost half of a window this short, so it joins the
     scroll; `relative` keeps it the menus' anchor. */
  @media (max-width: 760px) and (max-height: 480px) {
    .modal-card :global(.card.dossier .cardpick) {
      position: relative;
      margin: 12px 0 16px;
      padding: 0;
      border-top: 0;
    }

    /* The dock is inside the card's padding here: the gutter is already there. */
    .modal-card :global(.cardpick .recmenu) {
      right: 0;
    }
  }

  /* The live app hid `#modal` unconditionally under print
     media (`git show 23c00a6^:style.css`); this component carried no equivalent rule
     at all, so a page printed while a record was open printed the dialog
     over it. `!important` for the same reason Toast.svelte's rule needs
     it - nothing here guarantees this is always the highest-specificity
     rule touching `dialog`. */
  @media print {
    dialog {
      display: none !important;
    }
  }
</style>
