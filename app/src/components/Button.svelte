<script lang="ts">
  /* One button, so "which grey is this one" stops being a question anybody has
     to answer twice.

     Deliberately smaller than the version that was deleted from this file: that
     one shipped four variants and two sizes before a single screen used any of
     them, and unused variants cannot be tested honestly - nothing renders them,
     so nothing tells you when one breaks. This has exactly what the record page
     needs. A variant is added the first time a second screen wants a different
     one, not in anticipation of it. See CLAUDE.md, "Components". */
  import type { Snippet } from 'svelte';

  interface Props {
    disabled?: boolean;
    /** For an icon-only button, where the visible text is not the name. */
    label?: string;
    title?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  const { disabled = false, label, title, onclick, children }: Props = $props();
</script>

<button type="button" {disabled} {title} aria-label={label} {onclick}>
  {@render children()}
</button>

<style>
  button {
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
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* Only where there is a pointer. On a phone :hover sticks after a tap and the
     control goes on looking chosen until something else is touched. */
  @media (hover: hover) {
    button:not(:disabled):hover {
      border-color: var(--gold);
    }
  }
</style>
