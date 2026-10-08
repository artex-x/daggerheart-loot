<script lang="ts">
  /* «Импорт предметов из файла JSON» under «Импорт из файла» on «Мои предметы» (m15): a
     `homebrew-v1` or `homebrew-v2` file or the data zip's `homebrew.json`, its preview with the counts, the
     names of the held items, cards and sources and of the new items with a held name,
     one «Куда» row per source of the file, skip or update for the held keys, and the press
     that writes every row or none (`import_homebrew`). Loaded with `lib/homebrewFile.ts` as
     one lazy chunk on the first open. The rows are built once per file and mapping, so a
     retry after a lost answer sends the same ids and keys (docs/specs/FEATURES.md,
     "Homebrew"). */
  import { SvelteMap } from 'svelte/reactivity';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Field from './Field.svelte';
  import ImportFile from './ImportFile.svelte';
  import ImportLines from './ImportLines.svelte';
  import Seg from './Seg.svelte';
  import SourcePicker from './SourcePicker.svelte';
  import TextInput from './TextInput.svelte';
  import { limitText } from '../lib/cloudLists.js';
  import { lineMembers } from '../lib/data.js';
  import { fewNames } from '../lib/i18n.js';
  import {
    BOOK_NAME_MAX,
    CARD_ITEMS_MAX,
    CARD_NAME_MAX,
    CARD_SUB_MAX,
    CARD_TEXT_MAX,
    CARD_URL_MAX,
    CRAFT_MAX,
    DESC_MAX,
    hasName,
    HOME_NAMES,
    NAME_MAX,
    nameTaken,
    REFS_MAX,
    SECTIONS_MAX
  } from '../lib/homebrew.js';
  import {
    defaultTarget,
    ERRORS_MAX,
    FILE_BOOKS_MAX,
    FILE_CARDS_MAX,
    FILE_ITEMS_MAX,
    heldOf,
    newName,
    parseHomebrew,
    planOf,
    rowsOf,
    toHomebrewRows,
    type FileArray,
    type FileContext,
    type FileError,
    type FileName,
    type FileNote,
    type HomebrewFile,
    type NamedPair,
    type PlanRow,
    type Target
  } from '../lib/homebrewFile.js';
  import { plural } from '../lib/plural.js';
  import type { ReportLine as Line } from '../lib/types.js';
  import type { FileRead, FileRefusal } from '../lib/zip.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    onclose: () => void;
    /* True while the import call runs; the page disables the toggle. */
    sending?: boolean;
  }

  let { app, store, onclose, sending = $bindable(false) }: Props = $props();

  type Refusal =
    | 'importTooBig'
    | 'importZipTooBig'
    | 'accountFailed'
    | 'importNotJson'
    | 'importNotZip'
    | 'hbImportZipNone'
    | 'hbImportZipMany'
    | 'hbImportZipPacked'
    | 'hbImportNotFile'
    | 'hbImportVersion'
    | 'hbImportNoVersion'
    | 'hbImportEmpty';

  type View =
    | { kind: 'empty' }
    /* A refusal keeps its key, so the line follows a language switch. */
    | { kind: 'refused'; key: Refusal; version?: string }
    | {
        kind: 'errors';
        errors: FileError[];
        more: number;
        names: Record<FileArray, FileName[]>;
        doc: unknown;
      }
    | {
        kind: 'preview';
        file: HomebrewFile;
        notes: FileNote[];
        rows: PlanRow[];
        sibling: boolean;
        other: string[];
        otherMore: number;
      };

  const t = $derived(app.t);
  const lang = $derived(app.lang);
  /* Raw: the file's objects go to the port as they are, never as proxies. */
  let view = $state.raw<View>({ kind: 'empty' });
  /* One target per row as chosen; a custom name per row while «+ Новый источник...» is
     chosen. */
  let picked = $state<Target[]>([]);
  let custom = $state<string[]>([]);
  let customErr = $state<(string | null)[]>([]);
  let update = $state(false);
  let allRows = $state(false);
  /* The name lines past `NAMES_SHOWN` that are open: `items`, `cards`, `books`, `same`. */
  let namesOpen = $state<string[]>([]);
  /* The ids and keys of this file's rows, made once: a retry sends the same. */
  let ids = new SvelteMap<string, string>();

  const ROWS_SHOWN = 20;
  const NAMES_SHOWN = 10;
  const REFUSALS: Record<FileRefusal, Refusal> = {
    tooBig: 'importTooBig',
    zipTooBig: 'importZipTooBig',
    failed: 'accountFailed',
    notJson: 'importNotJson',
    notZip: 'importNotZip',
    missing: 'hbImportZipNone',
    many: 'hbImportZipMany',
    packed: 'hbImportZipPacked'
  };

  const named = (v: { en?: string; ru?: string }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  /* One pass, so a value that holds `%s` is not filled in again. */
  const fill = (template: string, by: Record<string, string | number | undefined>): string =>
    template.replace(/%([fnsv])/g, (m, k: string) => {
      const v = by[k];
      return v === undefined ? m : String(v);
    });
  const cut40 = (s: string): string => {
    const cps = Array.from(s);
    return cps.length > 40 ? cps.slice(0, 40).join('') + '...' : s;
  };

  /* The catalog and the account, as the parse reads them. */
  const context = (): FileContext => ({
    catalogHas: (id) => app.catalog?.byId.has(id) ?? false,
    catalogSet: (key) => (app.catalog ? key in app.catalog.sets : false),
    catalogRef: (key) => (app.catalog ? key in app.catalog.refs : false),
    ownItem: (key) => store.has(key),
    ownCard: (key) => store.cards.find((c) => c.key === key)?.kind ?? null,
    lineMembers: (line) => {
      const members = app.index
        ? lineMembers(app.index, line).flatMap((r) => (r.eq ? [{ key: r.id, t: r.eq.t }] : []))
        : [];
      const head = store.item(line);
      return head?.content.eq && !members.some((m) => m.key === line)
        ? [...members, { key: line, t: head.content.eq.t }]
        : members;
    }
  });

  function refuse(key: Refusal, version?: string): void {
    view = version === undefined ? { kind: 'refused', key } : { kind: 'refused', key, version };
  }

  function onread(r: FileRead): void {
    if (!r.ok) {
      refuse(REFUSALS[r.reason]);
      return;
    }
    const p = parseHomebrew(r.text, context());
    if (p.ok) {
      const rows = rowsOf(p.file);
      ids = new SvelteMap();
      picked = rows.map((row) => defaultTarget(row, store));
      custom = rows.map(() => '');
      customErr = rows.map(() => null);
      update = false;
      allRows = false;
      namesOpen = [];
      view = {
        kind: 'preview',
        file: p.file,
        notes: p.notes,
        rows,
        sibling: r.sibling,
        other: r.other,
        otherMore: r.more
      };
    } else if (p.reason === 'errors') {
      let doc: unknown = null;
      try {
        doc = JSON.parse(r.text);
      } catch {
        /* The parse refused no JSON before the walk: unreachable, the value stays null. */
      }
      view = { kind: 'errors', errors: p.errors, more: p.more, names: p.names, doc };
    } else if (p.reason === 'version') {
      if (p.version === undefined) refuse('hbImportNoVersion');
      else refuse('hbImportVersion', JSON.stringify(p.version));
    } else {
      refuse(
        p.reason === 'notJson'
          ? 'importNotJson'
          : p.reason === 'empty'
            ? 'hbImportEmpty'
            : 'hbImportNotFile'
      );
    }
  }

  /* ---------- the error report ---------- */

  const POS = { books: 'hbImportPosBook', cards: 'hbImportPosCard', items: 'hbImportPosItem' };
  const MANY = {
    books: 'hbImportManyBooks',
    cards: 'hbImportManyCards',
    items: 'hbImportManyItems'
  };
  const FILE_MAX = { books: FILE_BOOKS_MAX, cards: FILE_CARDS_MAX, items: FILE_ITEMS_MAX };
  const TEXTS = ['en', 'ru', 'ende', 'rud', 'ensub', 'rusub'];

  /* The bound a `long` or `many` rule names, by the object and the field's last step. */
  function limitOf(array: FileArray, field: string): number | undefined {
    const last = field.split('.').at(-1) ?? '';
    const section = field.startsWith('sections');
    switch (last) {
      case 'en':
      case 'ru':
        return array === 'items' ? NAME_MAX : array === 'cards' ? CARD_NAME_MAX : BOOK_NAME_MAX;
      case 'ende':
      case 'rud':
        return array === 'items' ? DESC_MAX : CARD_TEXT_MAX;
      case 'ensub':
      case 'rusub':
        return CARD_SUB_MAX;
      case 'url':
        return CARD_URL_MAX;
      case 'refs':
        return REFS_MAX;
      case 'craft':
      case 'craft_from':
        return CRAFT_MAX;
      case 'items':
        return array === 'cards' ? CARD_ITEMS_MAX : undefined;
      case 'sections':
        return section ? SECTIONS_MAX : undefined;
      default:
        return undefined;
    }
  }

  /* The value at an error's path in the file, as text cut to 40 characters. */
  function valueAt(doc: unknown, path: string): string {
    let v: unknown = doc;
    for (const step of path.match(/[^.[\]]+/g) ?? []) {
      if (v === null || typeof v !== 'object') return '';
      v = (v as Record<string, unknown>)[step];
    }
    if (v === undefined) return '';
    return cut40(typeof v === 'string' ? v : JSON.stringify(v));
  }

  /* An object's place and its name in the language on screen, when it has one. */
  function placeOf(
    array: FileArray,
    index: number,
    names: Record<FileArray, FileName[]>
  ): Pick<Line, 'pos' | 'name'> {
    const pos = t[POS[array] as 'hbImportPosItem'].replace('%n', String(index + 1));
    const n = names[array][index];
    const name = n
      ? named({ en: n.en && hasName(n.en) ? n.en : '', ru: n.ru && hasName(n.ru) ? n.ru : '' })
      : '';
    return name ? { pos, name: t.quoted.replace('%s', cut40(name)) } : { pos };
  }

  function errorLine(e: FileError, doc: unknown, names: Record<FileArray, FileName[]>): Line {
    const v = valueAt(doc, e.path);
    if (e.array === null || e.index === null) {
      const text =
        e.rule === 'many' && (e.field === 'books' || e.field === 'cards' || e.field === 'items')
          ? t[MANY[e.field] as 'hbImportManyItems'].replace('%n', String(FILE_MAX[e.field]))
          : e.rule === 'extra'
            ? fill(t.importErrExtra, { f: e.field })
            : fill(t.hbImportErrType, { f: e.field });
      return { text, path: e.path };
    }
    const base = e.array + '[' + String(e.index) + ']';
    const f = e.path.length > base.length ? e.path.slice(base.length + 1) : '';
    const last = f.split('.').at(-1) ?? '';
    let text: string;
    if (e.field === 'name') text = t.hbImportErrName;
    else if (f === '') text = fill(t.importErrNotObject, { v });
    else {
      switch (e.rule) {
        case 'required':
          text = fill(t.importErrMissing, { f });
          break;
        case 'extra':
          text = fill(t.importErrExtra, { f });
          break;
        case 'long':
          text = fill(t.importErrLong, { f, n: limitOf(e.array, e.field) });
          break;
        case 'many':
          text = fill(t.hbImportErrMany, { f, n: limitOf(e.array, e.field) });
          break;
        case 'range':
          text = fill(t.hbImportErrRange, { f, v });
          break;
        case 'enum':
          text = f === 'eq.line' ? t.hbImportErrLine : fill(t.hbImportErrEnum, { f, v });
          break;
        case 'pattern':
          text =
            f === 'key'
              ? fill(t.hbImportErrKey, { v })
              : last === 'dmg'
                ? fill(t.hbImportErrDmg, { f, v })
                : TEXTS.includes(last)
                  ? fill(t.hbImportErrControl, { f })
                  : fill(t.hbImportErrPattern, { f, v });
          break;
        case 'duplicate':
          text =
            f === 'key' ? fill(t.hbImportErrKeyTwice, { v }) : fill(t.hbImportErrTwice, { f });
          break;
        case 'self':
          text = fill(t.hbImportErrSelf, { f });
          break;
        case 'order':
          text = t.hbImportErrOrder;
          break;
        case 'unknown':
          text =
            f === 'book' ? fill(t.hbImportErrBook, { v }) : fill(t.hbImportErrSection, { v });
          break;
        default:
          text = fill(t.hbImportErrType, { f });
      }
    }
    return { ...placeOf(e.array, e.index, names), text, path: e.path };
  }

  const refused = $derived.by(() => {
    if (view.kind !== 'errors') return null;
    const { errors, doc, names, more } = view;
    return { lines: errors.map((e) => errorLine(e, doc, names)), more };
  });

  /* ---------- the preview ---------- */

  const held = $derived(view.kind === 'preview' ? heldOf(view.file, store) : null);
  const heldN = $derived(held ? held.items + held.cards : 0);
  const heldLines = $derived(
    held
      ? [
          { id: 'items', what: t.hbItems, names: held.names.items },
          { id: 'cards', what: t.hbCards, names: held.names.cards },
          { id: 'books', what: t.hbSources, names: held.names.books }
        ].filter((l) => l.names.length)
      : []
  );

  function toggleNames(id: string): void {
    namesOpen = namesOpen.includes(id) ? namesOpen.filter((x) => x !== id) : [...namesOpen, id];
  }
  /* The targets drawn and sent: a held source another tab deleted during the preview falls
     back to the row's default, so its items never go to «Хоумбрю» unseen. */
  const targets = $derived.by((): Target[] => {
    if (view.kind !== 'preview') return picked;
    const { rows } = view;
    return picked.map((x, i) => {
      const row = rows[i];
      if (x.kind !== 'held' || !row || store.books.some((b) => b.id === x.id)) return x;
      return defaultTarget(row, store);
    });
  });
  const plan = $derived(view.kind === 'preview' ? planOf(view.rows, targets, store) : []);
  const fileNames = (file: HomebrewFile): Record<FileArray, FileName[]> => ({
    books: file.books.map((b) => ({ ...b })),
    cards: file.cards.map((c) => ({ ...c })),
    items: file.items.map((i) => ({ ...i }))
  });

  const counts = $derived.by(() => {
    if (view.kind !== 'preview') return null;
    const { file } = view;
    const by: Record<string, number> = {
      '%b': file.books.length,
      '%s': file.books.reduce((n, b) => n + (b.sections?.length ?? 0), 0),
      '%c': file.cards.length,
      '%i': file.items.length
    };
    return t.hbImportCounts.split(/(%[bsci])/).map((p) => String(by[p] ?? p));
  });

  const noteLines = $derived.by((): Line[] => {
    if (view.kind !== 'preview') return [];
    const names = fileNames(view.file);
    return view.notes.map((n) =>
      n.kind === 'relation'
        ? {
            ...placeOf(n.array ?? 'items', n.index, names),
            text: fill(t.hbImportUnknownRef, { f: n.field, v: n.id })
          }
        : { ...placeOf('cards', n.index, names), text: t.hbImportKindDiffers }
    );
  });

  /* The row's name and size, as its select's label. */
  function rowName(row: PlanRow): string {
    return row.book ? named(row.book) : t.hbImportNoBook;
  }
  function rowSize(row: PlanRow): string {
    return row.items || !row.cards
      ? plural(row.items, t.hbItemsN, lang)
      : plural(row.cards, t.hbCardsN, lang);
  }

  /* A target as the select's value, and back. */
  function valueOf(target: Target | undefined): string {
    switch (target?.kind) {
      case 'held':
        return target.id;
      case 'new':
        return 'new';
      case 'file':
        return 'file:' + target.book;
      case 'custom':
        return 'custom';
      default:
        return '';
    }
  }

  function pick(i: number, value: string): void {
    const next: Target =
      value === ''
        ? { kind: 'home' }
        : value === 'new'
          ? { kind: 'new' }
          : value === 'custom'
            ? { kind: 'custom', name: custom[i] ?? '', lang }
            : value.startsWith('file:')
              ? { kind: 'file', book: value.slice(5) }
              : { kind: 'held', id: value };
    const all = targets.map((x, j) => (j === i ? next : x));
    /* The row with no source drops a file source that is no longer made. */
    picked = all.map((x) => {
      if (x.kind !== 'file' || view.kind !== 'preview') return x;
      const at = view.rows.findIndex((r) => r.book?.key === x.book);
      const other = all[at];
      return other?.kind === 'new' || other?.kind === 'custom' ? x : { kind: 'home' };
    });
    customErr = customErr.map((e, j) => (j === i ? null : e));
  }

  /* The options after the named sources: the row's own new source, then the sources the file
     makes for the row with none, then «+ Новый источник...». */
  function extraOf(i: number, row: PlanRow): { value: string; label: string }[] {
    if (view.kind !== 'preview') return [];
    const out: { value: string; label: string }[] = [];
    if (row.book) {
      out.push({
        value: 'new',
        label: t.hbImportToNew.replace('%s', named(newName(row.book, store)))
      });
    } else {
      view.rows.forEach((r, j) => {
        const tj = targets[j];
        if (j === i || !r.book || (tj?.kind !== 'new' && tj?.kind !== 'custom')) return;
        const name =
          tj.kind === 'custom'
            ? tj.name.trim() || named(r.book)
            : named(newName(r.book, store));
        out.push({
          value: 'file:' + r.book.key,
          label: t.hbImportToFileNew.replace('%s', name)
        });
      });
    }
    out.push({ value: 'custom', label: t.hbSourceNew });
    return out;
  }

  function noteText(n: (typeof plan)[number]['notes'][number]): string {
    switch (n.kind) {
      case 'new':
        return t.hbImportNoteNew.replace('%n', String(n.sections));
      case 'key':
        return t.hbImportNoteKey;
      case 'name':
        return t.hbImportNoteName;
      case 'add':
        return t.hbImportNoteAdd.replace('%n', String(n.sections));
      case 'home':
        return t.hbImportNoteHome;
    }
  }

  /* A custom name's problem on the press: empty, or a name a source already has. */
  function customProblem(i: number): string | null {
    const target = targets[i];
    if (target?.kind !== 'custom') return null;
    const name = (custom[i] ?? '').trim();
    if (!name) return t.hbErrSourceName;
    const others = custom
      .filter((_c, j) => j !== i && targets[j]?.kind === 'custom')
      .map((c) => ({ en: c }));
    if (nameTaken([...store.books.map((b) => b.content), ...HOME_NAMES, ...others], name)) {
      return t.hbSourceTaken.replace('%s', name);
    }
    return null;
  }

  /* The ids and keys of this file's rows, kept until the next file. */
  const importIds = {
    id: (slot: string): string => {
      let v = ids.get('id:' + slot);
      if (v === undefined) {
        v = store.newIds().id;
        ids.set('id:' + slot, v);
      }
      return v;
    },
    key: (slot: string, first?: string): string => {
      let v = ids.get('key:' + slot);
      if (v === undefined) {
        v = first ?? store.newIds().key;
        ids.set('key:' + slot, v);
      }
      return v;
    }
  };

  async function send(): Promise<void> {
    if (view.kind !== 'preview' || sending) return;
    const { file, rows } = view;
    const problems = rows.map((_r, i) => customProblem(i));
    customErr = problems;
    if (problems.some((p) => p !== null) || plan.some((p) => p.full)) return;
    if (
      update &&
      heldN &&
      !app.env.dialog.confirm(t.hbImportUpdateConfirm.replace('%n', String(heldN)))
    ) {
      return;
    }
    const sent = targets.map((x, i): Target =>
      x.kind === 'custom' ? { ...x, name: custom[i] ?? '', lang } : x
    );
    const callRows = toHomebrewRows(file, rows, sent, store, update, importIds);
    sending = true;
    const r = await store.import(callRows);
    sending = false;
    if (r.ok) {
      const c = r.counts;
      app.say((t) =>
        [
          t.hbImportDone.replace('%n', String(c.items_created)),
          c.items_updated + c.cards_updated
            ? t.hbImportDoneUpdated.replace('%n', String(c.items_updated + c.cards_updated))
            : '',
          c.items_skipped + c.cards_skipped
            ? t.hbImportDoneSkipped.replace('%n', String(c.items_skipped + c.cards_skipped))
            : '',
          c.books_created ? t.hbImportDoneBooks.replace('%n', String(c.books_created)) : '',
          c.cards_created ? t.hbImportDoneCards.replace('%n', String(c.cards_created)) : ''
        ]
          .filter(Boolean)
          .join(', ')
      );
      onclose();
    } else if (r.error === 'limit') {
      const { key, value } = r;
      app.say((t) => limitText(key, value, t), { error: true });
    } else if (r.error === 'refused') {
      const slow = r.reason === 'tooSlow';
      app.say((t) => (slow ? t.importTooSlow : t.hbImportRefused), { error: true });
    } else {
      app.say((t) => t.hbImportFailed, { error: true });
    }
  }
</script>

<!-- One line of names: the lead, the first `NAMES_SHOWN` names, then «и ещё N» or «свернуть»;
     the same button both ways, so the focus stays on it. -->
{#snippet nameLine(id: string, lead: string, names: readonly NamedPair[])}
  {@const open = namesOpen.includes(id)}
  {@const shown = open ? names : names.slice(0, NAMES_SHOWN)}
  <p class="preview names">
    {lead}
    {shown.map(named).join(', ') +
      (names.length > NAMES_SHOWN ? ' ' : '')}{#if names.length > NAMES_SHOWN}<Button
        variant="bare"
        size="sm"
        caret
        expanded={open}
        onclick={() => {
          toggleNames(id);
        }}
        >{open
          ? t.relLess
          : t.andMore.replace('%n', String(names.length - NAMES_SHOWN))}</Button
      >{/if}.
  </p>
{/snippet}

<!-- A `{@render}` tag reads as a void expression to this rule wherever it sits among text. -->
<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -->
{#snippet bold(parts: string[])}{#each parts as part, i (i)}{#if i % 2}<b>{part}</b
      >{:else}{part}{/if}{/each}{/snippet}

{#snippet cancel()}
  <Button size="sm" variant="ghost" disabled={sending} onclick={onclose}>{t.cancel}</Button>
{/snippet}

<Field label={t.hbImportHead}>
  <ImportFile
    {t}
    name="homebrew.json"
    onpick={() => {
      view = { kind: 'empty' };
    }}
    {onread}
  />

  {#if view.kind === 'refused'}
    {@const version = view.version ?? ''}
    <div class="errs" role="alert">
      <b>{t[view.key].replace('%s', () => version)}</b>
    </div>
    <Actions style="margin-top:12px">{@render cancel()}</Actions>
  {:else if view.kind === 'errors' && refused}
    <div class="errs" role="alert">
      <b>{t.importErrors}</b>
      <ImportLines lines={refused.lines} shown={ERRORS_MAX} more={() => ''} />
      {#if refused.more}
        <p class="more">{plural(refused.more, t.importErrMore, lang)}</p>
      {/if}
    </div>
    <Actions style="margin-top:12px">{@render cancel()}</Actions>
  {:else if view.kind === 'preview' && counts}
    {@const rows = view.rows}
    <p class="preview">{@render bold(counts)}</p>
    {#if held?.names.sameNamed.length}
      {@render nameLine('same', t.hbImportSameNamed, held.names.sameNamed)}
    {/if}
    {#if view.sibling}
      <p class="preview">{t.hbImportZipLists}</p>
    {/if}
    {#if view.other.length}
      <p class="preview">
        {t.importZipOther.replace('%s', () =>
          view.kind === 'preview' ? fewNames(view.other, t, view.otherMore) : ''
        )}
      </p>
    {/if}
    <div class="where">
      <span class="lbl">{t.hbImportWhere}</span>
      {#each allRows ? rows : rows.slice(0, ROWS_SHOWN) as row, i (row.book?.key ?? '')}
        {@const p = plan[i]}
        {@const rowId = 'hb-import-' + String(i)}
        <div class="srcrow">
          <SourcePicker
            id={rowId}
            books={store.books}
            {lang}
            value={valueOf(targets[i])}
            home={t.hbImportToHome}
            held={(name: string) => t.hbImportToHeld.replace('%s', name)}
            extra={extraOf(i, row)}
            inline
            describedby={p?.notes.length || p?.full ? rowId + '-note' : undefined}
            onchange={(v: string) => {
              pick(i, v);
            }}
          >
            {#snippet label()}<b>{rowName(row)}</b><small>{rowSize(row)}</small>{/snippet}
          </SourcePicker>
          {#if targets[i]?.kind === 'custom'}
            <div class="custom">
              <label class="sub" for={rowId + '-name'}>{t.hbImportNewName}</label>
              <TextInput
                id={rowId + '-name'}
                bind:value={() => custom[i] ?? '', (v: string) => (custom[i] = v)}
                maxlength={BOOK_NAME_MAX}
                invalid={!!customErr[i]}
                describedby={customErr[i] ? rowId + '-err' : undefined}
                autocomplete="off"
                oninput={() => {
                  customErr = customErr.map((e, j) => (j === i ? null : e));
                }}
              />
              {#if customErr[i]}
                <span class="err" id={rowId + '-err'}>{customErr[i]}</span>
              {/if}
            </div>
          {/if}
          {#if p?.notes.length || p?.full}
            <span class="fhint" id={rowId + '-note'}
              >{p.notes.map(noteText).join(' ')}{#if p.full}<span class="err"
                  >{t.hbImportFull.replace('%s', named(p.full))}</span
                >{/if}</span
            >
          {/if}
        </div>
      {/each}
      {#if rows.length > ROWS_SHOWN}
        <div>
          <Button
            size="sm"
            variant="bare"
            caret
            expanded={allRows}
            onclick={() => {
              allRows = !allRows;
            }}
            >{allRows
              ? t.relLess
              : plural(rows.length - ROWS_SHOWN, t.hbImportMoreRows, lang)}</Button
          >
        </div>
      {/if}
    </div>
    {#if heldN || held?.books}
      <div class="held">
        <span class="lbl" aria-hidden="true">{t.hbImportHeldLabel}</span>
        <Seg
          label={t.hbImportHeldLabel}
          options={[
            { value: 'skip', label: t.hbImportSkip },
            { value: 'update', label: t.hbImportUpdate }
          ]}
          value={update ? 'update' : 'skip'}
          onchange={(v) => {
            update = v === 'update';
          }}
        />
        {#each heldLines as l (l.id)}
          {@render nameLine(
            l.id,
            (update ? t.hbImportHeldReplace : t.hbImportHeldKeep).replace('%k', () => l.what),
            l.names
          )}
        {/each}
        <p class="fhint">
          {#if heldN}
            {(update ? t.hbImportUpdateNote : t.hbImportSkipNote).replace('%n', String(heldN))}
          {:else}
            {update ? t.hbImportUpdateBooksNote : t.hbImportSkipBooksNote}
          {/if}
        </p>
      </div>
    {/if}
    {#if noteLines.length}
      <div class="rep">
        <ImportLines lines={noteLines} more={(n) => t.andMore.replace('%n', String(n))} />
      </div>
    {/if}
    <Actions style="margin-top:12px">
      <Button size="sm" variant="primary" disabled={sending} onclick={() => void send()}
        >{`${t.importGo} (${String(view.file.items.length + view.file.cards.length)})`}</Button
      >
      {@render cancel()}
    </Actions>
  {/if}

  <p class="hint">
    {t.hbImportHintBefore}<a href="schema/homebrew-v1.json" target="_blank" rel="noopener"
      >{t.hbImportSchema}</a
    >
    /
    <a href="schema/homebrew-v2.json" target="_blank" rel="noopener">{t.hbImportSchemaV2}</a
    >{t.importHintMid}<a href="llms.txt" target="_blank" rel="noopener">{t.importLlms}</a
    >{t.hbImportHintAfter}
  </p>
</Field>

<!-- eslint-enable @typescript-eslint/no-confusing-void-expression -->

<style>
  .preview {
    margin: 12px 0 0;
    font-size: 13.5px;
    line-height: 1.55;
  }

  .names {
    overflow-wrap: anywhere;
  }

  .held .names {
    margin: 8px 0 0;
  }

  .lbl {
    display: block;
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin: 0 0 8px;
  }

  .where,
  .held {
    margin: 14px 0 0;
  }

  /* off m15's `.srcrow` */
  .srcrow {
    padding: 10px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  .srcrow:first-of-type {
    border-top: 0;
    padding-top: 2px;
  }

  .srcrow b {
    min-width: 0;
    font-size: 14px;
    font-weight: 650;
    overflow-wrap: anywhere;
  }

  .srcrow small {
    font-size: 12.5px;
    color: var(--muted2);
  }

  .custom {
    display: grid;
    gap: 6px;
    margin: 10px 0 0;
  }

  .sub {
    font-size: 13px;
    color: var(--muted);
  }

  .fhint {
    display: block;
    margin: 6px 0 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--muted2);
  }

  .err {
    display: block;
    font-size: 12.5px;
    color: var(--danger-text);
  }

  .rep {
    margin: 12px 0 0;
    padding: 8px 12px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--bg2);
    font-size: 13px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .rep :global(code) {
    color: var(--gold-soft);
  }

  /* A refused file: the lists import's warning box. */
  .errs {
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-sm);
    background: var(--warn-bg);
    border: 1px solid var(--warn-line);
    color: var(--warn-text);
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .errs b {
    color: var(--warn-strong);
    font-weight: 650;
    display: block;
  }

  .errs :global(code) {
    color: var(--warn-strong);
  }

  .more {
    margin: 4px 0 0;
  }

  .hint {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
