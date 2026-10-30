<script lang="ts">
  /* The one notice the app raises, off `showToast`/`toast`/`toastAction` in
     `git show 23c00a6^:app.js` and `.toast`/`.toast.err`/`.toast.act`/`.toast-act`/
     `toastIn` in style.css. An action is an undo button, which takes focus, a
     link opened in a new tab, or a move to another page (the new-request toast);
     the last two never take it. An action toast pauses while
     hovered or while the person has moved focus into it (docs/specs/FEATURES.md,
     the accessibility toast rule).

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
  /* Set while the toast's own link or move hides it: that action decides the focus. */
  let own = false;

  /* Keyed on the action, not on the toast: a language switch draws a new toast
     object with the same functions and must not take focus again. A link or a move
     toast that a later toast replaces gives the focus back too (rule 20). */
  const run = $derived(toast?.action?.run);
  const key = $derived(toast?.action?.run ?? toast?.action?.go ?? toast?.action?.href);

  $effect.pre(() => {
    void key;
    const action = run;
    const box = el;
    if (!box) return;
    const focused = document.activeElement;
    const inside = box.contains(focused);
    if (own) {
      own = false;
      back = null;
      return;
    }
    if (action) {
      if (!inside)
        back = focused instanceof HTMLElement && focused !== document.body ? focused : null;
      void tick().then(() => {
        selfFocus = true;
        box.querySelector<HTMLButtonElement>('.toast-act')?.focus();
        selfFocus = false;
      });
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
    action?.run?.();
  }

  /* A `go` action moves to another page and never takes the focus; its button leaves
     the DOM with the toast, so a focus nothing else took lands on `#main`. */
  function goAction(go: () => void): void {
    /* Inside the record dialog the page under it is inert: the dialog closes first, so
       the panel head or `#main` can take the focus. */
    const dialog = inDialog ? el?.closest('dialog') : null;
    own = true;
    app.hideToast();
    dialog?.close();
    go();
    void tick().then(() => {
      const now = document.activeElement;
      if (now && now !== document.body && now.isConnected) return;
      document.getElementById('main')?.focus();
    });
  }

  /* An action toast holds its clock while hovered or while the person moved focus
     into it (`app.holdToast`). The undo's own `.focus()` above does not count
     (`selfFocus`), so it still runs out at 7000 ms and returns focus. */
  let hover = $state(false);
  let focused = $state(false);
  let selfFocus = false;

  /* A hidden toast fires no `pointerleave`, so the next one starts unheld. */
  $effect(() => {
    if (toast) return;
    hover = false;
    focused = false;
  });

  $effect(() => {
    const on = hover || focused;
    if (toast?.mode === 'act') app.holdToast(on);
  });
</script>

<div
  bind:this={el}
  popover="manual"
  class="toast"
  class:err={toast?.mode === 'err'}
  class:act={toast?.mode === 'act'}
  role={toast ? (toast.mode === 'err' ? 'alert' : 'status') : undefined}
  aria-live={toast ? (toast.mode === 'err' ? 'assertive' : 'polite') : undefined}
  onpointerenter={() => (hover = true)}
  onpointerleave={() => (hover = false)}
  onfocusin={(e) => {
    if (!selfFocus) focused = true;
    /* The origin of a focus a person moved into a link or a move toast. */
    const from = e.relatedTarget;
    if (from instanceof HTMLElement && from !== document.body && !el?.contains(from))
      back = from;
  }}
  onfocusout={() => (focused = false)}
>
  {#if toast}
    {toast.msg}
    {#if toast.action?.href}
      <a
        class="toast-act"
        href={app.href(toast.action.href)}
        target="_blank"
        rel="noopener"
        onclick={() => {
          own = true;
          app.hideToast();
        }}>{toast.action.label}</a
      >
    {:else if toast.action?.go}
      {@const go = toast.action.go}
      <button
        type="button"
        class="toast-act"
        onclick={() => {
          goAction(go);
        }}>{toast.action.label}</button
      >
    {:else if toast.action}
      <button type="button" class="toast-act" onclick={runAction}>{toast.action.label}</button>
    {/if}
  {/if}
</div>

<style>
  /* off `.toast` in style.css, plus the popover resets a plain fixed element
     does not need: `inset`/`margin` replace the UA default centering, `border`
     replaces the UA popover border and `overflow` undoes its scroll, and `color`/
     `background` are the browser's Canvas/CanvasText for a plain popover -
     `.toast.err` still overrides them for the alert flavor below. */
  .toast {
    position: fixed;
    inset: auto auto 26px 50%;
    margin: 0;
    overflow: visible;
    transform: translateX(-50%);
    /* Left at 50%, a shrink-to-fit box gets half the window: a long name then
       stacks the toast up over the controls (docs/specs/FEATURES.md, rule 16). */
    width: max-content;
    max-width: calc(100% - 32px);
    background: var(--surface);
    border: 1px solid var(--muted2);
    color: var(--txt);
    font-weight: 600;
    font-size: var(--t-small);
    padding: 10px 16px;
    border-radius: var(--r);
    box-shadow: 0 12px 30px -10px rgb(0 0 0 / 70%);
    z-index: 200;
    animation: toastIn 0.2s ease both;
    overflow-wrap: anywhere;
  }

  /* The alarm fill with dark ink, about 5.6:1 (DESIGN.md, "Toast"). */
  .toast.err {
    background: var(--danger);
    border-color: var(--danger);
    color: var(--ink-on-gold);
  }

  /* off `.toast.act` - a toast that asks something rather than reporting it */
  .toast.act {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding-right: 8px;
  }

  .toast-act {
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    padding: 5px 12px;
    font: inherit;
    font-weight: 650;
    font-size: var(--t-data);
    background: var(--surface2);
    color: inherit;
    text-decoration: none;
    white-space: nowrap;
    transition: 0.14s;
  }

  .toast-act:hover {
    border-color: var(--gold);
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

  /* off `#toast` in the live `@media print` block (`git show 23c00a6^:style.css`): without
     `!important`, `.toast{display:none}` (0,1,0) lost under print to
     `.toast.act{display:inline-flex}` (0,2,0) above, so an action toast (an
     undo prompt, mid-copy) printed over the page. */
  @media print {
    .toast {
      display: none !important;
    }
  }
</style>
