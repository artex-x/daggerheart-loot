/* The signed-in author's homebrew items, sources and set and rule cards, held in memory and
 * written through `HomebrewRepository`. The store is the one writer: a component never calls
 * the port. Each record embeds the own cards its item names, as a frozen copy does. A card
 * is created, updated and deleted as an item is; a deleted card's key stays on the items.
 *
 * A write is sent at once and applied on its answer with the revision the port gave. A read
 * keeps the arrays and each row object when it finds the same rows, so `records` and the
 * app's index stay the same objects; a read that overlapped a local write is read again once
 * no write is in flight. A create is safe to send again: the caller keeps one id and key
 * until an `ok`, and a create whose answer was lost reads the account first and updates the
 * row it finds (docs/specs/FEATURES.md, "Homebrew";
 * docs/decisions/2026-09-30-the-homebrew-editor-keeps-its-save-button-with-a-guard.md). */

import {
  recordOf,
  type BookContent,
  type BookRef,
  type BookRow,
  type CardContent,
  type CardKind,
  type CardRef,
  type CardRow,
  type HomebrewContent,
  type HomebrewRecord,
  type ItemRow
} from '../lib/homebrew.js';
import { COALESCE_MS, readHomebrewMessage } from '../lib/live.js';
import type { Lang } from '../lib/types.js';
import type { HomebrewImportRows } from '../lib/homebrewFile.js';
import type {
  HomebrewImport,
  HomebrewMoved,
  HomebrewRepository,
  HomebrewSaved,
  ListWrite
} from '../ports/index.js';

export interface HomebrewHooks {
  /** This page load's tab id: a message with it is this tab's own. */
  tab: () => string;
  /** Re-reads the account's lists: a delete removed their references. */
  refreshLists: () => Promise<void>;
}

/** The id and the key a new row is written with, kept by the caller until an `ok`. */
export interface NewIds {
  id: string;
  key: string;
}

const NETWORK: ListWrite = { ok: false, error: 'network' };

type Row = { id: string; revision: number; updated_at: string; created_at: string };

const byCreated = (a: Row, b: Row): number =>
  a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);

/* The fresh rows, each old object kept where its id, revision and time match; the old array
   itself when nothing changed. */
function kept<R extends Row>(old: readonly R[], fresh: readonly R[]): R[] {
  const had: Record<string, R> = Object.fromEntries(old.map((r) => [r.id, r]));
  const next = [...fresh].sort(byCreated).map((r) => {
    const o = had[r.id];
    return o && o.revision === r.revision && o.updated_at === r.updated_at ? o : r;
  });
  return next.length === old.length && next.every((r, i) => r === old[i]) ? (old as R[]) : next;
}

const named = (s: string): string => s.trim();

/* A written row's time until the next read brings the database's own. */
const nowIso = (): string => new Date().toISOString();

export class Homebrew {
  /** `idle` signed out; `loading` until the first read answers; `error` when it failed. */
  status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  /* Raw: a read or a write replaces the arrays and the row it changes, never mutates. */
  books = $state.raw<BookRow[]>([]);
  items = $state.raw<ItemRow[]>([]);
  cards = $state.raw<CardRow[]>([]);
  /** The account's item, source and card limits; null for none or before a limit read
   *  answered. A failed limit read keeps the number known; a refusal for the same key
   *  replaces it. */
  itemLimit = $state<number | null>(null);
  bookLimit = $state<number | null>(null);
  cardLimit = $state<number | null>(null);

  /** Every own card as a record embeds it. */
  cardRefs: CardRef[] = $derived(
    this.cards.map((c) => ({
      ...c.content,
      key: c.key,
      kind: c.kind
    }))
  );

  /** Every own item as the app draws it, with its source and the own cards it names. */
  records: HomebrewRecord[] = $derived.by(() => {
    const refs: Record<string, BookRef> = Object.fromEntries(
      this.books.map((b) => [b.id, { ...b.content, key: b.key }])
    );
    const cards = this.cardRefs;
    return this.items.map((row) =>
      recordOf(
        row.key,
        row.content,
        row.book_id === null ? null : (refs[row.book_id] ?? null),
        cards
      )
    );
  });

