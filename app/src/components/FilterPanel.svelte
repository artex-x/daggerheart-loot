<script lang="ts">
  /* The catalog's filters (docs/specs/FEATURES.md, "Tables and search"): a column beside
     the rows from 1000 px, a bottom sheet below it. Each row starts with «Все», the
     neutral pressed default while the row has no pick; a picked value is gold.

     Owns none of the routing: `TablesPage` turns a pick into an address. It owns the
     fold of a long row (rule 12) and the focus after «Сбросить» (rule 20). The «Фильтры»
     button that opens the sheet is the caller's: it sits in the search row. */
  import { tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import FoldButton from './FoldButton.svelte';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';
  import Switch from './Switch.svelte';
  import type { FacetRow } from '../lib/facets.js';
  import { chosenLabels, groupIsAny, type FilterState } from '../lib/filters.js';
  import { CHIP_FOLD_AT, CHIP_FOLD_SHOWN, foldRows } from '../lib/folds.js';
  import type { Band } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    rows: FacetRow[];
    picked: FilterState;
    /** The rows the filter lets through: «Показать N». */
    shown: number;
    band: Band;
    /** The sheet, below 1000 px. */
    open: boolean;
    onclose: () => void;
    onpick: (group: string, value: string) => void;
    /** «Все» of one row: the row's picks go. */
    onclear: (group: string) => void;
    onreset: () => void;
    /** Absent where the address cannot carry the filter (the own items table): no link. */
    oncopylink?: (() => void) | undefined;
    /** The «Свои предметы» switch, the sheet's first row where it is drawn. */
    own?: { on: boolean; onchange: () => void } | undefined;
  }

  const {
    app,
    rows,
    picked,
    shown,
    band,
    open,
    onclose,
    onpick,
    onclear,
    onreset,
    oncopylink,
    own
  }: Props = $props();

  const t = $derived(app.t);
  const n = $derived(chosenLabels(rows, picked).length);
  const heading = $derived(n ? t.filtersN.replace('%n', String(n)) : t.filters);

  const unfolded = new SvelteSet<string>();
  let column = $state<HTMLElement | undefined>(undefined);

  /* Rule 20: after «Сбросить» the focus lands on the first row's «Все» in the column,
     or on the sheet's «Закрыть». */
  async function reset(): Promise<void> {
    onreset();
    await tick();
    const target =
      band === 'wide'
        ? column?.querySelector<HTMLElement>('.frow .chip')
        : document.querySelector<HTMLElement>('dialog.sheet .sheet-x');
    target?.focus();
  }
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet filterRows()}
  {#if own}
    <div class="frow own">
      <Switch label={t.ownSwitch} on={own.on} onchange={own.onchange} />
    </div>
  {/if}
  {#each rows as row (row.group)}
    {@const fold = foldRows(
      row.values,
      unfolded.has(row.group),
      CHIP_FOLD_AT,
      CHIP_FOLD_SHOWN,
      (v) => !!picked[row.group]?.includes(v.value)
    )}
    <div class="frow" role="group" aria-labelledby={'flbl-' + row.group}>
      <span class="lbl" id={'flbl-' + row.group}>{row.label}</span>
      <ChipRow>
        <Chip
          label={t.allShort}
          neutral
          on={groupIsAny(picked, row.group)}
          onclick={() => {
            onclear(row.group);
          }}
        />
        {#each fold.rows as v (v.value)}
          <Chip
            label={v.label}
            filter={row.group + ':' + v.value}
            on={!!picked[row.group]?.includes(v.value)}
            onclick={() => {
              onpick(row.group, v.value);
            }}
          />
        {/each}
        {#if row.values.length > CHIP_FOLD_AT}
          <FoldButton
            open={unfolded.has(row.group)}
            more={t.andMore.replace('%n', String(fold.more))}
            {t}
            ontoggle={() => {
              if (unfolded.has(row.group)) unfolded.delete(row.group);
              else unfolded.add(row.group);
            }}
          />
        {/if}
      </ChipRow>
    </div>
  {/each}
{/snippet}

{#snippet linkButton()}
  {#if n && oncopylink}
    <Button
      size="sm"
      variant="ghost"
      label={t.filterLink}
      title={t.filterLink}
      onclick={oncopylink}><Icon name="link" /><span>{t.filterLink}</span></Button
    >
  {/if}
{/snippet}

{#if band === 'wide'}
  <aside class="fcol" aria-label={t.filters} bind:this={column}>
    <div class="fhead">
      <h2>{heading}</h2>
      {#if n}
        <Button size="sm" variant="ghost" onclick={() => void reset()}>{t.reset}</Button>
      {/if}
    </div>
    {#if n && oncopylink}
      <div class="flink">{@render linkButton()}</div>
    {/if}
    {@render filterRows()}
  </aside>
{:else if open}
  <Sheet {app} label={t.filters} title={heading} {onclose}>
    {#snippet head()}{@render linkButton()}{/snippet}
    {@render filterRows()}
    {#snippet foot()}
      <Button size="sm" variant="ghost" disabled={!n} onclick={() => void reset()}
        >{t.reset}</Button
      >
      <Button
        size="sm"
        variant="primary"
        onclick={() => {
          document.querySelector<HTMLDialogElement>('dialog.sheet')?.close();
        }}>{t.showN.replace('%n', String(shown))}</Button
      >
    {/snippet}
  </Sheet>
{/if}

<style>
  /* The column: sticky under the header, scrolling inside itself. */
  .fcol {
    position: sticky;
    top: var(--anchor-top);
    width: 250px;
    flex: none;
    align-self: flex-start;
    max-height: calc(100dvh - var(--anchor-top) - 16px);
    overflow: auto;
    overscroll-behavior: contain;
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r);
  }

  .fhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 32px;
    margin-bottom: 10px;
  }

  .fhead h2 {
    margin: 0;
    font-size: var(--t-small);
    font-weight: 650;
  }

  .flink {
    margin-bottom: 10px;
  }

  .frow {
    margin-bottom: 14px;
  }

  .frow:last-child {
    margin-bottom: 0;
  }

  .lbl {
    display: block;
    font-size: var(--t-label);
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 6px;
  }
</style>
