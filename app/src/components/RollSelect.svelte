<script lang="ts">
  /* A choice among parts on a roll page: the name over the value, a native select laid over
     them, so the phone's own picker, the keyboard and a screen reader all come with it. */
  import Icon from './Icon.svelte';

  interface Props {
    label: string;
    value: string;
    options: readonly { id: string; label: string }[];
    onchange: (id: string) => void;
  }

  const { label, value, options, onchange }: Props = $props();

  const current = $derived(options.find((o) => o.id === value));
</script>

<label class="pick">
  <span class="pk" aria-hidden="true">{label}</span>
  <span class="pv" aria-hidden="true">{current?.label}</span>
  <Icon name="chevron" />
  <select
    aria-label={label}
    {value}
    onchange={(e) => {
      onchange(e.currentTarget.value);
    }}
  >
    {#each options as o (o.id)}
      <option value={o.id}>{o.label}</option>
    {/each}
  </select>
</label>

<style>
  .pick {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 6px;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 40px;
    padding: 2px 8px 2px 12px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface);
    color: var(--muted);
    line-height: 1.15;
    transition: 0.15s;
  }

  .pick:hover {
    border-color: var(--gold);
    background: var(--surface2);
  }

  .pick:has(select:focus-visible) {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  .pk {
    grid-area: 1 / 1;
    font-size: var(--t-label);
    font-weight: 600;
    color: var(--muted2);
  }

  .pv {
    grid-area: 2 / 1;
    overflow: hidden;
    font-size: var(--t-control);
    font-weight: 600;
    color: var(--txt);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pick :global(svg) {
    grid-area: 1 / 2 / 3 / 3;
  }

  /* 16 px: a smaller field makes iOS zoom the page on focus. */
  /* Over the border too: the whole box is the target. */
  select {
    position: absolute;
    inset: -1px;
    width: 100%;
    opacity: 0;
    font: inherit;
    font-size: 16px;
    cursor: pointer;
  }
</style>
