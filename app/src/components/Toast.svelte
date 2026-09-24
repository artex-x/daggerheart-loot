<script lang="ts">
  /* The one notice the app raises, off `showToast`/`toast`/`toastAction` in
     app.js (969-1006) and `.toast`/`.toast.err`/`.toast.act`/`.toast-act`/
     `toastIn` in style.css.

     A modal dialog makes everything outside it inert, the top layer
     included, so while `RecordModal` is open it draws its own copy
     (`inDialog`) and this one stands down (`app.dialogOpen`) -
     `docs/DECISIONS.md`, 2026-09-24, "While the record dialog is open, the
     toast is drawn inside it". `popover="manual"` keeps each copy above the
     page or dialog it belongs to, at the cost of resetting the popover UA
     styles this component's own `.toast` rule below undoes.

     The element stays mounted whether or not a toast is showing - `hidePopover`
     needs it to exist - so `role`/`aria-live` are only set while `toast`
     is not null. Without that a component test's `getByRole('status')` would
     match this alongside the storage warning even while idle.

     jsdom (v30) applies the UA default `[popover]:not(:popover-open){display:
     none}` from CSS alone, but implements neither `showPopover`/`hidePopover`
     nor `:popover-open` matching - so without the fallback below the element
     is permanently `display:none` in every component test, findable by
     `getByText` (which ignores visibility) but not by `getByRole` (which
     does not), which is the same "browser fallback" the design already names
     for a browser with no Popover API at all: toggle the display directly,
     inline, so it wins over that UA rule the way any inline style does. */
  import { tick } from 'svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The copy `RecordModal` draws inside its dialog. */
    inDialog?: boolean;
  }

  const { app, inDialog = false }: Props = $props();

  const toast = $derived(app.dialogOpen === inDialog ? app.toast : null);

  let el = $state<HTMLDivElement | undefined>(undefined);

  $effect(() => {
    const active = !!toast;
    const act = toast?.mode === 'act';
    if (!el) return;
    if (typeof el.showPopover === 'function') {
      const open = el.matches(':popover-open');
      if (active && !open) el.showPopover();
      else if (!active && open) el.hidePopover();
    } else {
      el.style.display = active ? (act ? 'inline-flex' : 'block') : 'none';
    }
  });

  /* A toast with an undo takes focus, or a keyboard user could not reach the
     button before its 7000ms run out; a plain notice never does. `pre`, so
     "was focus inside" is read before the button leaves the DOM. The origin
     may already be gone when this runs (a removed row leaves first, and focus
     is then on `body`), so the toast falls back to `#main`, or to the
     dialog's close button inside `RecordModal`, where `#main` is inert. */
  let back: HTMLElement | null = null;

  $effect.pre(() => {
    const action = toast?.action;
    const box = el;
    if (!box) return;
    const focused = document.activeElement;
    const inside = box.contains(focused);
    if (action) {
      if (!inside)
        back = focused instanceof HTMLElement && focused !== document.body ? focused : null;
      void tick().then(() => box.querySelector<HTMLButtonElement>('.toast-act')?.focus());
    } else if (inside) {
      const home = inDialog
        ? box.closest('dialog')?.querySelector<HTMLElement>('button')
        : document.getElementById('main');
      const to = back?.isConnected ? back : home;
      back = null;
      void tick().then(() => to?.focus());
    }
  });

  function runAction(): void {
    const action = toast?.action;
    app.hideToast();
    action?.run();
  }
</script>

<div
  bind:this={el}
  popover="manual"
  class="toast"
  class:err={toast?.mode === 'err'}
  class:act={toast?.mode === 'act'}
  role={toast ? (toast.mode === 'err' ? 'alert' : 'status') : undefined}
  aria-live={toast ? (toast.mode === 'err' ? 'assertive' : 'polite') : undefined}
>
  {#if toast}
    {toast.msg}
    {#if toast.action}
      <button type="button" class="toast-act" onclick={runAction}>{toast.action.label}</button>
    {/if}
  {/if}
</div>

<style>
  /* off `.toast` in style.css, plus the popover resets a plain fixed element
     does not need: `inset`/`margin` replace the UA default centring, `border`
     and `overflow` undo the UA popover border and scroll, and `color`/
     `background` are the browser's Canvas/CanvasText for a plain popover -
     `.toast.err` still overrides them for the alert flavour below. */
  .toast {
    position: fixed;
    inset: auto auto 26px 50%;
    margin: 0;
    border: 0;
    overflow: visible;
    transform: translateX(-50%);
    background: var(--gold);
    color: var(--ink-on-gold);
    font-weight: 650;
    font-size: 13.5px;
    padding: 10px 18px;
    border-radius: 999px;
    box-shadow: 0 12px 30px -10px rgb(0 0 0 / 70%);
    z-index: 200;
    animation: toastIn 0.2s ease both;
  }

  .toast.err {
    background: var(--danger);
    color: #fff;
  }

  /* off `.toast.act` - a toast that asks something rather than reporting it */
  .toast.act {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding-right: 8px;
  }

  .toast-act {
    border: 0;
    border-radius: 999px;
    padding: 5px 12px;
    font: inherit;
    font-weight: 700;
    font-size: 12.5px;
    background: rgb(26 18 6 / 16%);
    color: inherit;
    transition: 0.14s;
  }

  .toast-act:hover {
    background: rgb(26 18 6 / 28%);
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }

    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  /* off `#toast` in the live `@media print` block (style.css:1409): without
     `!important`, `.toast{display:none}` (0,1,0) lost under print to
     `.toast.act{display:inline-flex}` (0,2,0) above, so an action toast (an
     undo prompt, mid-copy) printed over the page. */
  @media print {
    .toast {
      display: none !important;
    }
  }
</style>
