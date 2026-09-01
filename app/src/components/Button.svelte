<script lang="ts">
  /* The app's button, reproduced from `.btn` in style.css.

     It exists because two places now want it - the roll panel and the record's
     action row - which is the rule: extract on the second use, never before.
     The two variants are the two the live app has in these places, and a third
     arrives when a screen needs one, not in anticipation. */
  import type { Snippet } from 'svelte';

  interface Props {
    /** `primary` is the gold fill the live app keeps for the main action. */
    variant?: 'plain' | 'primary';
    /** `sm` is the 32px row on a card; the default 46px is the panel's. */
    size?: 'md' | 'sm';
    title?: string;
    /** For a button whose visible text is not its name. */
    label?: string;
    /* Required: a button that does nothing is not one. */
    onclick: () => void;
    children: Snippet;
  }

  const { variant = 'plain', size = 'md', title, label, onclick, children }: Props = $props();
</script>

<button type="button" class="btn {variant} {size}" {title} aria-label={label} {onclick}>
  {@render children()}
</button>

<style>
  /* off `.btn` */
  .btn {
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--txt);
    padding: 0 18px;
    height: 46px;
    border-radius: var(--r-sm);
    font-size: 14px;
    font-weight: 600;
    transition: 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    cursor: pointer;
  }

  /* off `.btn.sm` */
  .btn.sm {
    height: 32px;
    padding: 0 11px;
    font-size: 12.5px;
    border-radius: 8px;
    gap: 6px;
    white-space: nowrap;
  }

  .btn:hover {
    border-color: var(--gold);
    background: var(--surface2);
  }

  .btn.primary {
    background: linear-gradient(180deg, #e2b76c, var(--gold));
    border-color: #e8c27c;
    color: #1a1206;
    font-weight: 700;
  }

  .btn.primary:hover {
    filter: brightness(1.07);
    background: linear-gradient(180deg, #e2b76c, var(--gold));
  }
</style>
