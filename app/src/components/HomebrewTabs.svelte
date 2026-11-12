<script lang="ts">
  /* The four tabs of «Мои предметы» (docs/specs/FEATURES.md, "Homebrew"): from 761 px the
     page head's pills with their counts; up to 760 px a picker whose sheet holds the links
     and the limit counter. The picker is `PickerButton`, the same face as the tables'. */
  import { tick } from 'svelte';
  import Chip from './Chip.svelte';
  import PickerButton from './PickerButton.svelte';
  import Sheet from './Sheet.svelte';
  import SheetLinks from './SheetLinks.svelte';
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

<nav class="hbtabs" class:narrow={app.band === 'narrow'} aria-label={t.myItems}>
  {#if app.band === 'narrow'}
    <PickerButton
      bind:el={picker}
      label={pickLabel}
      name={current}
      onclick={() => {
        picking = true;
      }}
    />
    {#if picking}
      <Sheet {app} label={pickLabel} title={t.myItems} onclose={() => void close()}>
        <SheetLinks
          links={TABS.map((x) => ({
            href: app.href(homebrewTabHash(x)),
            label: labels[x],
            count: counts[x],
            current: x === tab
          }))}
          onpick={() => void close()}
        />
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

  .limit {
    margin: 8px 0 0;
    font-size: var(--t-data);
    color: var(--muted2);
  }
</style>
