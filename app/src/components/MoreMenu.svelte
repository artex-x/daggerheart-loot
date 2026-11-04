<script lang="ts">
  /* «Ещё»: the labeled button and its menu, on the record's row, a roll page's results line,
     a roll result's row and the homebrew pages. The caller draws the items and calls `close`
     first in each. */
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import Menu from './Menu.svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    id: string;
    /** Sits in the record dialog's scroll box (`Menu`'s `flip`). */
    flip?: boolean;
    /** Sits at the window's bottom (the selection bar, the editor's bar): it opens up. */
    up?: boolean;
    size?: 'md' | 'sm';
    disabled?: boolean;
    /** Draws the items; receives `close`, which closes the menu and returns the focus. */
    children: Snippet<[() => void]>;
  }

  const {
    app,
    id,
    flip = false,
    up = false,
    size = 'md',
    disabled = false,
    children
  }: Props = $props();

  const t = $derived(app.t);
  /* `.menu`'s distance from its control. */
  const MENU_GAP = 8;
  let open = $state(false);
  let button = $state<HTMLButtonElement | undefined>(undefined);

  /* Up to 760 px the row anchors the menu, and a prompt under the row would push it away
     from «Ещё». A menu opened up already sits above the row. */
  function underMore(box: HTMLElement): void {
    const row = box.offsetParent;
    if (!row || !button || row === button.parentElement) return;
    if (box.classList.contains('up')) return;
    const top = button.getBoundingClientRect().bottom - row.getBoundingClientRect().top;
    box.style.top = `${String(top + MENU_GAP)}px`;
  }

  /* The row can sit at the window's bottom, and the menu opens past it. */
  $effect(() => {
    const box = open ? document.getElementById(id) : null;
    if (!box) return;
    underMore(box);
    box.scrollIntoView({ block: 'nearest' });
  });

  /* A pressed item leaves the DOM, so the focus goes back to «Ещё» (rule 20). */
  function close(): void {
    open = false;
    button?.focus();
  }
</script>

<span class="morewrap">
  <Button
    {size}
    {disabled}
    haspopup
    expanded={open}
    controls={open ? id : undefined}
    bind:el={button}
    onclick={() => {
      open = !open;
    }}><Icon name="more" />{t.moreMenu}</Button
  >
  {#if open && button}
    <Menu
      control={button}
      label={t.moreMenu}
      {id}
      cls={up ? 'recmenu up' : 'recmenu'}
      {flip}
      onclose={() => {
        open = false;
      }}
    >
      {@render children(close)}
    </Menu>
  {/if}
</span>

<style>
  .morewrap {
    position: relative;
    display: inline-flex;
  }

  /* Up to 760 px «Ещё» can wrap to the row's left, and the menu is wider than the button:
     the row anchors it, so it stays inside the window. */
  @media (max-width: 760px) {
    .morewrap {
      position: static;
    }
  }

  /* The wrap is as narrow as the button, and the menu's width must not follow it. */
  .morewrap :global(.recmenu) {
    width: max-content;
  }

  .morewrap :global(.recmenu [role='menuitem']:disabled) {
    opacity: 0.5;
    cursor: default;
  }

  .morewrap :global(.recmenu .danger) {
    color: var(--danger-text);
  }

  .morewrap :global(.msep) {
    height: 1px;
    margin: 4px 0;
    background: var(--line);
  }
</style>
