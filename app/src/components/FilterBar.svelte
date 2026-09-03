<script lang="ts">
  /* The table filter: the strip and the panel it folds open, off `fBarHTML`
     and `fPanelHTML` in app.js. One component because the live app draws both
     from one function and they are one feature - what is picked shows in the
     strip whether or not the panel under it is open.

     Owns none of the routing: the caller hands in what is picked, what is
     open, and a callback for every action. `TablesPage` is what turns a pick
     into an address. */
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
    oncopylink: () => void;
  }

  const { rows, picked, shown, total, open, t, ontoggle, onpick, onreset, oncopylink }: Props =
    $props();

  /* Everything picked, in the order the rows are drawn - `fChosen` in app.js.
     A bare number takes its row's name rather than standing for itself; no
     value B2 offers is numeric, but the rule is copied whole rather than left
     to be re-derived when B3 adds `tier`. */
  const chosen = $derived(
    rows.flatMap((row) =>
      row.values
        .filter((v) => picked[row.group]?.includes(v.value))
        .map((v) => ({
          group: row.group,
          value: v.value,
          label: /^\d+$/.test(v.value) ? row.label + ' ' + v.value : v.label
        }))
    )
  );

  const toggleLabel = $derived(
    chosen.length ? `${t.filters} (${String(chosen.length)})` : t.filters
  );
</script>

{#if rows.length}
  <div class="fbar">
    <Button
      variant={chosen.length ? 'toggle' : 'plain'}
      size="sm"
      expanded={open}
      onclick={ontoggle}
    >
      {toggleLabel}<i class="caret" class:up={open}></i>
    </Button>
    {#each chosen as c (c.group + ':' + c.value)}
      <button
        type="button"
        class="fpill"
        title={t.dropValue}
        onclick={() => {
          onpick(c.group, c.value);
        }}>{c.label}<i>&times;</i></button
      >
    {/each}
    {#if chosen.length}
      <button type="button" class="fclear" onclick={onreset}>{t.resetAll}</button>
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
    <span class="fcount"
      >{chosen.length ? `${String(shown)} ${t.outOf} ${String(total)}` : String(total)}</span
    >
  </div>
  {#if open}
    <div class="panel ffilter">
      {#each rows as row (row.group)}
        <div class="field">
          <!-- prettier-ignore -->
          <span class="lbl">{row.label}{#if groupIsAny(picked, row.group)} <i>{t.anyValue}</i>{/if}</span>
          <ChipRow>
            {#each row.values as v (v.value)}
              <Chip
                label={v.label}
                on={!!picked[row.group]?.includes(v.value)}
                onclick={() => {
                  onpick(row.group, v.value);
                }}
              />
            {/each}
          </ChipRow>
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  /* off `.fbar` in style.css. The 16px never actually shows - it collapses
     against `.toolbar`'s 18px margin-bottom above it, and adjacent margins
     take the larger - but it is written down anyway, the way the live app
     writes it, rather than left off because nothing currently depends on it. */
  .fbar {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 16px;
    flex-wrap: wrap;
  }

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

  /* off `.fpill` */
  .fpill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 8px 0 11px;
    border: 1px solid rgb(216 171 94 / 45%);
    border-radius: 8px;
    background: rgb(216 171 94 / 12%);
    color: var(--gold-soft);
    font-size: 12.5px;
    font-weight: 600;
    white-space: nowrap;
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
