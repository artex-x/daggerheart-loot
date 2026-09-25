<script lang="ts">
  /* The app's button, reproduced from `.btn` in style.css.

     It exists because two places now want it - the roll panel and the record's
     action row - which is the rule: extract on the second use, never before.
     The two variants are the two the live app has in these places, and a third
     arrives when a screen needs one, not in anticipation - `danger`, for the
     lists index's delete button, is that third. */
  import type { Snippet } from 'svelte';

  interface Base {
    /** `primary` is the gold fill the live app keeps for the main action.
     *  `toggle` is `.ftoggle.has` - the filter strip's own button, gold text
     *  on a gold-tinted border rather than a fill, and only once it has
     *  something picked. `ghost` is `.btn.ghost` - a transparent fill, the
     *  cancel button beside a primary one. */
    variant?: 'plain' | 'primary' | 'toggle' | 'ghost' | 'danger';
    /** `sm` is the 32px row on a card; the default 46px is the panel's. */
    size?: 'md' | 'sm';
    title?: string;
    /** For a button whose visible text is not its name. */
    label?: string;
    /** `aria-expanded`, for a button that folds a panel open. */
    expanded?: boolean | undefined;
    /** The pressed look - `.btn.on` / `.btn.primary.on` - for a toggle that
     *  stays visible once it is on, rather than a filled fill like `toggle`. */
    on?: boolean;
    /** Renders `<i class="caret">` after the children, flipped by `expanded` -
     *  the filter toggle's and the add-to-list button's own down/up arrow. */
    caret?: boolean;
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
    /** Omits `target`/`rel` - the print link opens over the current page,
     *  the same tab the button click would have used anyway. */
    sameTab?: boolean;
    onclick?: (() => void) | undefined;
    /** A button only: while an action runs, or until a confirmation is
     *  typed. A link-button never takes it. */
    disabled?: boolean;
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
    expanded,
    on,
    caret,
    href,
    sameTab,
    onclick,
    disabled,
    children
  }: Props = $props();
</script>

{#if href}
  <a
    class="btn {variant} {size}"
    class:on
    {href}
    {title}
    aria-label={label}
    target={sameTab ? undefined : '_blank'}
    rel={sameTab ? undefined : 'noopener'}
  >
    {@render children()}{#if caret}<i class="caret" class:up={expanded}></i>{/if}
  </a>
{:else}
  <button
    type="button"
    class="btn {variant} {size}"
    class:on
    {title}
    aria-label={label}
    aria-expanded={expanded}
    {disabled}
    {onclick}
  >
    {@render children()}{#if caret}<i class="caret" class:up={expanded}></i>{/if}
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

  .btn:disabled {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
  }

  .btn.primary {
    background: linear-gradient(180deg, #e2b76c, var(--gold));
    border-color: #e8c27c;
    color: var(--ink-on-gold);
    font-weight: 700;
  }

  .btn.primary:hover {
    filter: brightness(1.07);
    background: linear-gradient(180deg, #e2b76c, var(--gold));
  }

  /* off `.ftoggle.has` in style.css - the filter toggle once something is
     picked. Always paired with size="sm" in the markup; the class carries only
     what `.has` adds on top of `.btn.sm`. */
  .btn.toggle {
    color: var(--gold-soft);
    border-color: rgb(216 171 94 / 45%);
  }

  /* off `.btn.ghost` - a transparent fill, the cancel button beside a primary
     one in the add-to-list form. */
  .btn.ghost {
    background: transparent;
    border-color: var(--line);
  }

  /* off `.btn.danger` - the lists index's delete button. */
  .btn.danger {
    border-color: rgb(224 104 95 / 40%);
    color: var(--danger-text);
  }

  .btn.danger:hover {
    border-color: var(--danger);
    background: rgb(224 104 95 / 12%);
  }

  /* off `.btn.on` / `.btn.primary.on` in style.css: gold outline on a plain
     button, a pushed-in look on a gold one - the add-to-list button while its
     menu is open. */
  .btn.on {
    border-color: var(--gold);
    color: var(--gold-soft);
    background: var(--surface2);
  }

  .btn.primary.on {
    background: linear-gradient(180deg, #c99b52, #b8873f);
    border-color: #c99b52;
    color: var(--ink-on-gold);
    box-shadow: inset 0 2px 5px rgb(0 0 0 / 35%);
  }

  /* off `.caret` in style.css - moved here from FilterBar.svelte, its first
     use, now that the add-to-list button wants the same down/up arrow. */
  .caret {
    width: 0;
    height: 0;
    margin-left: 2px;
    border: 4px solid transparent;
    border-top-color: currentcolor;
    transform: translateY(2px);
    display: inline-block;
  }

  .caret.up {
    border-top-color: transparent;
    border-bottom-color: currentcolor;
    transform: translateY(-2px);
  }
</style>
