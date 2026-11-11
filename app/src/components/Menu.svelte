<script lang="ts">
  /* The menu box: the account menu, the catalog's and the record's
     «Ещё» (docs/specs/FEATURES.md, "Chrome", the account menu). The first item takes the focus; Up,
     Down, Home and End move it; Escape and a click outside close the menu. */
  import type { Snippet } from 'svelte';
  import { focusBack, openOverlay } from './overlay.js';

  interface Props {
    /** The button that opens the menu: a click on it is its own, and Escape returns focus to it. */
    control: HTMLElement;
    label: string;
    id: string;
    onclose: () => void;
    /** The caller's class, which the browser suites read. */
    cls: string;
    children: Snippet;
  }

  const { control, label, id, onclose, cls, children }: Props = $props();

  let menu = $state<HTMLDivElement | undefined>(undefined);

  const items = (): HTMLElement[] =>
    menu ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')] : [];

  const inside = (n: EventTarget | null): boolean =>
    n instanceof Node && (!!menu?.contains(n) || control.contains(n));

  /* Placed in the top layer before the focus, which must not scroll the page. */
  $effect(() => {
    if (!menu) return;
    const stop = openOverlay(menu, control);
    items()[0]?.focus({ preventScroll: true });
    return stop;
  });

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      onclose();
      focusBack(control);
      return;
    }
    const list = items();
    const focused = document.activeElement;
    const at = focused instanceof HTMLElement ? list.indexOf(focused) : -1;
    if (at < 0) return;
    const n = list.length;
    let next: number;
    if (e.key === 'ArrowDown') next = (at + 1) % n;
    else if (e.key === 'ArrowUp') next = (at - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else return;
    e.preventDefault();
    list[next]?.focus();
  }

  /* The opening click reaches `document` after the menu mounts; it lands in
     `control` and is left to the control's own toggle. */
  function onDocumentClick(e: MouseEvent): void {
    if (!inside(e.target)) onclose();
  }
</script>

<svelte:document onclick={onDocumentClick} />
<svelte:window onkeydown={onKeydown} />

<div class="menu {cls}" {id} role="menu" aria-label={label} tabindex="-1" bind:this={menu}>
  {@render children()}
</div>

<style>
  /* A popover in the top layer, placed by `openOverlay`; the UA's `inset`, `margin`, `color`
     and `overflow` are reset as `Toast` does. */
  .menu {
    position: fixed;
    inset: auto;
    margin: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    color: var(--txt);
    min-width: 220px;
    max-width: min(320px, 90vw);
    z-index: 60;
    border: 1px solid var(--line2);
    border-radius: var(--r);
    background: var(--surface);
    padding: 6px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 2px;
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

  .menu :global([role='menuitem']) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-radius: var(--r-sm);
    color: var(--txt);
    font: inherit;
    font-size: var(--t-control);
    text-align: left;
    text-decoration: none;
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  .menu :global([role='menuitem']:hover),
  .menu :global([role='menuitem']:focus) {
    background: var(--surface2);
  }

  @media (max-width: 600px) {
    .menu :global([role='menuitem']) {
      min-height: 44px;
    }
  }

  .menu:global([data-side='up']) {
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
</style>
