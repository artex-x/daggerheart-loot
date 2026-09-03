<script lang="ts">
  /* One choice in a row of them, off `.chip` in style.css.

     Extracted on the second use, not before: the Vault of Ages section picker
     and the community picker are both a row of these, and the source, kind and
     rarity rows of the other two roll modes will be the third and fourth.

     The `href` form is the table navigation's second use: the live app writes
     those chips as `<a>` rather than `<button>`, so middle-click and
     open-in-new-tab work on them for free - the same reason the tab bar is
     real links rather than buttons with a click handler. */

  interface Base {
    label: string;
    /** Whether this is the one currently chosen. */
    on: boolean;
    /** Why pressing it will be refused, where it will be. */
    title?: string | undefined;
    /**
     * A second line under the label, smaller and quieter.
     *
     * The rarity chips carry the tiers each rarity is a recommendation for.
     * The dice buttons on Core rules do the same thing the other way round -
     * the count above, the rarities under it.
     */
    sub?: string | undefined;
    /** `sm` is the table nav's second row - a book's own sections, quieter
     *  than the row of books above them. */
    size?: 'md' | 'sm';
  }

  /* One or the other, never both: a chip that both navigates and handles a
     click is not what either the roll pickers or the table nav actually is. */
  type Props = Base &
    ({ href: string; onclick?: never } | { href?: never; onclick: () => void });

  const { label, on, title, sub, size = 'md', href, onclick }: Props = $props();
</script>

{#if href}
  <a
    class="chip"
    class:on
    class:sm={size === 'sm'}
    aria-current={on ? 'page' : undefined}
    {title}
    {href}
    >{label}{#if sub}<small>{sub}</small>{/if}</a
  >
{:else}
  <button
    type="button"
    class="chip"
    class:on
    class:sm={size === 'sm'}
    aria-pressed={on}
    {title}
    {onclick}
    >{label}{#if sub}<small>{sub}</small>{/if}</button
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
    font-size: 13px;
    font-weight: 540;
    transition: 0.15s;
  }

  .chip small {
    display: block;
    font-size: 10.5px;
    opacity: 0.72;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .chip:hover {
    border-color: var(--gold);
    color: var(--txt);
  }

  .chip.on {
    background: var(--gold);
    border-color: var(--gold);
    color: #1a1206;
    font-weight: 650;
  }

  /* off `.chip.sm` in style.css */
  .chip.sm {
    padding: 5px 11px;
    font-size: 12.5px;
  }
</style>
