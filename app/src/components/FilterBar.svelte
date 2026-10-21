<script lang="ts">
  /* The table filter: the strip and the panel it folds open, off `fBarHTML`
     and `fPanelHTML` in app.js. One component because the live app draws both
     from one function and they are one feature - what is picked shows in the
     strip whether or not the panel under it is open.

     Owns none of the routing: the caller hands in what is picked, what is
     open, and a callback for every action. `TablesPage` and `SharedListPage`
     are what turn a pick into an address.

     It owns two things of its own: the focus after a pill or «Сбросить всё»
     removes itself (docs/specs/FEATURES.md, rule 20), and the fold of a row of
     more than `FOLD_AT` values, page memory closed when the strip mounts
     ("Tables and search"). */
  import { tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Icon from './Icon.svelte';
  import type { Dict } from '../lib/dict.js';
  import type { FacetRow } from '../lib/facets.js';
  import { groupIsAny, type FilterState } from '../lib/filters.js';

  interface Props {
    rows: FacetRow[];
    picked: FilterState;
    shown: number;
    total: number;
    open: boolean;
    t: Dict;
    ontoggle: () => void;
    onpick: (group: string, value: string) => void;
    onreset: () => void;
    /** Absent where the address cannot carry the filter (`#/l/`, the homebrew table and the
     *  Items tab): no link button. */
    oncopylink?: (() => void) | undefined;
    /** The «Фильтры» toggle, for a caller's empty state whose «Сбросить всё» focuses it. */
    toggleEl?: HTMLButtonElement | undefined;
  }

  let {
    rows,
    picked,
    shown,
    total,
    open,
    t,
    ontoggle,
    onpick,
    onreset,
    oncopylink,
    toggleEl = $bindable()
  }: Props = $props();

  /* A row of more than FOLD_AT values draws FOLD_SHOWN of them, then every picked one. */
  const FOLD_AT = 12;
  const FOLD_SHOWN = 10;
  const unfolded = new SvelteSet<string>();

  let bar = $state<HTMLDivElement | undefined>(undefined);

  /* Rule 20: the control now at the pressed place, else the one before it, else the toggle,
     else `#main` (the strip left: no row narrows any more). */
  function focusAfter(at: number): void {
    const live = bar?.isConnected ? bar : null;
    const pills = live ? [...live.querySelectorAll<HTMLElement>('.fpill')] : [];
    const toggle = live?.querySelector<HTMLElement>('button[aria-expanded]');
    (pills[at] ?? pills[at - 1] ?? toggle ?? document.getElementById('main'))?.focus();
  }

  async function dropPill(at: number, group: string, value: string): Promise<void> {
    onpick(group, value);
    await tick();
    focusAfter(at);
  }

  async function resetAll(): Promise<void> {
    onreset();
    await tick();
    focusAfter(-1);
  }

  /** The values a row draws: all of them, or the first FOLD_SHOWN and every picked one. */
  function drawnValues(row: FacetRow): { values: FacetRow['values']; more: number } {
    if (row.values.length <= FOLD_AT || unfolded.has(row.group)) {
      return { values: row.values, more: 0 };
    }
    const on = picked[row.group] ?? [];
    const values = row.values.filter((v, i) => i < FOLD_SHOWN || on.includes(v.value));
    return { values, more: row.values.length - values.length };
  }

  /* Everything picked, in the order the rows are drawn - `fChosen` in app.js.
     A bare number takes its row's name rather than standing for itself - but
     `fChosen` tests the value's *label*, not its value. They agree everywhere
     a group offers a numeric value (`voa`'s tier prints "Ранг 2" either way,
     because its label already is that string), and part on the equipment
     tables' burden row: value `'1'`/`'2'`, label "Одноручное"/"Двуручное" -
     testing the value would print "Хват 2" where the live app prints
     "Двуручное". */
  const chosen = $derived(
    rows.flatMap((row) =>
      row.values
        .filter((v) => picked[row.group]?.includes(v.value))
        .map((v) => ({
          group: row.group,
          value: v.value,
          label: /^\d+$/.test(v.label) ? row.label + ' ' + v.label : v.label
        }))
    )
  );

  const toggleLabel = $derived(
    chosen.length ? `${t.filters} (${String(chosen.length)})` : t.filters
  );

  /* A literal space at the start of an `{#if}` block is dropped by Svelte's
     whitespace trimming, not just collapsed - unlike the space `t().anyValue`
     puts before the italic hint in app.js.

     The space therefore lives inside the label's own expression rather than
     beside it. That is not only about trimming: app.js emits the label and its
     space as one text node, and a separate `{' '}` made two, which measures
     0.1px wider in English because a text advance rounds per node. The parity
     type probe caught it - see issue 47. */
</script>

{#if rows.length}
  <div class="fbar" bind:this={bar}>
    <Button
      variant={chosen.length ? 'toggle' : 'plain'}
      size="sm"
      expanded={open}
      caret
      bind:el={toggleEl}
      onclick={ontoggle}
    >
      {toggleLabel}
    </Button>
    {#each chosen as c, i (c.group + ':' + c.value)}
      <button
        type="button"
        class="fpill"
        data-val={c.group + ':' + c.value}
        title={t.dropValue}
        onclick={() => void dropPill(i, c.group, c.value)}
        >{c.label}<i aria-hidden="true">&times;</i></button
      >
    {/each}
    {#if chosen.length}
      <button type="button" class="fclear" onclick={() => void resetAll()}>{t.resetAll}</button>
      {#if oncopylink}
        <button
          type="button"
          class="flink"
          title={t.filterLink}
          aria-label={t.filterLink}
          onclick={oncopylink}
        >
          <Icon name="link" />
        </button>
      {/if}
    {/if}
    <span class="fcount"
      >{chosen.length ? `${String(shown)} ${t.outOf} ${String(total)}` : String(total)}</span
    >
  </div>
  {#if open}
    <!-- `.ffilter` is a `Panel.svelte` variant: the base `.panel` rule plus
         this component's own margin-top, kept inline for the same reason
         `TablesPage`'s `.tablenav` is. -->
    <div class="panel ffilter">
      {#each rows as row (row.group)}
        {@const fold = drawnValues(row)}
        <div class="field">
          <!-- Whitespace below is content - see docs/specs/COVERAGE.md,
               "Whitespace text nodes are content". -->
          <!-- prettier-ignore -->
          <span class="lbl"
            >{#if groupIsAny(picked, row.group)}{`${row.label} `}<i>{t.anyValue}</i
              >{:else}{row.label}{/if}</span
          >
          <ChipRow>
            {#each fold.values as v (v.value)}
              <Chip
                label={v.label}
                on={!!picked[row.group]?.includes(v.value)}
                onclick={() => {
                  onpick(row.group, v.value);
                }}
              />
            {/each}
            {#if row.values.length > FOLD_AT}
              <!-- Rule 12: «и ещё N» closed, «свернуть» open; one button, so focus stays. -->
              <Button
                variant="bare"
                size="sm"
                caret
                expanded={unfolded.has(row.group)}
                onclick={() => {
                  if (unfolded.has(row.group)) unfolded.delete(row.group);
                  else unfolded.add(row.group);
                }}
                >{unfolded.has(row.group)
                  ? t.relLess
                  : t.andMore.replace('%n', String(fold.more))}</Button
              >
            {/if}
          </ChipRow>
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  /* off `.fbar` in style.css. Under the bare toolbar the 16px collapses into
     `.toolbar`'s 18px margin-bottom (adjacent margins take the larger); it
     shows under the tables page's `.keepnote`, which zeroes that margin. */
  .fbar {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  /* off `.fpill`. A long own source name wraps inside the strip instead of
     overflowing it at 360 px (docs/specs/FEATURES.md, rule 16); one line is
     the 20px line box plus 5+5 padding and the border: 32px, as before. */
  .fpill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    max-width: 100%;
    min-height: 32px;
    padding: 5px 8px 5px 11px;
    border: 1px solid rgb(216 171 94 / 45%);
    border-radius: 8px;
    background: rgb(216 171 94 / 12%);
    color: var(--gold-soft);
    font-size: 12.5px;
    font-weight: 600;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: start;
    transition: 0.15s;
  }

  .fpill i {
    font-style: normal;
    font-size: 15px;
    line-height: 1;
    color: var(--muted);
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
  }

  .fpill:hover {
    border-color: var(--gold);
  }

  .fpill:hover i {
    background: rgb(255 255 255 / 10%);
    color: var(--txt);
  }

  /* off `.fclear` */
  .fclear {
    height: 32px;
    padding: 0 9px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    font-size: 12.5px;
    font-weight: 600;
    white-space: nowrap;
    transition: 0.15s;
  }

  .fclear:hover {
    background: rgb(255 255 255 / 6%);
    color: var(--txt);
  }

  /* off `.flink` */
  .flink {
    width: 32px;
    height: 32px;
    flex: none;
    padding: 0;
    border-radius: 8px;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
  }

  .flink:hover {
    border-color: var(--gold);
    color: var(--gold-soft);
  }

  /* off `.fcount` */
  .fcount {
    margin-left: auto;
    font: 600 12px/1 var(--mono);
    color: var(--muted2);
    white-space: nowrap;
  }

  /* off `.panel` in style.css, the same base `.tablenav` in TablesPage.svelte
     copies - `.ffilter` is a second use of that same base class, styled
     locally the same way. `.ffilter`'s own margin-top is declared twice in
     style.css (926 and 948); the second, 10px, is the one that wins at the
     same specificity. */
  .ffilter {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
    margin-top: 10px;
  }

  /* off `.field` in style.css. The base rule also carries a `:last-child`
     reset to 0 (line 151), but it and `.ffilter .field` (927) tie in
     specificity - two classes each, a pseudo-class counting as one - so the
     one written later in the file wins the cascade. `.ffilter .field` comes
     after, so the reset never actually applies here: every field in this
     panel keeps the full 12px, the last one included. Measured off the live
     app rather than reasoned from the source - the .numbox trap again. */
  .field {
    margin-bottom: 12px;
  }

  /* off `.lbl` in style.css, with `.ffilter .lbl`'s override folded in: only
     the margin differs from the base rule. */
  .lbl {
    display: block;
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 6px;
  }

  .lbl i {
    font-style: normal;
    text-transform: none;
    letter-spacing: 0;
    font-size: 11px;
    color: var(--muted2);
    opacity: 0.8;
  }
</style>
