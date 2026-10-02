<script lang="ts">
  /* Search, `#/search` - reproduced from `renderSearch` (app.js 2841-2859).
     Both languages at once, over loot and gear together: the head, one panel
     holding the box (focused on arrival) and the three kind chips, then the
     hint, up to 300 rows ranked best first, or "nothing found". A signed-in
     author's own items rank with the catalog's, the catalog's record first
     on a tie, and the «Хоумбрю» chip hides them for the visit. */
  import Empty from './Empty.svelte';
  import Field from './Field.svelte';
  import ChipRow from './ChipRow.svelte';
  import Chip from './Chip.svelte';
  import NoData from './NoData.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import RecordHost from './RecordHost.svelte';
  import SearchBox from './SearchBox.svelte';
  import TableRows from './TableRows.svelte';
  import { kindOf } from '../lib/data.js';
  import { hayFor, parseQuery, rankHits, statLineFor } from '../lib/search.js';
  import { plural } from '../lib/plural.js';
  import { isLastOn } from '../lib/std.js';
  import { KINDS } from '../lib/types.js';
  import type { Dict } from '../lib/dict.js';
  import type { Kind } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  /* The row pool only: `RecordHost` and `TableRows` keep `index`. */
  const browse = $derived(app.browse);
  const own = $derived(app.homebrew?.records.length ?? 0);
  /* The catalog count stays; the own items add a sentence, whatever the chip. */
  const intro = $derived(
    own > 0 ? t.subSearch + ' ' + plural(own, t.subSearchOwn, app.lang) : t.subSearch
  );

  /* Page memory only, the same as `TablesPage`'s own `q` - `docs/specs/
     STATE.md` is explicit that what was asked on a page is not remembered,
     and search follows the live `S.search.q`'s own rule. */
  let q = $state('');

  const terms = $derived(parseQuery(q));
  const statLine = $derived(statLineFor(app.lang, t));
  const hay = $derived(hayFor(statLine));
  /* The unsliced match count, kept so a broad query can say "these are
     the first 300 of N" instead of stopping at 300 with nothing on screen to
     tell that apart from "this is all of them" - the same shown-of-total
     line the table filter strip already prints (`FilterBar.svelte`'s
     `.fcount`, `t.outOf`). */
  const matched = $derived.by(() =>
    !browse || !terms.length
      ? []
      : rankHits(
          browse.searchable.filter((it) => app.kinds[kindOf(it)]),
          terms,
          statLine,
          hay
        )
  );
  const found = $derived(matched.slice(0, 300));

  const KIND_LABEL: Record<Kind, keyof Dict> = {
    item: 'fItems',
    consumable: 'fCons',
    equip: 'fEquip'
  };
</script>

<PageHead {app} title={t.search} sub={intro} help={null} />

<RecordHost {app} {index}>
  {#snippet children(openRecord)}
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
            {#if own > 0}
              <Chip
                label={t.srcHomebrew}
                title={t.hbChipHint}
                on={app.homebrewShown}
                onclick={() => {
                  app.toggleHomebrew();
                }}
              />
            {/if}
          </ChipRow>
        </Field>
      </Panel>

      {#if !terms.length}
        <Empty>{t.startTyping}</Empty>
      {:else if !found.length}
        <Empty>{t.nothing}</Empty>
      {:else}
        {#if matched.length > found.length}
          <p class="scount">{found.length} {t.outOf} {matched.length}</p>
        {/if}
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
          onopen={openRecord}
          ontoggleall={(toggled: string[]) => {
            app.toggleAllIn(toggled);
          }}
        />
      {/if}
    {/if}
  {/snippet}
</RecordHost>

<!-- `.miss` moved to `NoData.svelte`, `.panel` to `Panel.svelte` - the
     16px margin-bottom is the live inline attribute, passed as `style`. -->

<style>
  /* Off `FilterBar.svelte`'s `.fcount`, the shown-of-total line the
     table filter strip already had: same font, same muted colour. */
  .scount {
    margin: 0 0 10px;
    font: 600 12px/1 var(--mono);
    color: var(--muted2);
  }
</style>
