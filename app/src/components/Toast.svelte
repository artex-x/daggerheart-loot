<script lang="ts">
  /* The one notice the app raises, off `showToast`/`toast`/`toastAction` in
     app.js (969-1006) and `.toast`/`.toast.err`/`.toast.act`/`.toast-act`/
     `toastIn` in style.css.

     `RecordModal` is a native `<dialog>` opened with `showModal()`, which
     makes the rest of the document inert - a fixed element in `Shell` would
     sit under the backdrop and go unannounced exactly when a person adds from
     the card inside it. `popover="manual"` puts this in the top layer, above
     the dialog and outside its inertness, at the cost of resetting the
     popover UA styles this component's own `.toast` rule below undoes.

     The element stays mounted whether or not a toast is showing - `hidePopover`
     needs it to exist - so `role`/`aria-live` are only set while `app.toast`
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
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  let el = $state<HTMLDivElement | undefined>(undefined);

  $effect(() => {
    const active = !!app.toast;
    const act = app.toast?.mode === 'act';
    if (!el) return;
    if (typeof el.showPopover === 'function') {
      const open = el.matches(':popover-open');
      if (active && !open) el.showPopover();
      else if (!active && open) el.hidePopover();
    } else {
      el.style.display = active ? (act ? 'inline-flex' : 'block') : 'none';
    }
  });

  function runAction(): void {
    const action = app.toast?.action;
    app.hideToast();
    action?.run();
  }
</script>

<div
  bind:this={el}
  popover="manual"
  class="toast"
  class:err={app.toast?.mode === 'err'}
  class:act={app.toast?.mode === 'act'}
  role={app.toast ? (app.toast.mode === 'err' ? 'alert' : 'status') : undefined}
  aria-live={app.toast ? (app.toast.mode === 'err' ? 'assertive' : 'polite') : undefined}
>
  {#if app.toast}
    {app.toast.msg}
    {#if app.toast.action}
      <button type="button" class="toast-act" onclick={runAction}
        >{app.toast.action.label}</button
      >
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
    color: #1a1206;
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

  /* off `#toast` in the live `@media print` block (style.css:1409) */
  @media print {
    .toast {
      display: none;
    }
  }
</style>
