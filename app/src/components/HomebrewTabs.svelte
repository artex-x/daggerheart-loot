<script lang="ts">
  /* The four tabs of «Мои предметы» (docs/specs/FEATURES.md, "Homebrew"): from 761 px the
     page head's pills with their counts; up to 760 px a picker whose sheet holds the links
     and the limit counter. The picker rules are `TableNav.svelte`'s. */
  import { tick } from 'svelte';
  import Chip from './Chip.svelte';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';
  import { homebrewTabHash, type HomebrewTab } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    tab: HomebrewTab;
    counts: Record<HomebrewTab, number>;
    /** The limit counter of the sheet («9 предметов из 100»). */
    limitText: string;
  }

  const { app, tab, counts, limitText }: Props = $props();

  const t = $derived(app.t);
  const TABS: readonly HomebrewTab[] = ['items', 'sources', 'sets', 'rules'];
  const labels = $derived<Record<HomebrewTab, string>>({
    items: t.hbItems,
    sources: t.hbSources,
    sets: t.hbSets,
    rules: t.hbRefs
  });
  const current = $derived(labels[tab]);
  const pickLabel = $derived(t.hbTabPick.replace('%s', current));

  let picking = $state(false);
  let picker = $state<HTMLButtonElement | undefined>(undefined);

  /* Rule 20: a link press unmounts the sheet with no `close` event, so both ways end here. */
  async function close(): Promise<void> {
    picking = false;
    await tick();
    picker?.focus();
  }
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag of a
     local snippet reads as a void expression to this rule. -->
{#snippet links()}
  {#each TABS as x (x)}
    <a
      class="tab"
      href={app.href(homebrewTabHash(x))}
      aria-current={x === tab ? 'page' : undefined}
      onclick={() => void close()}
      ><span>{labels[x]}</span>&#32;<span class="n">{counts[x]}</span></a
    >
  {/each}
{/snippet}

<nav class="hbtabs" class:narrow={app.band === 'narrow'} aria-label={t.myItems}>
  {#if app.band === 'narrow'}
    <button
      type="button"
      class="picker"
      aria-haspopup="dialog"
      aria-label={pickLabel}
      bind:this={picker}
      onclick={() => {
        picking = true;
      }}><span class="picker-t">{current}</span><Icon name="chevron" /></button
    >
    {#if picking}
      <Sheet {app} label={pickLabel} title={t.myItems} onclose={() => void close()}>
        <div class="sheetlinks">{@render links()}</div>
        <p class="limit">{limitText}</p>
      </Sheet>
    {/if}
  {:else}
    <div class="pills">
      {#each TABS as x (x)}
        <Chip
          label={labels[x]}
          count={counts[x]}
          on={x === tab}
          href={app.href(homebrewTabHash(x))}
        />
      {/each}
    </div>
  {/if}
</nav>

<style>
  .hbtabs {
    min-width: 0;
  }

  .narrow {
    flex: 1 1 auto;
  }

  /* The gap of the catalog's group chips. */
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 0 2px;
    color: var(--muted);
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  .tab:hover {
    color: var(--txt);
  }

  .tab[aria-current='page'] {
    color: var(--gold);
  }

  .tab .n {
    font-size: var(--t-data);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--muted2);
  }

  /* Up to 760 px the picker is the page's visible name. */
  .picker {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 100%;
    min-height: 40px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--txt);
    font: var(--h-page-weight) var(--t-body) / 1.2 var(--ui);
    letter-spacing: var(--h-page-spacing);
    text-align: left;
  }

  .picker-t {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    min-width: 0;
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  .sheetlinks {
    display: grid;
    gap: 2px;
  }

  .sheetlinks .tab {
    display: flex;
    justify-content: space-between;
    min-height: 44px;
    font-size: var(--t-control);
    border-bottom: 0;
  }

  .limit {
    margin: 8px 0 0;
    font-size: var(--t-data);
    color: var(--muted2);
  }
</style>
