<script lang="ts">
  /* The page at `#/l/<payload>` for a payload that is nobody's own list - a
     link somebody else made. Off `renderSharedList` (app.js 3130-3170).
     Mounted by `ListPage.svelte`'s `{:else if route.kind === 'sharedList' &&
     !own}` branch, which only reaches this once `app.index` is confirmed
     non-null. */
  import { onDestroy } from 'svelte';
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import HitNote from './HitNote.svelte';
  import RecordModal from './RecordModal.svelte';
  import TableRows from './TableRows.svelte';
  import type { Index } from '../lib/data.js';
  import { sectionHash } from '../lib/hash.js';
  import { itemsWord } from '../lib/i18n.js';
  import { decodeList, type ListEntryMeta } from '../lib/listLink.js';
  import { N_SHARED } from '../lib/lists.js';
  import { moneyMode, priceText } from '../lib/money.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    index: Index;
    payload: string;
  }

  const { app, index, payload }: Props = $props();

  const t = $derived(app.t);

  const knows = (id: string): boolean => index.byId.has(id);
  const shared = $derived(decodeList(payload, knows));

  /* `decodeList` has already dropped every id the data does not know, so this
     never filters anything out in practice - the guard is only what keeps
     `byId`'s possible `undefined` out of the array's type. */
  const byId = (id: string): Record_ | undefined => index.byId.get(id);
  const items = $derived(
    shared ? shared.ids.map(byId).filter((it): it is Record_ => it != null) : []
  );
  const mode = $derived(moneyMode(shared));
  const metaOf = (id: string): ListEntryMeta => shared?.meta?.[id] ?? {};

  /* The live `rowHTML(it, '', tail)`'s own `tail`: a bare quantity, a
     quantity with a price, or a bare price - '×' is U+00D7, the separator
     U+00B7, the same bytes the live app prints. */
  function tailOf(id: string): string | undefined {
    const m = metaOf(id);
    const bits: string[] = [];
    if ((m.qty ?? 0) > 1) bits.push('×' + String(m.qty));
    if ((m.gold ?? 0) > 0) bits.push(priceText(m.gold ?? 0, mode, app.lang));
    return bits.length ? bits.join(' · ') : undefined;
  }

  const entries = $derived(
    items.map((it) => {
      const tail = tailOf(it.id);
      return tail === undefined ? { it } : { it, tail };
    })
  );
  const sub = $derived(
    `${t.sharedList} · ${String(items.length)} ${itemsWord(items.length, app.lang)}`
  );

  /* The live `S.shared` (app.js 51, 3140-3141): what every add-to-list menu
     on this page reads its meta from, and what "+ Новый список" takes
     whole. The same two-part shape `ListPage.svelte` uses for
     `syncListUrl`/`clearOpenList`, for the same reason. */
  $effect(() => {
    app.shared = shared;
  });
  onDestroy(() => {
    app.shared = null;
  });

  let open = $state<Record_ | null>(null);
</script>

{#if !shared}
  <h1 class="page-h">{t.notFound}</h1>
  <p class="page-sub">{t.badShare}</p>
  <Button variant="primary" href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>
{:else}
  <h1 class="page-h">{shared.name || t.untitled}</h1>
  <p class="page-sub">{sub}</p>
  <div class="card-acts">
    <AddToList {app} key={N_SHARED} ids={shared.ids} primary />
  </div>
  {#if shared.note || shared.hnote}
    <div class="notes">
      <HitNote icon="eye" label={t.notePub} text={shared.note} />
      <HitNote icon="eyeOff" label={t.noteHid} text={shared.hnote} />
    </div>
  {/if}
  <TableRows
    {entries}
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
    onopen={(r: Record_) => {
      open = r;
    }}
  >
    {#snippet after(it: Record_)}
      <HitNote icon="eye" label={t.notePub} text={metaOf(it.id).note} />
      <HitNote icon="eyeOff" label={t.noteHid} text={metaOf(it.id).hnote} />
    {/snippet}
  </TableRows>
{/if}

{#if open}
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

<style>
  /* off `.page-h` (style.css:105), the tokens `ListPage.svelte` already uses */
  .page-h {
    margin: 0 0 4px;
    font-size: var(--h-page-size);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* off `.page-sub` (style.css:140) */
  .page-sub {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 14px;
    max-width: 70ch;
  }

  /* off `.card-acts` (style.css:405), the live inline style
     ("margin-bottom:18px") folded in */
  .card-acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: auto;
    padding-top: 3px;
    margin-bottom: 18px;
  }

  .notes {
    margin-bottom: 18px;
  }
</style>
