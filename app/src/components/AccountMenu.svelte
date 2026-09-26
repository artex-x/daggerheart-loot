<script lang="ts">
  /* The signed-in header control's menu: the account page, the lists index
     and signing out (docs/specs/FEATURES.md, "Chrome"). The class is
     `acctmenu`, never `dropmenu`: the browser suite reads `.dropmenu` as the
     add-to-list menu. */
  import { ACCOUNT_HASH, sectionHash } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The button that opens the menu: a click on it is its own, and Escape returns focus to it. */
    control: HTMLElement;
    onclose: () => void;
  }

  const { app, control, onclose }: Props = $props();

  const t = $derived(app.t);

  let menu = $state<HTMLDivElement | undefined>(undefined);

  const items = (): HTMLElement[] =>
    menu ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')] : [];

  const inside = (n: EventTarget | null): boolean =>
    n instanceof Node && (!!menu?.contains(n) || control.contains(n));

  $effect(() => {
    items()[0]?.focus();
  });

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      onclose();
      control.focus();
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

  function signOut(): void {
    onclose();
    void app.signOut('local').then((r) => {
      app.say(r.ok ? app.t.signedOut : app.t.accountFailed, { error: !r.ok });
    });
  }
</script>

<svelte:document onclick={onDocumentClick} />
<svelte:window onkeydown={onKeydown} />

<div
  class="acctmenu"
  id="account-menu"
  role="menu"
  aria-label={t.menuLabel}
  tabindex="-1"
  bind:this={menu}
>
  <a role="menuitem" tabindex="-1" href={ACCOUNT_HASH} onclick={onclose}>{t.account}</a>
  <a role="menuitem" tabindex="-1" href={sectionHash('lists')} onclick={onclose}
    >{t.menuLists}</a
  >
  <button type="button" role="menuitem" tabindex="-1" class="out" onclick={signOut}
    >{t.signOut}</button
  >
</div>

<style>
  /* The add-to-list menu's box (AddToList.svelte), opening down and
     right-aligned under the control. */
  .acctmenu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 220px;
    max-width: min(320px, 90vw);
    z-index: 60;
    border: 1px solid var(--line2);
    border-radius: 11px;
    background: var(--surface);
    padding: 6px;
    box-shadow: 0 16px 40px -14px rgb(0 0 0 / 85%);
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

  a,
  button {
    display: block;
    padding: 9px 12px;
    border-radius: 8px;
    color: var(--txt);
    font: inherit;
    font-size: 14px;
    text-align: left;
    text-decoration: none;
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  a:hover,
  a:focus,
  button:hover,
  button:focus {
    background: var(--surface2);
  }

  .out {
    border-top: 1px solid var(--line);
    border-radius: 0 0 8px 8px;
    margin-top: 4px;
  }

  @media (max-width: 600px) {
    a,
    button {
      display: flex;
      align-items: center;
      min-height: 44px;
    }
  }
</style>
