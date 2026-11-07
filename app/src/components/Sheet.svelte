<script lang="ts">
  /* A sheet: a native modal `<dialog>`, attached to the bottom of the screen up to 760 px
     and centered from 761 px, its head and foot fixed and its body scrolling (DESIGN.md,
     "Sheet"). No grab handle: nothing drags it.

     Opened with `showModal()` for the focus trap, the inert page and Escape, as
     `RecordModal.svelte` is; the toast is drawn inside it while it is open. */
  import type { Snippet } from 'svelte';
  import DialogClose from './DialogClose.svelte';
  import Toast from './Toast.svelte';
  import { watchBarHeight } from './barHeight.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The dialog's accessible name. */
    label: string;
    /** The visible heading of the head row. */
    title: string;
    /** Called once on each close: Escape, «Закрыть» or a press on the scrim. */
    onclose: () => void;
    /** Controls beside «Закрыть» in the head row. */
    head?: Snippet | undefined;
    children: Snippet;
    /** The fixed foot under the scrolling body. */
    foot?: Snippet | undefined;
  }

  const { app, label, title, onclose, head, children, foot }: Props = $props();

  let dialog = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('.dlg-x')?.focus();
    app.dialogOpen = true;
    return () => {
      app.dialogOpen = false;
    };
  });

  /* Up to 760 px the toast floats over the foot, not over its buttons (`Toast`). */
  let footEl = $state<HTMLElement | undefined>(undefined);
  $effect(() => (dialog && footEl ? watchBarHeight(footEl, '--dock-h', dialog) : undefined));
</script>

<!-- The scrim is not an element: a press on it arrives on the dialog itself. -->
<dialog
  bind:this={dialog}
  class="sheet"
  aria-label={label}
  {onclose}
  onclick={(e) => {
    if (e.target === dialog) dialog?.close();
  }}
>
  <div class="sheet-card">
    <div class="sheet-head">
      <h2>{title}</h2>
      {@render head?.()}
      <DialogClose
        label={app.t.close}
        onclick={() => {
          dialog?.close();
        }}
      />
    </div>
    <div class="sheet-body">{@render children()}</div>
    {#if foot}<div class="sheet-foot" bind:this={footEl}>{@render foot()}</div>{/if}
  </div>
  <Toast {app} inDialog />
</dialog>

<style>
  dialog[open] {
    position: fixed;
    inset: auto 0 0;
    z-index: 100;
    width: min(100%, 560px);
    max-width: none;
    max-height: min(85dvh, 640px);
    margin: 0 auto;
    padding: 0;
    border: 1px solid var(--line2);
    border-bottom: 0;
    border-radius: var(--r) var(--r) 0 0;
    background: var(--surface);
    color: var(--txt);
    display: flex;
    overflow: hidden;
  }

  /* From 761 px a sheet takes the record dialog's place: centered, four round corners. */
  @media (min-width: 761px) {
    dialog[open] {
      inset: 0;
      margin: auto;
      height: fit-content;
      border-bottom: 1px solid var(--line2);
      border-radius: var(--r);
      box-shadow: var(--shadow);
    }
  }

  dialog::backdrop {
    background: var(--scrim);
  }

  .sheet-card {
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;
  }

  .sheet-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
  }

  .sheet-head h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--t-body);
    font-weight: 650;
  }

  .sheet-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 12px 16px;
  }

  .sheet-body:last-child {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }

  .sheet-foot {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
  }

  @media print {
    dialog {
      display: none !important;
    }
  }
</style>
