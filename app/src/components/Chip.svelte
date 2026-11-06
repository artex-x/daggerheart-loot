<script lang="ts">
  /* One choice in a row of them, off `.chip` in style.css.

     Extracted on the second use, not before: the source, kind and rarity rows of
     the roll pages and the filter rows are all rows of these.

     The `href` form is the table navigation's second use: the live app writes
     those chips as `<a>` rather than `<button>`, so middle-click and
     open-in-new-tab work on them for free - the same reason the tab bar is
     real links rather than buttons with a click handler. */

  import Icon from './Icon.svelte';

  interface Base {
    label: string;
    /** Whether this is the one currently chosen. */
    on: boolean;
    /** Why pressing it will be refused, where it will be. */
    title?: string | undefined;
    /**
     * The live app's own `data-val` on this control - the live source row's
     * (`git show 23c00a6^:app.js`) chips carry `"core"`/`"hnf"`, and nothing else in this component's
     * three callers does. Optional because most chips are gripped by their
     * Russian label alone; `StdPanel`'s source row is the one place a test
     * needs to tell them apart without reading the language-dependent text.
     */
    value?: string | undefined;
    /** `sm` is the table nav's second row - a book's own sections, quieter
     *  than the row of books above them. */
    size?: 'md' | 'sm';
  }

  /* One or the other, never both: a chip that both navigates and handles a
     click is not what either the roll pickers or the table nav actually is. */
  type Props = Base &
    (
      | {
          href: string;
          /** A count after the label, as the homebrew pills draw it. */
          count?: number | undefined;
          onclick?: never;
          neutral?: never;
          filter?: never;
        }
      | {
          href?: never;
          count?: never;
          onclick: () => void;
          /** The neutral pressed default (DESIGN.md, "Chips"): a check and a lit ground,
           *  never gold. A filter row's «Все» is its caller. */
          neutral?: boolean | undefined;
          /** A filter value, `<group>:<value>`, as `data-fval` for the browser suites. */
          filter?: string | undefined;
        }
    );

  const {
    label,
    on,
    title,
    size = 'md',
    href,
    count,
    onclick,
    value,
    neutral,
    filter
  }: Props = $props();
  /* The space keeps the count apart in the accessible name («Предметы 44»). */
  const gap = $derived(count === undefined ? '' : ' ');
</script>

{#if href}
  <a
    class="chip"
    class:on
    class:sm={size === 'sm'}
    aria-current={on ? 'page' : undefined}
    data-val={value}
    {title}
    {href}
    ><span class="pl" data-label={label}>{label}</span>{gap}{#if count !== undefined}<span
        class="n">{count}</span
      >{/if}</a
  >
{:else}
  <button
    type="button"
    class="chip"
    class:on
    class:sm={size === 'sm'}
    class:neutral
    aria-pressed={on}
    data-val={value}
    data-fval={filter}
    {title}
    {onclick}
    >{#if on}<Icon name="check" />{/if}{label}</button
  >
{/if}

<style>
  /* off `.chip` in style.css. `inline-block` and the missing underline are
     there because the live rule is shared with the table navigation, where a
     chip is a link; the values are copied rather than trimmed to what a button
     needs, so the two rows measure the same. */
  .chip {
    display: inline-block;
    text-decoration: none;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    padding: 7px 12px;
    border-radius: 999px;
    font-size: var(--t-data);
    font-weight: 540;
    transition: 0.15s;
    overflow-wrap: anywhere;
  }

  .chip:hover {
    border-color: var(--gold);
    color: var(--txt);
  }

  .chip.on {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--ink-on-gold);
    font-weight: 650;
  }

  /* The label keeps the width of its lit weight, so a lit pill does not move its neighbors
     (DESIGN.md, "Sibling pills"). */
  .pl {
    display: inline-grid;
  }

  .pl::after {
    content: attr(data-label) / '';
    height: 0;
    overflow: hidden;
    visibility: hidden;
    font-weight: 650;
  }

  .chip .n {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--muted2);
  }

  /* Ink on Gold on the lit pill (DESIGN.md, "The Ink Rule"). */
  .chip.on .n {
    color: inherit;
  }

  /* A pressed chip draws the check (DESIGN.md "Components", "The Check Rule"); the check
     and the label share one center. A link chip marks a place and draws none. */
  button.chip.on {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  /* The neutral pressed default. */
  .chip.neutral.on {
    background: var(--surface2);
    border-color: var(--muted2);
    color: var(--txt);
    font-weight: 600;
  }

  /* off `.chip.sm` in style.css */
  .chip.sm {
    padding: 5px 11px;
    font-size: var(--t-data);
  }

  /* The thumb target (DESIGN.md, "The Phone-First Rule"); the label keeps its center. */
  @media screen and (max-width: 600px) {
    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: var(--thumb);
      min-width: var(--thumb);
    }
  }
</style>
