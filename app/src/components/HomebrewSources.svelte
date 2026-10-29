<script lang="ts">
  /* The Sources tab of «Мои предметы», `#/homebrew/sources` (m02, m19, m13 in the homebrew
     mocks): «Новый источник» first, the count of named sources, then each named source by
     creation with its count, «Разделы», «Переименовать», «Скачать JSON» and «Удалить», and
     the default source last with its count and «Скачать JSON». A source's name links to its
     items on `#/tables/homebrew` (the `src` filter, its source chip) while it holds an
     item; an empty source's name is text, since its address would open another source's
     chip. A source's sections open under it with «Переименовать» and «Удалить». A rename
     writes the language that names the source or section (`editLang`). Every write goes
     through the store. From the eighth named source a search box filters the sources; past
     20 sections «Разделы» folds; a removal or a closed name field hands the focus on
     (docs/specs/FEATURES.md, "Homebrew", rules 12 and 20). */
  import { tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import Empty from './Empty.svelte';
  import FoldButton from './FoldButton.svelte';
  import Icon from './Icon.svelte';
  import NameField from './NameField.svelte';
  import SearchBox from './SearchBox.svelte';
  import { limitText } from '../lib/cloudLists.js';
  import { ROW_FOLD_AT, foldRows } from '../lib/folds.js';
  import { tablesHash } from '../lib/hash.js';
  import {
    BOOK_NAME_MAX,
    editLang,
    HOME_NAMES,
    nameTaken,
    SECTIONS_MAX,
    type BookRow
  } from '../lib/homebrew.js';
  import { namesMatch } from '../lib/homebrewForm.js';
  import { LIST_SEARCH_AT } from '../lib/lists.js';
  import { countOf, plural } from '../lib/plural.js';
  import { foldQuery } from '../lib/search.js';
  import type { ListWrite, HomebrewSaved } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew, NewIds } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
  }

  const { app, store }: Props = $props();

  const t = $derived(app.t);
  const lang = $derived(app.lang);

  /* Which name field is open: `new`, `book:<id>`, `add:<id>` or `sect:<id>:<key>`. */
  let editing = $state<string | null>(null);
  /* The ids a create sends on every press until an `ok`. */
  let ids = $state<NewIds | null>(null);
  const open = new SvelteSet<string>();
  /* The sources whose sections' fold is open: page memory. */
  const sectOpen = new SvelteSet<string>();
  let newSource = $state<HTMLButtonElement | undefined>(undefined);
  let findQ = $state('');

  const named = (v: { en?: string; ru?: string }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  const books = $derived(
    [...store.books].sort((a, b) => a.created_at.localeCompare(b.created_at))
  );
  const held = (b: BookRow) => store.items.filter((i) => i.book_id === b.id);
  const defaultCount = $derived(
    store.items.filter((i) => i.book_id === null || !store.book(i.book_id)).length
  );
  const itemsN = (n: number): string => plural(n, t.hbItemsN, lang);
  const filtering = $derived(books.length >= LIST_SEARCH_AT);
  const q = $derived(filtering ? foldQuery(findQ.trim()) : '');
  /* A source whose name field is open stays drawn while the query hides it. */
  const fieldOpen = (book: BookRow): boolean =>
    editing === 'book:' + book.id ||
    editing === 'add:' + book.id ||
    !!editing?.startsWith('sect:' + book.id + ':');
  const shownBooks = $derived(
    q ? books.filter((b) => fieldOpen(b) || namesMatch(b.content, q)) : books
  );
  const homeShown = $derived(!q || HOME_NAMES.some((n) => namesMatch(n, q)));

  function start(which: string, withIds = false): void {
    editing = which;
    ids = withIds ? store.newIds() : null;
  }

  /* Rule 20: the first of the given controls still in the page, else `#main`. */
  function focusOr(...els: (HTMLElement | null | undefined)[]): void {
    const next = els.find((e) => e?.isConnected) ?? document.getElementById('main');
    next?.focus();
  }

  /* A name field closes, sent or cancelled: the focus goes back to the button that opened
     it. */
  function close(): void {
    const was = editing;
    editing = null;
    ids = null;
    void refocus(was);
  }

  async function refocus(was: string | null): Promise<void> {
    await tick();
    const [kind, id, key] = (was ?? '').split(':');
    const byId = (x: string): HTMLElement | null => document.getElementById(x);
    const opener =
      kind === 'new'
        ? newSource
        : kind === 'book'
          ? byId('hb-book-' + String(id))?.querySelectorAll<HTMLElement>(
              ':scope > .head .acts .btn'
            )[1]
          : kind === 'sect'
            ? byId('hb-sect-' + String(id) + '-' + String(key))?.querySelector<HTMLElement>(
                '.acts .btn'
              )
            : kind === 'add'
              ? byId('hb-sections-' + String(id))?.querySelector<HTMLElement>(
                  ':scope > li:last-child .btn'
                )
              : null;
    focusOr(opener);
  }

  function writeError(r: ListWrite | HomebrewSaved, failed: string): string {
    if (r.ok) return '';
    if (r.error === 'limit') return limitText(r.key, r.value, t);
    if (r.error === 'conflict' || r.error === 'gone') return t.hbBookChanged;
    return failed;
  }

  async function createSource(name: string): Promise<string | null> {
    if (!name.trim()) return t.hbErrSourceName;
    if (nameTaken([...store.books.map((b) => b.content), ...HOME_NAMES], name)) {
      return t.hbSourceTaken.replace('%s', name.trim());
    }
    if (!ids) return t.hbCreateFailed;
    const r = await store.createBook(ids, name, lang);
    if (!r.ok) return writeError(r, t.hbCreateFailed);
    const made = name.trim();
    app.say((t) => t.hbSourceCreated.replace('%s', made));
    close();
    return null;
  }

  async function renameSource(book: BookRow, name: string): Promise<string | null> {
    if (!name.trim()) return t.hbErrSourceName;
    const others = store.books.filter((b) => b.id !== book.id).map((b) => b.content);
    if (nameTaken([...others, ...HOME_NAMES], name))
      return t.hbSourceTaken.replace('%s', name.trim());
    const r = await store.renameBook(book, name, editLang(book.content, lang));
    if (!r.ok) return writeError(r, t.hbWriteFailed);
    close();
    return null;
  }

  async function addSection(book: BookRow, name: string): Promise<string | null> {
    const sections = book.content.sections ?? [];
    if (!name.trim()) return t.hbErrSectionName;
    if (nameTaken(sections, name)) return t.hbSectionTaken.replace('%s', name.trim());
    if (sections.length >= SECTIONS_MAX) {
      return t.hbSectionsFull.replace('%n', String(SECTIONS_MAX));
    }
    if (!ids) return t.hbWriteFailed;
    const r = await store.addSection(book, ids.key, name, lang);
    if (!r.ok) return writeError(r, t.hbWriteFailed);
    const made = name.trim();
    app.say((t) => t.hbSectionCreated.replace('%s', made));
    close();
    return null;
  }

  async function renameSection(
    book: BookRow,
    key: string,
    name: string
  ): Promise<string | null> {
    const others = (book.content.sections ?? []).filter((s) => s.key !== key);
    if (!name.trim()) return t.hbErrSectionName;
    if (nameTaken(others, name)) return t.hbSectionTaken.replace('%s', name.trim());
    const section = (book.content.sections ?? []).find((s) => s.key === key) ?? null;
    const r = await store.renameSection(book, key, name, editLang(section, lang));
    if (!r.ok) return writeError(r, t.hbWriteFailed);
    close();
    return null;
  }

  /* The question, the consequence when items stay, and the no-undo clause. */
  const asked = (ask: string, stay: string): string =>
    [ask, stay, t.deleteNoUndo].filter(Boolean).join(' ');

  /* The index of a row's «Удалить» among the drawn ones: a row with its rename field
     open draws none. */
  const drawnAt = (dels: HTMLElement[], rowId: string): number =>
    dels.findIndex((b) => b.closest('li')?.id === rowId);

  async function removeSource(book: BookRow): Promise<void> {
    const n = held(book).length;
    const name = named(book.content);
    const stay = n ? plural(n, t.hbSourceStayN, lang) : '';
    if (!app.env.dialog.confirm(asked(t.hbDeleteSource.replace('%s', name), stay))) return;
    const dels = (): HTMLElement[] => [
      ...document.querySelectorAll<HTMLElement>('ul.books > li.book > .head .btn.danger')
    ];
    const at = drawnAt(dels(), 'hb-book-' + book.id);
    const r = await store.removeBook(book.id);
    if (!r.ok) {
      app.say((t) => t.hbDeleteFailed, { error: true });
      return;
    }
    app.say((t) => t.hbSourceDeleted.replace('%s', name));
    await tick();
    const after = dels();
    focusOr(after[at], after[at - 1], newSource);
  }

  async function removeSection(book: BookRow, key: string, name: string): Promise<void> {
    const n = held(book).filter((i) => i.content.section === key).length;
    const stay = n ? plural(n, t.hbSectionStayN, lang) : '';
    if (!app.env.dialog.confirm(asked(t.hbDeleteSection.replace('%s', name), stay))) return;
    const list = (): HTMLElement | null => document.getElementById('hb-sections-' + book.id);
    const dels = (): HTMLElement[] => [
      ...(list()?.querySelectorAll<HTMLElement>(':scope > li > .head .btn.danger') ?? [])
    ];
    const at = drawnAt(dels(), 'hb-sect-' + book.id + '-' + key);
    const r = await store.removeSection(book, key);
    if (!r.ok) {
      const changed = r.error === 'conflict' || r.error === 'gone';
      app.say((t) => (changed ? t.hbBookChanged : t.hbDeleteFailed), { error: true });
      return;
    }
    app.say((t) => t.hbSectionDeleted.replace('%s', name));
    await tick();
    const after = dels();
    focusOr(
      after[at],
      after[at - 1],
      list()?.querySelector<HTMLElement>(':scope > li:last-child .btn')
    );
  }

  function toggle(id: string): void {
    if (open.has(id)) open.delete(id);
    else open.add(id);
  }
</script>

<div class="hbtab">
  <div class="add">
    {#if editing === 'new'}
      <NameField
        id="hb-new-source"
        label={t.hbNewSource}
        submit={t.create}
        cancel={t.cancel}
        onsubmit={createSource}
        oncancel={close}
        maxlength={BOOK_NAME_MAX}
      />
    {:else}
      <Button
        variant="primary"
        bind:el={newSource}
        onclick={() => {
          start('new', true);
        }}><Icon name="plus" />{t.hbNewSource}</Button
      >
    {/if}
  </div>
  {#if filtering}
    <div class="find">
      <SearchBox
        value={findQ}
        placeholder={t.hbFindSources}
        oninput={(v: string) => {
          findQ = v;
        }}
      />
    </div>
  {/if}
  {#if store.bookLimit !== null || books.length}
    <p class="note">{countOf(books.length, store.bookLimit, t.hbSourcesN, lang, t.ofLimit)}</p>
  {/if}
  {#if q && !shownBooks.length && !homeShown}
    <Empty>{t.nothing}</Empty>
  {:else}
    <ul class="books">
      {#each shownBooks as book (book.id)}
        {@const sections = book.content.sections ?? []}
        {@const mine = held(book)}
        <li class="book" id={'hb-book-' + book.id}>
          {#if editing === 'book:' + book.id}
            <NameField
              id={'hb-rename-' + book.id}
              label={t.hbRename}
              value={named(book.content)}
              submit={t.save}
              cancel={t.cancel}
              onsubmit={(name: string) => renameSource(book, name)}
              oncancel={close}
              maxlength={BOOK_NAME_MAX}
            />
          {:else}
            <div class="head">
              {#if mine.length}
                <a
                  class="name"
                  href={app.href(tablesHash('homebrew', { filter: { src: [book.key] } }))}
                  >{named(book.content)}</a
                >
              {:else}
                <span class="name">{named(book.content)}</span>
              {/if}
              <span class="count"
                >{itemsN(mine.length)}{#if sections.length}{' · ' +
                    countOf(
                      sections.length,
                      SECTIONS_MAX,
                      t.hbSectionsN,
                      lang,
                      t.ofLimit
                    )}{/if}</span
              >
              <span class="acts">
                <Button
                  size="sm"
                  caret
                  expanded={open.has(book.id)}
                  onclick={() => {
                    toggle(book.id);
                  }}>{t.hbSectionsBtn}</Button
                >
                <Button
                  size="sm"
                  onclick={() => {
                    start('book:' + book.id);
                  }}>{t.hbRename}</Button
                >
                <Button
                  size="sm"
                  onclick={() =>
                    void app.exportHomebrew({ book: book.id }, named(book.content))}
                  >{t.exportJson}</Button
                >
                <Button size="sm" variant="danger" onclick={() => void removeSource(book)}
                  >{t.del}</Button
                >
              </span>
            </div>
          {/if}
          {#if open.has(book.id)}
            {@const sectFold = foldRows(
              sections,
              sectOpen.has(book.id),
              ROW_FOLD_AT,
              ROW_FOLD_AT,
              (s) => editing === 'sect:' + book.id + ':' + s.key
            )}
            <ul class="sections" id={'hb-sections-' + book.id}>
              {#each sectFold.rows as s (s.key)}
                {@const label = named(s)}
                <li id={'hb-sect-' + book.id + '-' + s.key}>
                  {#if editing === 'sect:' + book.id + ':' + s.key}
                    <NameField
                      id={'hb-rename-' + s.key}
                      label={t.hbRename}
                      value={label}
                      submit={t.save}
                      cancel={t.cancel}
                      onsubmit={(name: string) => renameSection(book, s.key, name)}
                      oncancel={close}
                      maxlength={BOOK_NAME_MAX}
                    />
                  {:else}
                    <div class="head">
                      <span class="name">{label}</span>
                      <span class="count"
                        >{itemsN(mine.filter((i) => i.content.section === s.key).length)}</span
                      >
                      <span class="acts">
                        <Button
                          size="sm"
                          onclick={() => {
                            start('sect:' + book.id + ':' + s.key);
                          }}>{t.hbRename}</Button
                        >
                        <Button
                          size="sm"
                          variant="danger"
                          onclick={() => void removeSection(book, s.key, label)}>{t.del}</Button
                        >
                      </span>
                    </div>
                  {/if}
                </li>
              {/each}
              {#if sections.length > ROW_FOLD_AT}
                <li>
                  <FoldButton
                    open={sectOpen.has(book.id)}
                    more={t.andMore.replace('%n', String(sectFold.more))}
                    {t}
                    ontoggle={() => {
                      if (sectOpen.has(book.id)) sectOpen.delete(book.id);
                      else sectOpen.add(book.id);
                    }}
                  />
                </li>
              {/if}
              <li>
                <div class="head">
                  <span class="name">{t.hbNoSection}</span>
                  <span class="count"
                    >{itemsN(
                      mine.filter(
                        (i) =>
                          i.content.section === undefined ||
                          !sections.some((s) => s.key === i.content.section)
                      ).length
                    )}</span
                  >
                </div>
              </li>
              <li>
                {#if editing === 'add:' + book.id}
                  <NameField
                    id={'hb-section-' + book.id}
                    label={t.hbNewSection}
                    submit={t.create}
                    cancel={t.cancel}
                    onsubmit={(name: string) => addSection(book, name)}
                    oncancel={close}
                    maxlength={BOOK_NAME_MAX}
                  />
                {:else}
                  <Button
                    size="sm"
                    onclick={() => {
                      start('add:' + book.id, true);
                    }}><Icon name="plus" />{t.hbNewSection}</Button
                  >
                {/if}
              </li>
            </ul>
          {/if}
        </li>
      {/each}
      {#if homeShown}
        <li class="book">
          <div class="head">
            {#if defaultCount}
              <a
                class="name"
                href={app.href(tablesHash('homebrew', { filter: { src: ['hb'] } }))}
                >{t.srcHomebrew}</a
              >
            {:else}
              <span class="name">{t.srcHomebrew}</span>
            {/if}
            <span class="count">{itemsN(defaultCount)}</span>
            <span class="acts">
              <Button
                size="sm"
                onclick={() => void app.exportHomebrew({ book: null }, t.srcHomebrew)}
                >{t.exportJson}</Button
              >
            </span>
          </div>
        </li>
      {/if}
    </ul>
  {/if}
</div>

<style>
  .books,
  .sections {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--gap-sm);
  }

  .book {
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }

  .book:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .find {
    margin: 18px 0 0;
  }

  .find + .note {
    margin-top: 12px;
  }

  .note {
    margin: 18px 0 10px;
    font-size: var(--t-small);
    color: var(--muted);
  }

  .sections {
    margin: 8px 0 0 16px;
    padding-left: 12px;
    border-left: 1px solid var(--line);
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
  }

  a.name {
    color: var(--txt);
  }

  .count {
    min-width: 0;
    font-size: var(--t-data);
    color: var(--muted2);
    overflow-wrap: anywhere;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
    margin-left: auto;
  }

  .add + .books {
    margin-top: 18px;
  }
</style>
