<script lang="ts">
  /* The Sets tab and the Rules tab of «Мои предметы», `#/homebrew/sets` and
     `#/homebrew/rules` (m21 and m02 in the homebrew mocks): the create button, the search
     from the eighth card of the kind, the count, then the cards by name, each a fold named
     by the card with «Изменить» and «Удалить». Open, a card shows its text, the field
     «Добавить предмет» and its members, the own items that name it, each a link with
     «Убрать». A member change writes that item's `set` or `refs`. One card form is open at a
     time; «Изменить» opens it in place of the row. A delete asks with the count of own items
     that name the card, which keep its key (docs/specs/FEATURES.md, "Homebrew", "Cards"). */
  import { tick, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import CardForm from './CardForm.svelte';
  import Empty from './Empty.svelte';
  import Icon from './Icon.svelte';
  import ItemPicker from './ItemPicker.svelte';
  import SearchBox from './SearchBox.svelte';
  import { limitText } from '../lib/cloudLists.js';
  import { recordHref } from '../lib/hash.js';
  import {
    cardMembers,
    REFS_MAX,
    type CardKind,
    type CardRow,
    type HomebrewContent,
    type HomebrewRecord,
    type ItemRow
  } from '../lib/homebrew.js';
  import { cardMatches, recordMatches, recordOption } from '../lib/homebrewForm.js';
  import { nameOf } from '../lib/i18n.js';
  import { LIST_SEARCH_AT } from '../lib/lists.js';
  import { countOf, plural } from '../lib/plural.js';
  import { foldQuery } from '../lib/search.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    kind: CardKind;
    /** The card the address opens and scrolls to; another key opens nothing. */
    openKey: string | null;
  }

  const { app, store, kind, openKey }: Props = $props();

  const t = $derived(app.t);
  const lang = $derived(app.lang);

  /* The open form: `new`, a card's id, or none. */
  let editing = $state<string | null>(null);
  /* The open folds and the items whose member write is in flight: page memory. */
  const open = new SvelteSet<string>();
  const pending = new SvelteSet<string>();
  let findQ = $state('');

  const named = (v: { en?: string | undefined; ru?: string | undefined }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  const byName = (a: HomebrewRecord, b: HomebrewRecord): number =>
    nameOf(a, lang).localeCompare(nameOf(b, lang), lang);
  const cards = $derived(
    store.cards
      .filter((c) => c.kind === kind)
      .sort((a, b) => named(a.content).localeCompare(named(b.content), lang))
  );
  const filtering = $derived(cards.length >= LIST_SEARCH_AT);
  /* An open card form stays drawn while the query hides its card. */
  const shown = $derived.by(() => {
    const q = filtering ? foldQuery(findQ.trim()) : '';
    return q ? cards.filter((c) => editing === c.id || cardMatches(c.content, q)) : cards;
  });
  const count = $derived(
    plural(cards.length, kind === 'set' ? t.hbSetsN : t.hbRefsN, lang) +
      ' · ' +
      countOf(store.cards.length, store.cardLimit, t.hbCardsN, lang, t.ofLimit)
  );
  const records = $derived(new Map(store.records.map((r) => [r.id, r])));
  const membersOf = (c: CardRow): HomebrewRecord[] =>
    cardMembers(store.items, kind, c.key)
      .flatMap((row) => {
        const r = records.get(row.key);
        return r ? [r] : [];
      })
      .sort(byName);
  const sourceOf = (c: CardRow): string => {
    const b = c.book_id === null ? undefined : store.book(c.book_id);
    return b ? named(b.content) : '';
  };

  /* The address opens its card once; a press on a fold never writes the address. */
  let handled: string | null = null;
  $effect(() => {
    const key = openKey;
    if (store.status !== 'ready' || !key || key === handled) return;
    const c = cards.find((x) => x.key === key);
    if (!c) return;
    handled = key;
    untrack(() => {
      open.add(c.id);
    });
    void tick().then(() => {
      document.getElementById('hb-card-' + c.id)?.scrollIntoView({ block: 'start' });
    });
  });

  function toggle(id: string): void {
    if (open.has(id)) open.delete(id);
    else open.add(id);
  }

  async function remove(c: CardRow): Promise<void> {
    const name = named(c.content);
    const uses = cardMembers(store.items, c.kind, c.key).length;
    const set = c.kind === 'set';
    const ask = uses
      ? (set ? t.hbDeleteSetUsed : t.hbDeleteRefUsed)
          .replace('%s', name)
          .replace('%r', plural(uses, t.hbItemsIn, lang))
      : (set ? t.hbDeleteSet : t.hbDeleteRef).replace('%s', name);
    if (!app.env.dialog.confirm(ask)) return;
    const r = await store.removeCard(c);
    if (r.ok) app.say((t) => (set ? t.hbSetDeleted : t.hbCardDeleted).replace('%s', name));
    else app.say((t) => t.hbDeleteFailed, { error: true });
  }

  /* One item write from the row the store holds at the press; a conflict or a gone row
     reads the account again, and the next press writes from that read. */
  async function write(row: ItemRow, content: HomebrewContent): Promise<void> {
    const r0 = records.get(row.key);
    const name = r0 ? nameOf(r0, lang) : row.key;
    pending.add(row.key);
    try {
      const r = await store.updateItem(row, { content, book_id: row.book_id }, row.revision);
      if (r.ok) {
        app.say((t) => t.hbSaved.replace('%s', name));
      } else if (r.error === 'conflict') {
        await store.read();
        app.say((t) => t.hbItemChanged, { error: true });
      } else if (r.error === 'gone') {
        await store.read();
        app.say((t) => t.hbGone, { error: true });
      } else if (r.error === 'limit') {
        app.say((t) => limitText(r.key, r.value, t), { error: true });
      } else {
        app.say((t) => t.hbWriteFailed, { error: true });
      }
    } finally {
      pending.delete(row.key);
    }
  }

  function add(c: CardRow, key: string): void {
    const row = store.item(key);
    if (!row) return;
    const r0 = records.get(key);
    const name = r0 ? nameOf(r0, lang) : key;
    if (kind === 'set') {
      const was = row.content.set;
      if (was && was !== c.key) {
        const own = store.cards.find((x) => x.kind === 'set' && x.key === was);
        const catalog = app.index?.sets[was];
        const old = own ? named(own.content) : catalog ? named(catalog) : '';
        if (
          old &&
          !app.env.dialog.confirm(
            t.hbMemberMoves.replace('%i', () => name).replace('%s', () => old)
          )
        ) {
          return;
        }
      }
      void write(row, { ...row.content, set: c.key });
      return;
    }
    const refs = row.content.refs ?? [];
    if (refs.length >= REFS_MAX) {
      app.say((t) => t.hbRefsFull.replace('%s', () => name), { error: true });
      return;
    }
    void write(row, { ...row.content, refs: [...refs, c.key] });
  }

  function drop(c: CardRow, key: string): void {
    const row = store.item(key);
    if (!row) return;
    const content: HomebrewContent = { ...row.content };
    if (kind === 'set') {
      delete content.set;
    } else {
      const refs = (row.content.refs ?? []).filter((k) => k !== c.key);
      if (refs.length) content.refs = refs;
      else delete content.refs;
    }
    void write(row, content);
  }

  const close = (): void => {
    editing = null;
  };
</script>

<div class="hbtab">
  <div class="add">
    {#if editing === 'new'}
      <CardForm
        {app}
        {store}
        id={'hb-card-new-' + kind}
        {kind}
        card={null}
        bookId={null}
        withBook
        guard
        onsaved={close}
        oncancel={close}
      />
    {:else}
      <Button
        variant="primary"
        onclick={() => {
          editing = 'new';
        }}><Icon name="plus" />{kind === 'set' ? t.hbNewSet : t.hbNewCard}</Button
      >
    {/if}
  </div>
  {#if filtering}
    <div class="find">
      <SearchBox
        value={findQ}
        placeholder={kind === 'set' ? t.hbFindSets : t.hbFindRules}
        oninput={(v: string) => {
          findQ = v;
        }}
      />
    </div>
  {/if}
  {#if store.cardLimit !== null || store.cards.length}
    <p class="note">{count}</p>
  {/if}
  {#if !cards.length}
    <Empty>{kind === 'set' ? t.hbNoSets : t.hbNoRefs}</Empty>
  {:else if !shown.length}
    <Empty>{t.nothing}</Empty>
  {:else}
    <ul class="cards">
      {#each shown as c (c.id)}
        {@const members = membersOf(c)}
        {@const source = sourceOf(c)}
        {@const isOpen = open.has(c.id)}
        <li id={'hb-card-' + c.id}>
          {#if editing === c.id}
            <CardForm
              {app}
              {store}
              id={'hb-card-' + c.id}
              kind={c.kind}
              card={c}
              bookId={c.book_id}
              withBook
              guard
              hint={members.length > 0
                ? plural(members.length, t.hbCardEditN, lang)
                : undefined}
              onsaved={close}
              oncancel={close}
            />
          {:else}
            <div class="head">
              <span class="name"
                ><Button
                  variant="bare"
                  caret
                  expanded={isOpen}
                  controls={'hb-card-body-' + c.id}
                  onclick={() => {
                    toggle(c.id);
                  }}>{named(c.content)}</Button
                ></span
              >
              <span class="count"
                >{plural(members.length, t.hbItemsN, lang)}{#if source}{' · ' +
                    source}{/if}</span
              >
              <span class="acts">
                <Button
                  size="sm"
                  onclick={() => {
                    editing = c.id;
                  }}>{t.edit}</Button
                >
                <Button size="sm" variant="danger" onclick={() => void remove(c)}
                  >{t.del}</Button
                >
              </span>
            </div>
            {#if isOpen}
              {@const memberKeys = new Set(members.map((m) => m.id))}
              <div class="body" id={'hb-card-body-' + c.id}>
                {#if kind === 'ref' && named({ en: c.content.ensub, ru: c.content.rusub })}
                  <p class="sub">
                    <i>{named({ en: c.content.ensub, ru: c.content.rusub })}</i>
                  </p>
                {/if}
                <p class="text">
                  {#each named( { en: c.content.ende, ru: c.content.rud } ).split('\n') as line, j (j)}{#if j > 0}<br
                      />{/if}{line}{/each}
                </p>
                {#if kind === 'ref' && c.content.url}
                  <a class="url" href={c.content.url} target="_blank" rel="noopener"
                    >{c.content.url}</a
                  >
                {/if}
                <ItemPicker
                  id={'hb-add-' + c.id}
                  label={t.hbAddMember}
                  placeholder={t.hbFindOwn}
                  {t}
                  chosen={[]}
                  max={Number.MAX_SAFE_INTEGER}
                  find={(q: string) =>
                    store.records
                      .filter(
                        (r) =>
                          !memberKeys.has(r.id) && !pending.has(r.id) && recordMatches(r, q)
                      )
                      .sort(byName)
                      .map((r) => recordOption(r, lang, t))}
                  onpick={(key: string) => {
                    add(c, key);
                  }}
                  onremove={() => {}}
                />
                {#if members.length}
                  <ul class="members">
                    {#each members as m (m.id)}
                      {@const name = nameOf(m, lang)}
                      <li>
                        <a href={recordHref(m)}>{name}</a>
                        <Button
                          size="sm"
                          variant="ghost"
                          label={t.hbRemove.replace('%s', () => name)}
                          disabled={pending.has(m.id)}
                          onclick={() => {
                            drop(c, m.id);
                          }}>{t.hbRemoveMember}</Button
                        >
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            {/if}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .add {
    margin-bottom: 18px;
  }

  .find {
    margin-bottom: 12px;
  }

  .note {
    margin: 0 0 10px;
    font-size: 14px;
    color: var(--muted);
  }

  .cards,
  .members {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }

  /* The address key scrolls its card under the sticky top bar: the row anchor's margins
     (`TableRows.svelte`, `[data-row]`). */
  .cards > li {
    padding: 8px 0;
    border-top: 1px solid var(--line);
    scroll-margin-top: 118px;
  }

  .cards > li:first-child {
    border-top: 0;
  }

  @media (max-width: 600px) {
    .cards > li {
      scroll-margin-top: 132px;
    }
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }

  .name {
    font-weight: 600;
    overflow-wrap: anywhere;
    min-width: 0;
  }

  /* The fold button reads as the card's name, on a 24 px target (WCAG 2.5.8). */
  .head .name :global(.btn.bare) {
    min-height: 24px;
    color: var(--txt);
    font-size: inherit;
    font-weight: 600;
    text-align: left;
    overflow-wrap: anywhere;
  }

  .count {
    font-size: 13px;
    color: var(--muted2);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
    margin-left: auto;
  }

  .body {
    display: grid;
    gap: 10px;
    margin: 10px 0 4px 16px;
    padding-left: 12px;
    border-left: 1px solid var(--line);
  }

  .sub,
  .text {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .url {
    font-size: 12.5px;
    color: var(--gold-soft);
    overflow-wrap: anywhere;
  }

  .members {
    gap: 6px;
  }

  .members li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }

  .members a {
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
