<script lang="ts" generics="T extends string">
  /* The segmented control - `.seg` in style.css - on its third real use.
   * `LangSwitch.svelte` and `TablesPage.svelte`'s view switch each carried
   * the whole rule set; this is that pair collapsed into one component, with
   * an honest `aria-pressed` on every use - the live language segment writes
   * it (`git show 23c00a6^:app.js`), the live view and print segments do not, and the fix
   * is to add it everywhere rather than lose it from the pair that had it. */
  import Icon from './Icon.svelte';

  interface Option<T> {
    value: T;
    label: string;
    /** A dot after the label and this hidden text: the option holds something (the list
     *  page's filled note). */
    filled?: string | undefined;
  }

  interface Props<T> {
    options: readonly Option<T>[];
    value: T;
    /** The group's `aria-label`. */
    label: string;
    /** `.seg.small` - the print bar's and the tables view switch's own size. */
    small?: boolean;
    /** A mode toggle: the pressed option takes a check and a lit border, not the
     *  gold of a choice that narrows the view (DESIGN.md, "Segmented control"). */
    neutral?: boolean;
    /** A form field's id: a problem's link focuses the group. */
    id?: string;
    /** The id of the error line under the group. `aria-invalid` is not allowed on a
     *  group, so a choice with a problem draws its line only. */
    describedby?: string | undefined;
    /** The value a press on the pressed option sends; absent, a pressed option stays
     *  pressed. */
    none?: T | undefined;
    onchange: (value: T) => void;
  }

  const {
    options,
    value,
    label,
    small = false,
    neutral = false,
    id,
    describedby,
    none,
    onchange
  }: Props<T> = $props();
</script>

<!-- The value is -1 or absent: a problem's link focuses the group, Tab never stops on
     it. The check cannot read the expression. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="seg"
  class:small
  class:neutral
  role="group"
  aria-label={label}
  {id}
  tabindex={id === undefined ? undefined : -1}
  aria-describedby={describedby}
>
  {#each options as o (o.value)}
    <button
      type="button"
      class:on={o.value === value}
      aria-pressed={o.value === value}
      onclick={() => {
        onchange(o.value === value && none !== undefined ? none : o.value);
      }}
      >{#if o.value === value}<Icon name="check" />{/if}{o.label}{#if o.filled}<span
          class="dot"
          aria-hidden="true"
        ></span><span class="vh">{o.filled}</span>{/if}</button
    >
  {/each}
</div>

<style>
  /* off `.seg` in `git show 23c00a6^:style.css` */
  .seg {
    display: flex;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 3px;
  }

  .seg button {
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 5px 13px;
    border-radius: 999px;
    font-size: var(--t-data);
    font-weight: 650;
    letter-spacing: 0.05em;
    transition: 0.16s;
    cursor: pointer;
  }

  .seg.small {
    align-self: stretch;
  }

  .seg.small button {
    padding: 4px 12px;
    font-size: var(--t-label);
  }

  .seg button.on {
    background: var(--gold);
    color: var(--ink-on-gold);
  }

  /* Every pressed option draws the check (DESIGN.md "Components", "The Check Rule"); the
     icon and the label share one center (DESIGN.md, "Buttons"). */
  .seg button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentcolor;
  }

  .seg.neutral button.on {
    background: var(--surface2);
    color: var(--txt);
    box-shadow: inset 0 0 0 1px var(--muted2);
  }

  .seg button:not(.on):hover {
    color: var(--txt);
  }

  /* D18, paid off: this component's own 8px-radius override deleted - the
     global `:focus-visible` rule (tokens.css) already reaches every
     control, at the one radius the owner chose. */

  /* The thumb target; the track gives up its inset so the header keeps its height
     (DESIGN.md, "The Phone-First Rule"), and the pressed option fills it. */
  @media (max-width: 600px) {
    .seg {
      padding: 0 1px;
    }

    .seg button,
    .seg.small button {
      padding: 8px 14px;
      min-height: var(--thumb);
      min-width: var(--thumb);
      justify-content: center;
    }
  }
</style>
