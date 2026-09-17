<script lang="ts">
  /* Search, `#/search` - reproduced from `renderSearch` (app.js 2841-2859).
     Both languages at once, over loot and gear together: the head, one panel
     holding the box (focused on arrival) and the three kind chips, then the
     hint, up to 300 rows, or "nothing found". */
  import { untrack } from 'svelte';
  import Empty from './Empty.svelte';
  import Field from './Field.svelte';
  import ChipRow from './ChipRow.svelte';
  import Chip from './Chip.svelte';
  import NoData from './NoData.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import RecordModal from './RecordModal.svelte';
  import SearchBox from './SearchBox.svelte';
  import TableRows from './TableRows.svelte';
  import { kindOf } from '../lib/data.js';
  import { foldQuery, hayFor, matches, statLineFor } from '../lib/search.js';
  import { isLastOn } from '../lib/std.js';
  import { KINDS } from '../lib/types.js';
  import type { Dict } from '../lib/dict.js';
  import type { Kind, Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);

  /* Page memory only, the same as `TablesPage`'s own `q` - `docs/specs/
     STATE.md` is explicit that what was asked on a page is not remembered,
     and search follows the live `S.search.q`'s own rule. */
  let q = $state('');
  let open = $state<Record_ | null>(null);
  $effect(() => {
    void app.navigations;
    untrack(() => {
      open = null;
    });
  });

  const query = $derived(foldQuery(q.trim()));
  const statLine = $derived(statLineFor(app.lang, t));
  const hay = $derived(hayFor(statLine));
  const found = $derived.by(() =>
    !index || !query
      ? []
      : index.searchable
          .filter((it) => app.kinds[kindOf(it)] && matches(it, query, statLine, hay))
          .slice(0, 300)
  );

  const KIND_LABEL: Record<Kind, keyof Dict> = {
    item: 'fItems',
    consumable: 'fCons',
    equip: 'fEquip'
  };

  /** "Select all" ticks whatever is on screen and unticks it if it already
   *  was - `TablesPage.svelte`'s own copy; a third use is where this moves
   *  to `AppState` (recorded in the handoff's Deferred). */
  function toggleAllIn(ids: readonly string[]): void {
    const on = ids.some((id) => !app.sel.has(id));
    for (const id of ids) {
      if (on) app.sel.add(id);
      else app.sel.delete(id);
    }
  }
</script>

<PageHead {app} title={t.search} sub={t.subSearch} help={null} />

{#if !index}
  <NoData>{t.noData}</NoData>
{:else}
  <Panel style="margin-bottom:16px">
    <Field>
      <SearchBox
        value={q}
        placeholder={t.searchPh}
        focus
        oninput={(v: string) => {
          q = v;
        }}
      />
    </Field>
    <Field label={t.filter}>
      <ChipRow>
        {#each KINDS as kind (kind)}
          <Chip
            label={t[KIND_LABEL[kind]]}
            on={app.kinds[kind]}
            title={isLastOn(app.kinds, KINDS, kind) ? t.keepOneKind : undefined}
            onclick={() => {
              app.toggleKind(kind, KINDS);
            }}
          />
        {/each}
      </ChipRow>
    </Field>
  </Panel>

  {#if !query}
    <Empty>{t.startTyping}</Empty>
  {:else if !found.length}
    <Empty>{t.nothing}</Empty>
  {:else}
    <TableRows
      entries={found.map((it) => ({ it }))}
      view="list"
      {index}
      lang={app.lang}
      selected={(id: string) => app.sel.has(id)}
      artBroken={(id: string) => app.artBroken(id)}
      ontoggle={(id: string) => {
        app.toggleSel(id);
      }}
      onartfail={(id: string) => {
        app.markArtBroken(id);
      }}
      onopen={(it: Record_) => {
        open = it;
      }}
      ontoggleall={toggleAllIn}
    />
  {/if}
{/if}

{#if open && index}
  <RecordModal
    {app}
    {index}
    it={open}
    onclose={() => {
      open = null;
    }}
    onopen={(r: Record_) => {
      open = r;
    }}
  />
{/if}

<!-- `.miss` moved to `NoData.svelte`, `.panel` to `Panel.svelte` (B10) - the
     16px margin-bottom is the live inline attribute, passed as `style`. No
     rule of this component's own remains. -->
