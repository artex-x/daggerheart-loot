<script lang="ts">
  /* The page at `#/l/<payload>` for a payload that is nobody's own list - a
     link somebody else made. Off `renderSharedList` (app.js 3130-3170).
     Mounted by `ListPage.svelte`'s `{:else if route.kind === 'sharedList' &&
     !own}` branch, which only reaches this once `app.index` is confirmed
     non-null. */
  import { onDestroy } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import HitNote from './HitNote.svelte';
  import Icon from './Icon.svelte';
  import PageTitle from './PageTitle.svelte';
  import PickQty from './PickQty.svelte';
  import RecordHost from './RecordHost.svelte';
  import TableRows from './TableRows.svelte';
  import type { Index } from '../lib/data.js';
  import { sectionHash, sharedListHash } from '../lib/hash.js';
  import { itemsWord, nameOf } from '../lib/i18n.js';
  import { decodeList, encodeList, type ListEntryMeta } from '../lib/listLink.js';
  import { copyInit, takenQty } from '../lib/lists.js';
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

  /* The live `S.shared` (app.js 51, 3140-3141): every add-to-list menu on
     this page - the bar's, a card's - reads its meta from it. The same
     two-part shape `ListPage.svelte` uses for `syncListUrl`/`clearOpenList`,
     for the same reason. */
  $effect(() => {
    app.shared = shared;
  });
  onDestroy(() => {
    app.shared = null;
  });

  function saveShared(): void {
    const s = shared;
    if (!s) return;
    const l = app.lists.create(s.name, copyInit(s));
    /* `ListStore.save()` has already toasted `saveFailed` on a refusal. */
    if (app.lists.saved) app.say(t.listCreated.replace('%s', l.name));
    app.go(sharedListHash(encodeList(l, true)));
  }

  /* Toasted once per distinct payload, not once per component instance -
     this page is never remounted between two plain shared-list addresses,
     so a component-lifetime flag would miss every payload after the first. */
  let toldFor = $state('');
  $effect(() => {
    const s = shared;
    if (s && s.dropped > 0 && toldFor !== payload) {
      toldFor = payload;
      app.say(t.droppedItems.replace('%n', String(s.dropped)));
    }
  });
</script>

<RecordHost {app} {index}>
  {#snippet children(openRecord)}
    {#if !shared}
      <PageTitle title={t.notFound} sub={t.badShare} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>
    {:else}
      <PageTitle title={shared.name || t.untitled} {sub} />
      <Actions style="margin-bottom:18px">
        <Button size="sm" variant="primary" onclick={saveShared}
          ><Icon name="plus" />{t.saveShared}</Button
        >
      </Actions>
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
        onopen={openRecord}
        ontoggleall={(ids: string[]) => {
          app.toggleAllIn(ids);
        }}
      >
        {#snippet after(it: Record_)}
          {@const m = metaOf(it.id)}
          {#if app.sel.has(it.id) && (m.qty ?? 0) > 1}
            <div class="pickrow">
              <PickQty
                value={takenQty(m, app.picked.get(it.id))}
                max={m.qty ?? 1}
                label={t.pickQty}
                name={t.pickQtyOf.replace('%s', nameOf(it, app.lang))}
                onchange={(n: number) => {
                  app.pick(it.id, n);
                }}
              />
            </div>
          {/if}
          <HitNote icon="eye" label={t.notePub} text={metaOf(it.id).note} />
          <HitNote icon="eyeOff" label={t.noteHid} text={metaOf(it.id).hnote} />
        {/snippet}
      </TableRows>
    {/if}
  {/snippet}
</RecordHost>

<style>
  /* `.page-h`/`.page-sub` moved to `PageTitle.svelte`, `.card-acts` to
     `Actions.svelte` - `margin-bottom:18px` is the live inline style
     on this specific block, now passed as `style` rather than folded into a
     rule of this component's own. */
  .notes {
    margin-bottom: 18px;
  }

  /* The taken-count strip under a ticked row, right-aligned under the row's
     own tail (docs/specs/FEATURES.md, "Lists"). */
  .pickrow {
    display: flex;
    justify-content: flex-end;
    padding: 0 11px;
  }
</style>
