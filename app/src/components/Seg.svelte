<script lang="ts" generics="T extends string">
  /* The segmented control - `.seg` in style.css - on its third real use.
   * `LangSwitch.svelte` and `TablesPage.svelte`'s view switch each carried
   * the whole rule set; this is that pair collapsed into one component, with
   * an honest `aria-pressed` on every use - the live language segment writes
   * it (app.js:3664), the live view and print segments do not, and the fix
   * is to add it everywhere rather than lose it from the pair that had it. */
  interface Option<T> {
    value: T;
    label: string;
  }

  interface Props<T> {
    options: readonly Option<T>[];
    value: T;
    /** The group's `aria-label`. */
    label: string;
    /** `.seg.small` - the print bar's and the tables view switch's own size. */
    small?: boolean;
    onchange: (value: T) => void;
  }

  const { options, value, label, small = false, onchange }: Props<T> = $props();
</script>

<div class="seg" class:small role="group" aria-label={label}>
  {#each options as o (o.value)}
    <button
      type="button"
      class:on={o.value === value}
      aria-pressed={o.value === value}
      onclick={() => {
        onchange(o.value);
      }}>{o.label}</button
    >
  {/each}
</div>

<style>
  /* off `.seg` in style.css (72-81, 880-881) */
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
    font-size: 12.5px;
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
    font-size: 12px;
  }

  .seg button.on {
    background: var(--gold);
    color: var(--ink-on-gold);
  }

  .seg button:not(.on):hover {
    color: var(--txt);
  }

  /* D18, paid off: this component's own 8px-radius override deleted - the
     global `:focus-visible` rule (tokens.css) already reaches every
     control, at the one radius the owner chose. */

  @media (max-width: 600px) {
    .seg button,
    .seg.small button {
      padding: 8px 14px;
    }
  }
</style>