  readonly #repo: HomebrewRepository;
  readonly #hooks: HomebrewHooks;
  /* Bumped by `clear()`: an answer that started before it is dropped. */
  #epoch = 0;
  /* Bumped by every local write; the port calls in flight. A read that overlapped either is
     made again. */
  #edits = 0;
  #inFlight: Promise<unknown>[] = [];
  /* Rows whose create got no answer: it may have landed. */
  #unsure: Record<string, true> = {};
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(repo: HomebrewRepository, hooks: HomebrewHooks) {
    this.#repo = repo;
    this.#hooks = hooks;
  }

  has(key: string): boolean {
    return this.items.some((r) => r.key === key);
  }

  item(key: string): ItemRow | undefined {
    return this.items.find((r) => r.key === key);
  }

  book(id: string): BookRow | undefined {
    return this.books.find((b) => b.id === id);
  }

  /** A fresh id and key for a new source, section or item. */
  newIds(): NewIds {
    return { id: this.#repo.newId(), key: this.#repo.newKey() };
  }

  /** Reads the account's homebrew, with «Загружаем...» first. */
  async load(): Promise<void> {
    this.status = 'loading';
    await this.read();
  }

  /** Reads again; answers true when the read answered. A failed read keeps what is shown;
   *  after a failed first read it reads as `load` does, with no «Загружаем...». */
  async read(): Promise<boolean> {
    const epoch = this.#epoch;
    for (;;) {
      while (this.#inFlight.length) await Promise.allSettled(this.#inFlight);
      if (epoch !== this.#epoch) return false;
      const edits = this.#edits;
      const r = await this.#repo.load();
      if (epoch !== this.#epoch) return false;
      if (edits !== this.#edits || this.#inFlight.length) continue;
      if (!r.ok) {
        if (this.status === 'loading') this.status = 'error';
        return false;
      }
      this.books = kept(this.books, r.books);
      this.items = kept(this.items, r.items);
      this.cards = kept(this.cards, r.cards);
      /* A limit read that failed (undefined) keeps the limit known. */
      if (r.itemLimit !== undefined) this.itemLimit = r.itemLimit;
      if (r.bookLimit !== undefined) this.bookLimit = r.bookLimit;
      if (r.cardLimit !== undefined) this.cardLimit = r.cardLimit;
      this.status = 'ready';
      return true;
    }
  }

  /** The owner topic's message: another tab's or device's homebrew write. */
  message(event: string, payload: unknown): void {
    const m = readHomebrewMessage(event, payload);
    if (!m || m.by === this.#hooks.tab()) return;
    this.#coalesced();
  }

  /** The owner feed joined, or its safety re-read came due. */
  refetch(): void {
    this.#coalesced();
  }

  /** Signed out, or another user: nothing of the account's homebrew stays. */
  clear(): void {
    this.#epoch++;
    this.#unsure = {};
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
    this.books = [];
    this.items = [];
    this.cards = [];
    this.itemLimit = null;
    this.bookLimit = null;
    this.cardLimit = null;
    this.status = 'idle';
  }

  /** Makes a source named `name` in `lang`. */
  async createBook(ids: NewIds, name: string, lang: Lang): Promise<ListWrite> {
    const content: BookContent = { [lang]: named(name) };
    if (this.#unsure[ids.id]) {
      if (!(await this.read())) return NETWORK;
      const held = this.book(ids.id);
      if (held) {
        const r = await this.#updateBook(held, { ...held.content, [lang]: named(name) });
        return this.#settled(ids.id, r);
      }
    }
    const r = await this.#send(() => this.#repo.createBook({ ...ids, content }));
    if (r.ok) {
      const at = nowIso();
      this.books = [
        ...this.books,
        { ...ids, content, revision: 1, created_at: at, updated_at: at }
      ];
    }
    return this.#created(ids.id, r);
  }

  /** Writes the source's name in `lang`, keeping the other language. */
  renameBook(book: BookRow, name: string, lang: Lang): Promise<HomebrewSaved> {
    return this.#updateBook(book, { ...book.content, [lang]: named(name) });
  }

  /** Adds a section named `name` in `lang` at the end of the source's sections. */
  addSection(book: BookRow, key: string, name: string, lang: Lang): Promise<HomebrewSaved> {
    const sections = [...(book.content.sections ?? []), { key, [lang]: named(name) }];
    return this.#updateBook(book, { ...book.content, sections });
  }

  renameSection(book: BookRow, key: string, name: string, lang: Lang): Promise<HomebrewSaved> {
    const sections = (book.content.sections ?? []).map((s) =>
      s.key === key ? { ...s, [lang]: named(name) } : s
    );
    return this.#updateBook(book, { ...book.content, sections });
  }

  /** Drops the section; its items keep their key, which then draws as no section. */
  removeSection(book: BookRow, key: string): Promise<HomebrewSaved> {
    const sections = (book.content.sections ?? []).filter((s) => s.key !== key);
    const content: BookContent = { ...book.content };
    if (sections.length) content.sections = sections;
    else delete content.sections;
    return this.#updateBook(book, content);
  }

  /** Deletes the source; the database moves its items to the default source, so the store
   *  reads again. */
  async removeBook(id: string): Promise<ListWrite> {
    const r = await this.#send(() => this.#repo.removeBook(id));
    if (r.ok) {
      this.books = this.books.filter((b) => b.id !== id);
      await this.read();
    }
    return r;
  }

  /** Makes an item in the source `bookId` (null: the default source). */
  async createItem(
    ids: NewIds,
    bookId: string | null,
    content: HomebrewContent
  ): Promise<ListWrite> {
    if (this.#unsure[ids.id]) {
      if (!(await this.read())) return NETWORK;
      const held = this.items.find((r) => r.id === ids.id);
      if (held) {
        const r = await this.updateItem(held, { content, book_id: bookId }, held.revision);
        return this.#settled(ids.id, r);
      }
    }
    const r = await this.#send(() =>
      this.#repo.createItem({ ...ids, book_id: bookId, content })
    );
    if (r.ok) {
      const at = nowIso();
      this.items = [
        ...this.items,
        { ...ids, book_id: bookId, content, revision: 1, created_at: at, updated_at: at }
      ];
    }
    return this.#created(ids.id, r);
  }

  /** Writes the item over `revision` (null: whatever the row holds). */
  async updateItem(
    row: ItemRow,
    patch: { content: HomebrewContent; book_id: string | null },
    revision: number | null
  ): Promise<HomebrewSaved> {
    const r = await this.#send(() => this.#repo.updateItem(row.id, patch, revision));
    if (r.ok) {
      const at = nowIso();
      this.items = this.items.map((x) =>
        x.id === row.id ? { ...x, ...patch, revision: r.revision, updated_at: at } : x
      );
    }
    return r;
  }

  /** Deletes the item; the database removes its references from the lists. */
  removeItem(row: ItemRow): Promise<ListWrite> {
    return this.removeItems([row]);
  }

  /** Deletes the items one by one and stops at the first failure; the ones deleted leave
   *  the store either way. `onstep` hears the count deleted after each delete. */
  async removeItems(
    rows: readonly ItemRow[],
    onstep?: (done: number) => void
  ): Promise<ListWrite> {
    let answer: ListWrite = { ok: true };
    const gone: string[] = [];
    for (const row of rows) {
      const r = await this.#send(() => this.#repo.removeItem(row.id));
      if (!r.ok) {
        answer = r;
        break;
      }
      gone.push(row.id);
      onstep?.(gone.length);
    }
    if (gone.length) {
      this.items = this.items.filter((x) => !gone.includes(x.id));
      await this.#hooks.refreshLists();
    }
    return answer;
  }

  /** Makes a set or rule card in the source `bookId` (null: the default source). */
  async createCard(
    ids: NewIds,
    kind: CardKind,
    bookId: string | null,
    content: CardContent
  ): Promise<ListWrite> {
    if (this.#unsure[ids.id]) {
      if (!(await this.read())) return NETWORK;
      const held = this.cards.find((r) => r.id === ids.id);
      if (held) {
        const r = await this.updateCard(held, { content, book_id: bookId }, held.revision);
        return this.#settled(ids.id, r);
      }
    }
    const r = await this.#send(() =>
      this.#repo.createCard({ ...ids, kind, book_id: bookId, content })
    );
    if (r.ok) {
      const at = nowIso();
      this.cards = [
        ...this.cards,
        { ...ids, kind, book_id: bookId, content, revision: 1, created_at: at, updated_at: at }
      ];
    }
    return this.#created(ids.id, r);
  }

  /** Writes the card over `revision` (null: whatever the row holds); a conflict or a gone
   *  row reads the account again. */
  async updateCard(
    row: CardRow,
    patch: { content: CardContent; book_id: string | null },
    revision: number | null
  ): Promise<HomebrewSaved> {
    const r = await this.#send(() => this.#repo.updateCard(row.id, patch, revision));
    if (r.ok) {
      const at = nowIso();
      this.cards = this.cards.map((x) =>
        x.id === row.id ? { ...x, ...patch, revision: r.revision, updated_at: at } : x
      );
    } else if (r.error === 'conflict' || r.error === 'gone') {
      await this.read();
    }
    return r;
  }

  /** Deletes the card; the items keep its key, and the lists' entries do not change. */
  async removeCard(row: CardRow): Promise<ListWrite> {
    const r = await this.#send(() => this.#repo.removeCard(row.id));
    if (r.ok) this.cards = this.cards.filter((x) => x.id !== row.id);
    return r;
  }

  /** Writes a homebrew file's rows in one call, every row or none, then reads the account
   *  again on every answer: the call may have landed though its answer was lost. */
  async import(rows: HomebrewImportRows): Promise<HomebrewImport> {
    const r = await this.#send(() => this.#repo.import(rows));
    await this.read();
    if (!r.ok && r.error === 'limit' && r.value !== null) this.#limited(r.key, r.value);
    return r;
  }

  /** Moves the items to the source `bookId` (null: the default one) and its section
   *  `section` (null: none) in one call, each with the revision it holds, then reads the
   *  account again on every answer: the new revisions come from the read. */
  async moveItems(
    rows: readonly ItemRow[],
    bookId: string | null,
    section: string | null
  ): Promise<HomebrewMoved> {
    const items = rows.map((r) => ({ id: r.id, revision: r.revision }));
    const r = await this.#send(() => this.#repo.moveItems(items, bookId, section));
    await this.read();
    return r;
  }

  /* A book write names the revision read; a conflict or a gone row reads the account again,
     so the next press writes over what is there now. */
  async #updateBook(book: BookRow, content: BookContent): Promise<HomebrewSaved> {
    const r = await this.#send(() => this.#repo.updateBook(book.id, content, book.revision));
    if (r.ok) {
      const at = nowIso();
      this.books = this.books.map((b) =>
        b.id === book.id ? { ...b, content, revision: r.revision, updated_at: at } : b
      );
    } else if (r.error === 'conflict' || r.error === 'gone') {
      await this.read();
    }
    return r;
  }

  async #send<T>(call: () => Promise<T>): Promise<T> {
    this.#edits++;
    const p = call();
    this.#inFlight = [...this.#inFlight, p];
    try {
      return await p;
    } finally {
      this.#inFlight = this.#inFlight.filter((x) => x !== p);
    }
  }

  #created(id: string, r: ListWrite): ListWrite {
    if (!r.ok && r.error === 'network') this.#unsure[id] = true;
    else Reflect.deleteProperty(this.#unsure, id);
    if (!r.ok && r.error === 'limit' && r.value !== null) this.#limited(r.key, r.value);
    return r;
  }

  /* A limit refusal names the limit the database applied: the counts show it from now on. */
  #limited(key: string, value: number): void {
    if (key === 'homebrew_items_per_owner') this.itemLimit = value;
    if (key === 'homebrew_books_per_owner') this.bookLimit = value;
    if (key === 'homebrew_cards_per_owner') this.cardLimit = value;
  }

  /* A create sent again as an update of the row it made: a conflict or a gone row there is
     one more lost race, which the next press reads again. */
  #settled(id: string, r: HomebrewSaved): ListWrite {
    if (r.ok) {
      Reflect.deleteProperty(this.#unsure, id);
      return { ok: true };
    }
    switch (r.error) {
      case 'conflict':
      case 'gone':
        return NETWORK;
      default:
        return r;
    }
  }

  #coalesced(): void {
    this.#timer ??= setTimeout(() => {
      this.#timer = null;
      void this.read();
    }, COALESCE_MS);
  }
}
