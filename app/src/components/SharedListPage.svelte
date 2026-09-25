<script lang="ts">
  /* A list somebody shared, read-only: `#/l/<payload>` for a payload that is
     nobody's own list (off `renderSharedList`, app.js 3130-3170; mounted by
     `ListPage.svelte`'s `{:else if route.kind === 'sharedList' && !own}`
     branch), or `#/s/<token>`, an account list's share link, read through
     `app.sharedView` (mounted by `App.svelte`). Both are mounted only once
     `app.index` is confirmed non-null. docs/specs/FEATURES.md, "Lists" and
     "Account lists". */
  import { onDestroy, untrack } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import HitNote from './HitNote.svelte';
  import Icon from './Icon.svelte';
  import PageTitle from './PageTitle.svelte';
  import PickQty from './PickQty.svelte';
  import RecordHost from './RecordHost.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import TableRows from './TableRows.svelte';
  import { agoText } from '../lib/ago.js';
  import { sharedListOf } from '../lib/cloudLists.js';
  import type { Index } from '../lib/data.js';
  import { sectionHash, storedListHash } from '../lib/hash.js';
  import { nameOf } from '../lib/i18n.js';
  import { plural } from '../lib/plural.js';
  import { decodeList, type ListEntryMeta } from '../lib/listLink.js';
  import { copyInit, takenQty } from '../lib/lists.js';
  import { moneyMode, priceText } from '../lib/money.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  /* Exactly one of `payload` and `token`. */
  interface Props {
    app: AppState;
    index: Index;
    payload?: string;
    token?: string;
  }

  const { app, index, payload, token }: Props = $props();

  const t = $derived(app.t);

  const knows = (id: string): boolean => index.byId.has(id);
  const view = $derived(token === undefined ? null : app.sharedView);
  /* Keyed on the token and the session only: `open` reads and writes the
     view's own state, which must not re-run this. */
  $effect(() => {
    if (token === undefined) return;
    const user = app.user;
    const v = view;
    untrack(() => {
      void v?.open(token, user === undefined ? undefined : (user?.userId ?? null));
    });
  });
  onDestroy(() => {
    view?.close();
  });
  const shared = $derived(
    token === undefined
      ? decodeList(payload ?? '', knows)
      : view?.status === 'ready' && view.shared
        ? sharedListOf(view.shared, knows)
        : null
  );
  /* The key the dropped-entries toast is told once for. */
  const shownFor = $derived(token ?? payload ?? '');

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
  const sub = $derived(`${t.sharedList} · ${plural(items.length, t.itemsN, app.lang)}`);

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

  /* Signed out, «Сохранить себе» opens the sign-in prompt under it; the
     sign-in comes back here and saves into the account by itself. */
  let prompting = $state(false);

  function saveShared(): void {
    const s = shared;
    if (!s) return;
    const target = app.newListTarget;
    if (target === 'cloud') {
      if (token === undefined) app.saveCopyOf(s);
      else void app.saveShareCopy(token);
      return;
    }
    if (target === 'prompt') {
      prompting = !prompting;
      return;
    }
    if (target === 'wait') return;
    const l = app.lists.create(s.name, copyInit(s));
    /* `ListStore.save()` has already toasted `saveFailed` on a refusal. */
    if (app.lists.saved) app.say(t.listCreated.replace('%s', l.name));
    app.openNewList(l);
  }

  /* Toasted once per distinct payload, not once per component instance -
     this page is never remounted between two plain shared-list addresses,
     so a component-lifetime flag would miss every payload after the first. */
  let toldFor = $state('');
  $effect(() => {
    const s = shared;
    if (s && s.dropped > 0 && toldFor !== shownFor) {
      toldFor = shownFor;
      app.say(plural(s.dropped, t.droppedItems, app.lang));
    }
  });
</script>

<RecordHost {app} {index}>
  {#snippet children(openRecord)}
    {#if token !== undefined && (!view || view.status === 'gone')}
      <PageTitle title={t.shareGone} sub={t.shareGoneSub} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>
    {:else if token !== undefined && view?.status === 'error'}
      <PageTitle title={t.sharedFailed} sub={t.sharedFailedSub} />
      <Button variant="primary" onclick={() => void view.retry()}>{t.retry}</Button>
    {:else if token !== undefined && !shared}
      <!-- The link is being read: nothing yet, so no "no longer available"
           flashes. -->
    {:else if !shared}
      <PageTitle title={t.notFound} sub={t.badShare} />
      <Button variant="primary" href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>
    {:else}
      {#if view?.mine}
        <p class="ownline">
          {t.ownList} <a href={storedListHash(view.mine)}>{t.ownListEdit}</a>
        </p>
      {/if}
      <PageTitle title={shared.name || t.untitled} {sub} />
      {#if view?.shared}
        <p class="updated">
          {agoText(Date.parse(view.shared.updated_at), app.now, app.lang, t, 'updated')}
        </p>
      {/if}
      <Actions style="margin-bottom:18px">
        <!-- Only the open prompt is announced: an aria-expanded=false on
             every signed-out shared page would name a panel nobody opened. -->
        <Button
          size="sm"
          variant="primary"
          on={prompting}
          expanded={prompting || undefined}
          disabled={app.cloning}
          onclick={saveShared}><Icon name="plus" />{t.saveShared}</Button
        >
      </Actions>
      {#if prompting && app.newListTarget === 'prompt'}
        <SignInPrompt
          {app}
          lead={t.signInToSave}
          after={{ hash: app.hash, action: { do: 'saveList' } }}
          boxed
        />
      {/if}
      {#if token === undefined}
        <p class="legacy">{t.legacyLinks}</p>
      {/if}
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
        {#snippet inside(it: Record_)}
          {@const m = metaOf(it.id)}
          {#if app.sel.has(it.id) && (m.qty ?? 0) > 1}
            {@const taken = takenQty(m, app.picked.get(it.id))}
            <div class="pickrow">
              <PickQty
                value={taken}
                max={m.qty ?? 1}
                label={t.pickQty}
                ofText={t.pickOf.replace('%n', String(m.qty ?? 1))}
                sum={priceText((m.gold ?? 0) * taken, mode, app.lang)}
                name={t.pickQtyOf.replace('%s', nameOf(it, app.lang))}
                onchange={(n: number) => {
                  app.pick(it.id, n);
                }}
              />
            </div>
          {/if}
        {/snippet}
        {#snippet after(it: Record_)}
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

  /* Under the title, as the index card's «изменён N назад». */
  .updated {
    margin: -14px 0 18px;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .legacy {
    margin: 0 0 18px;
    font-size: 12.5px;
    color: var(--muted2);
    max-width: 70ch;
  }

  .ownline {
    margin: 0 0 16px;
    padding: 10px 12px;
    border: 1px solid rgb(var(--gold-rgb) / 45%);
    border-radius: var(--r-sm);
    background: rgb(var(--gold-rgb) / 6%);
    font-size: 13.5px;
  }

  /* The take line inside a ticked row, under the art: the 42px select box
     plus the row's 11px inset (docs/specs/FEATURES.md, "Lists"). No fill -
     the row's own selected wash shows through. */
  .pickrow {
    flex: 0 0 100%;
    display: flex;
    align-items: center;
    border-top: 1px solid rgb(216 171 94 / 22%);
    padding: 8px 11px 8px 53px;
  }

  @media (max-width: 600px) {
    .pickrow {
      padding-left: 49px;
    }
  }
</style>
