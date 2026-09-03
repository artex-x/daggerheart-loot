<script lang="ts">
  /* The app's button, reproduced from `.btn` in style.css.

     It exists because two places now want it - the roll panel and the record's
     action row - which is the rule: extract on the second use, never before.
     The two variants are the two the live app has in these places, and a third
     arrives when a screen needs one, not in anticipation. */
  import type { Snippet } from 'svelte';

  interface Base {
    /** `primary` is the gold fill the live app keeps for the main action. */
    variant?: 'plain' | 'primary';
    /** `sm` is the 32px row on a card; the default 46px is the panel's. */
    size?: 'md' | 'sm';
    title?: string;
    /** For a button whose visible text is not its name. */
    label?: string;
    /**
     * Where it goes, for the ones that are links.
     *
     * The live app shares `.btn` between buttons and anchors, and a link has
     * to stay a link: the critical-success box opens a table in a new tab, and
     * a button with a click handler would lose the middle-click and the
     * history entry. The only link-button today is that external one, so the
     * new tab is fixed here rather than offered as a prop; an in-app one gets
     * the prop when a screen needs it.
     */
    href?: string | undefined;
    onclick?: (() => void) | undefined;
    children: Snippet;
  }

  /* One or the other, never both and never neither: a button that does nothing
     is not one, and a link does its work by being a link. */
  type Props = Base & ({ href: string } | { onclick: () => void });

  const {
    variant = 'plain',
    size = 'md',
    title,
    label,
    href,
    onclick,
    children
  }: Props = $props();
</script>

{#if href}
  <a
    class="btn {variant} {size}"
    {href}
    {title}
    aria-label={label}
    target="_blank"
    rel="noopener"
  >
    {@render children()}
  </a>
{:else}
  <button type="button" class="btn {variant} {size}" {title} aria-label={label} {onclick}>
    {@render children()}
  </button>
{/if}

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

  /* off `.btn svg` in style.css: every icon inside a button is 15px, whatever
     its own width attribute says. The external-link icon is written at 13 in
     the live markup and drawn at 15 by this rule, and copying the attribute
     rather than the rule cost four pixels a button on the parity diff. */
  .btn :global(svg) {
    width: 15px;
    height: 15px;
    fill: currentcolor;
    flex: none;
  }

  /* The one exception the live app writes out as well: `.btn .dieicon` beats
     `.btn svg`, so a die keeps its own height and its own width - each die is
     a different shape and squaring them makes a d4 heavier than a d20. */
  .btn :global(.dieicon) {
    width: auto;
    height: 18px;
    fill: none;
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
