<script lang="ts">
  /* The fold «Источники» on `#/homebrew` (m02, m19, m13 in the homebrew mocks), closed
     on each visit with the count of named sources: the default source with its count,
     then each named source with its count, «Разделы», «Переименовать» and «Удалить»,
     and «Добавить» for a new one. A source's sections open under it with the same
     actions. Every write goes through the store (docs/specs/FEATURES.md, "Homebrew"). */
  import { SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import NameField from './NameField.svelte';
  import PanelFold from './PanelFold.svelte';
  import { limitText } from '../lib/cloudLists.js';
  import { nameTaken, SECTIONS_MAX, type BookRow } from '../lib/homebrew.js';
  import { plural } from '../lib/plural.js';
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

  function start(which: string, withIds = false): void {
    editing = which;
    ids = withIds ? store.newIds() : null;
  }

  function close(): void {
    editing = null;
    ids = null;
  }

  function writeError(r: ListWrite | HomebrewSaved, failed: string): string {
    if (r.ok) return '';
    if (r.error === 'limit') return limitText(r.key, r.value, t);
    if (r.error === 'conflict' || r.error === 'gone') return t.hbBookChanged;
    return failed;
  }

  /* The default source's name in both languages: a named source never takes it. */
  const HOME = [{ ru: 'Хоумбрю', en: 'Homebrew' }];

  async function createSource(name: string): Promise<string | null> {
    if (!name.trim()) return t.hbErrSourceName;
    if (nameTaken([...store.books.map((b) => b.content), ...HOME], name)) {
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
    if (nameTaken([...others, ...HOME], name))
      return t.hbSourceTaken.replace('%s', name.trim());
    const r = await store.renameBook(book, name, lang);
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
    const r = await store.renameSection(book, key, name, lang);
    if (!r.ok) return writeError(r, t.hbWriteFailed);
    close();
    return null;
  }

  async function removeSource(book: BookRow): Promise<void> {
    const n = held(book).length;
    const ask = t.hbDeleteSource.replace('%s', named(book.content));
    if (!app.env.dialog.confirm(n ? ask + ' ' + plural(n, t.hbSourceStayN, lang) : ask)) return;
    const r = await store.removeBook(book.id);
    if (!r.ok) app.say((t) => t.hbDeleteFailed, { error: true });
  }

  async function removeSection(book: BookRow, key: string, name: string): Promise<void> {
    const n = held(book).filter((i) => i.content.section === key).length;
    const ask = t.hbDeleteSection.replace('%s', name);
    if (!app.env.dialog.confirm(n ? ask + ' ' + plural(n, t.hbSectionStayN, lang) : ask))
      return;
    const r = await store.removeSection(book, key);
    if (!r.ok) {
      const changed = r.error === 'conflict' || r.error === 'gone';
      app.say((t) => (changed ? t.hbBookChanged : t.hbDeleteFailed), { error: true });
    }
  }

  function toggle(id: string): void {
    if (open.has(id)) open.delete(id);
    else open.add(id);
  }
</script>

<PanelFold
  label={t.hbSources}
  count={books.length ? plural(books.length, t.hbSourcesN, lang) : undefined}
>
  <ul class="books">
    <li class="book">
      <div class="head">
        <span class="name">{t.srcHomebrew}</span>
        <span class="count">{itemsN(defaultCount)}</span>
      </div>
    </li>
    {#each books as book (book.id)}
      {@const sections = book.content.sections ?? []}
      {@const mine = held(book)}
      <li class="book">
        {#if editing === 'book:' + book.id}
          <NameField
            id={'hb-rename-' + book.id}
            label={t.hbRename}
            value={named(book.content)}
            submit={t.save}
            cancel={t.cancel}
            onsubmit={(name: string) => renameSource(book, name)}
            oncancel={close}
          />
        {:else}
          <div class="head">
            <span class="name">{named(book.content)}</span>
            <span class="count"
              >{itemsN(mine.length)}{#if sections.length}{' · ' +
                  plural(sections.length, t.hbSectionsN, lang)}{/if}</span
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
              <Button size="sm" variant="danger" onclick={() => void removeSource(book)}
                >{t.del}</Button
              >
            </span>
          </div>
        {/if}
        {#if open.has(book.id)}
          <ul class="sections">
            {#each sections as s (s.key)}
              {@const label = named(s)}
              <li>
                {#if editing === 'sect:' + book.id + ':' + s.key}
                  <NameField
                    id={'hb-rename-' + s.key}
                    label={t.hbRename}
                    value={label}
                    submit={t.save}
                    cancel={t.cancel}
                    onsubmit={(name: string) => renameSection(book, s.key, name)}
                    oncancel={close}
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
                />
              {:else}
                <Button
                  size="sm"
                  onclick={() => {
                    start('add:' + book.id, true);
                  }}>{t.hbAddSection}</Button
                >
              {/if}
            </li>
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
  <div class="add">
    {#if editing === 'new'}
      <NameField
        id="hb-new-source"
        label={t.hbNewSource}
        submit={t.create}
        cancel={t.cancel}
        onsubmit={createSource}
        oncancel={close}
      />
    {:else}
      <Button
        size="sm"
        onclick={() => {
          start('new', true);
        }}>{t.hbAdd}</Button
      >
    {/if}
  </div>
</PanelFold>

<style>
  .books,
  .sections {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
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

  .add {
    margin-top: 12px;
  }
</style>
