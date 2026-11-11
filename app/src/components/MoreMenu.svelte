<script lang="ts">
  /* «Ещё»: the labeled button and its menu, on the record's row, a roll page's results line,
     a roll result's row and the homebrew pages. The caller draws the items and calls `close`
     first in each. */
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import Menu from './Menu.svelte';
  import { focusBack } from './overlay.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    id: string;
    size?: 'md' | 'sm';
    /** `bare`: text alone, the `/lists` card's corner draws no box around «Ещё». */
    variant?: 'plain' | 'bare';
    disabled?: boolean;
    /** The button's name where «Ещё» alone would not say whose menu it is (a list row). */
    label?: string | undefined;
    /** Draws the items; receives `close`, which closes the menu and returns the focus. */
    children: Snippet<[() => void]>;
  }

  const {
    app,
    id,
    size = 'md',
    variant = 'plain',
    disabled = false,
    label,
    children
  }: Props = $props();

  const t = $derived(app.t);
  let open = $state(false);
  let button = $state<HTMLButtonElement | undefined>(undefined);

  /* A pressed item leaves the DOM, so the focus goes back to «Ещё» (rule 20). */
  function close(): void {
    open = false;
    focusBack(button);
  }
</script>

<span class="morewrap">
  <Button
    {size}
    {variant}
    {disabled}
    {label}
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
      cls="recmenu"
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

  /* Up to 600 px every small «Ещё» is one box: the thumb height and a compact padding, so a
     page head holds its `h1`, its primary and «Ещё» on one row at 360 px (`/lists`).
     `.btn.btn`: `Button`'s own `.btn.sm` rule ties this one on specificity. */
  @media (max-width: 600px) {
    .morewrap :global(.btn.btn.sm) {
      gap: 4px;
      padding-inline: 6px;
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
