<script lang="ts">
  /* One button, with variants, so that "which grey is this one" stops being a
     question anybody has to answer twice.

     The gold fill means "this is the action" and is deliberately rare: on the
     roll pages five buttons do the same thing with different dice, and filling
     the first one read as "press here" when the choice is by rarity, not by
     order. */
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'plain' | 'gold' | 'ghost' | 'danger';
    size?: 'md' | 'sm';
    /** Renders an <a>, because a link that navigates has to be a link. */
    href?: string;
    disabled?: boolean;
    pressed?: boolean;
    title?: string;
    label?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  const {
    variant = 'plain',
    size = 'md',
    href,
    disabled = false,
    pressed,
    title,
    label,
    onclick,
    children
  }: Props = $props();
</script>

{#if href}
  <a class="btn {variant} {size}" {href} {title} aria-label={label}>{@render children()}</a>
{:else}
  <button
    type="button"
    class="btn {variant} {size}"
    {disabled}
    {title}
    aria-label={label}
    aria-pressed={pressed === undefined ? undefined : pressed}
    {onclick}
  >
    {@render children()}
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-sm);
    padding: 8px 14px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface2);
    color: var(--txt);
    font: 600 var(--step--1) / 1.2 var(--ui);
    text-decoration: none;
    cursor: pointer;
  }

  .btn.sm {
    padding: 5px 10px;
    font-size: var(--step--2);
  }

  .btn.gold {
    border-color: var(--gold);
    background: rgb(216 171 94 / 12%);
    color: var(--gold-soft);
  }

  .btn.ghost {
    border-color: transparent;
    background: none;
    color: var(--muted);
  }

  .btn.danger {
    border-color: var(--danger);
    color: var(--danger);
  }

  .btn[aria-pressed='true'] {
    border-color: var(--gold);
    background: rgb(216 171 94 / 7%);
    color: var(--gold-soft);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* Only where there is a pointer. On a phone :hover sticks after a tap and the
     control goes on looking chosen until something else is touched. */
  @media (hover: hover) {
    .btn:not(:disabled):hover {
      border-color: var(--gold);
    }
  }
</style>
