<script lang="ts">
  /* «Импорт из файла JSON» in the lists index's «Новый список» panel: the
     file, its preview with the skips grouped by list, or the reason it is
     refused, and the press that imports every list or none
     (docs/specs/FEATURES.md, "Lists"). A zip goes through `lib/zip.ts`,
     loaded only when one is chosen. The rows are built once per file, so a
     retry after a lost answer sends the same ids. */
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Field from './Field.svelte';
  import {
    decodeText,
    FILE_MAX_BYTES,
    ID_PATTERN,
    parseBundle,
    type BundleError,
    type ImportList,
    type Skipped
  } from '../lib/bundle.js';
  import { limitText, type ImportRow } from '../lib/cloudLists.js';
  import { fewNames, nameOf } from '../lib/i18n.js';
  import { plural } from '../lib/plural.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    onclose: () => void;
    /* True while the import call runs; the page disables the fold toggle. */
    sending?: boolean;
  }

  let { app, onclose, sending = $bindable(false) }: Props = $props();

  type View =
    | { kind: 'empty' }
    /* A refusal keeps its key, so the line follows a language switch. */
    | { kind: 'refused'; key: Refusal; version?: string }
    | { kind: 'errors'; errors: BundleError[]; more: number; names: (string | null)[] }
    | {
        kind: 'preview';
        lists: ImportList[];
        skipped: Skipped[];
        rows: ImportRow[];
        other: string[];
        otherMore: number;
      };

  type Refusal =
    | 'importTooBig'
    | 'accountFailed'
    | 'importNotJson'
    | 'importNotBundle'
    | 'importVersion'
    | 'importNoVersion'
    | 'importEmpty'
    | 'importNotZip'
    | 'importZipNoLists'
    | 'importZipManyLists'
    | 'importZipPacked';

  /** A report line: the entry's place and record, when it has them, then the text and
   *  the JSON path. */
  interface Line {
    pos?: string;
    name?: string;
    item?: string;
    text: string;
    path?: string;
  }

  const t = $derived(app.t);
  let view = $state<View>({ kind: 'empty' });
  let fileName = $state('');
  let input = $state<HTMLInputElement | undefined>(undefined);
  /* A file chosen while another is read wins: the older read is dropped. */
  let reading = 0;

  const ZIP_START = [0x50, 0x4b, 0x03, 0x04];
  const REPORT_LINES = 10;

  const cut = (s: string): string => {
    const cps = Array.from(s);
    return cps.length > 40 ? cps.slice(0, 40).join('') + '...' : s;
  };
  const listName = (name: string | null | undefined): string =>
    name ? cut(name) : t.importNoName;
  /* One pass, so a value that holds `%s` is not filled in again. */
  const fill = (template: string, by: Record<string, string | number | undefined>): string =>
    template.replace(/%([flnsv])/g, (m, k: string) => {
      const v = by[k];
      return v === undefined ? m : String(v);
    });

  function refuse(key: Refusal, version?: string): void {
    view = version === undefined ? { kind: 'refused', key } : { kind: 'refused', key, version };
  }

  async function choose(file: File): Promise<void> {
    const mine = ++reading;
    fileName = file.name;
    view = { kind: 'empty' };
    if (file.size > FILE_MAX_BYTES) {
      refuse('importTooBig');
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      if (mine === reading) refuse('accountFailed');
      return;
    }
    const text = await textOf(bytes);
    if (mine !== reading) return;
    if ('refused' in text) refuse(text.refused);
    else read(text.lists, text.other, text.more);
  }

  /* The lists file's text, from a plain file or the data zip, or the refusal. */
  async function textOf(
    bytes: Uint8Array
  ): Promise<{ lists: string; other: string[]; more: number } | { refused: Refusal }> {
    if (!ZIP_START.every((b, i) => bytes[i] === b)) {
      const text = decodeText(bytes);
      return text === null ? { refused: 'importNotJson' } : { lists: text, other: [], more: 0 };
    }
    const zip = await import('../lib/zip.js').catch(() => null);
    if (!zip) return { refused: 'accountFailed' };
    const r = zip.readDataZip(bytes);
    if (r.ok) return r;
    const keys = {
      notZip: 'importNotZip',
      noLists: 'importZipNoLists',
      manyLists: 'importZipManyLists',
      packed: 'importZipPacked',
      notText: 'importNotJson'
    } as const;
    return { refused: keys[r.reason] };
  }

  function read(text: string, other: string[], otherMore: number): void {
    const p = parseBundle(text, (id) => app.index?.byId.has(id) ?? false);
    if (p.ok) {
      const rows = app.cloudLists?.importRows(p.lists) ?? [];
      view = { kind: 'preview', lists: p.lists, skipped: p.skipped, rows, other, otherMore };
    } else if (p.reason === 'errors') {
      view = { kind: 'errors', errors: p.errors, more: p.more, names: p.names };
    } else if (p.reason === 'version') {
      if (p.version === undefined) refuse('importNoVersion');
      else refuse('importVersion', JSON.stringify(p.version));
    } else {
      const keys = {
        notJson: 'importNotJson',
        notBundle: 'importNotBundle',
        empty: 'importEmpty'
      } as const;
      refuse(keys[p.reason]);
    }
  }

  function onfile(e: Event & { currentTarget: HTMLInputElement }): void {
    const el = e.currentTarget;
    const [file] = el.files ?? [];
    /* Emptied so the same file can be chosen again. */
    el.value = '';
    if (file) void choose(file);
  }

  /* The record of an entry, named when the data knows it. */
  function where(entry: number, item: string | undefined): Pick<Line, 'pos' | 'name' | 'item'> {
    const pos = t.importPos.replace('%n', String(entry + 1));
    if (item === undefined) return { pos };
    const it = app.index?.byId.get(item);
    return it ? { pos, name: nameOf(it, app.lang), item } : { pos, item };
  }

  function errorLine(e: BundleError): Line {
    const f =
      e.field === 'name' && e.list !== null && e.entry === null ? t.importFieldName : e.field;
    const by = { f, v: e.value, n: e.limit, s: e.limit };
    let text: string;
    switch (e.kind) {
      case 'missing':
        text = f === t.importFieldName ? t.importErrName : fill(t.importErrMissing, by);
        break;
      case 'type':
        text =
          e.limit === ID_PATTERN.source
            ? fill(t.importErrId, by)
            : e.field === ''
              ? fill(t.importErrNotObject, by)
              : fill(t.importErrType, by);
        break;
      case 'long':
        text = fill(t.importErrLong, by);
        break;
      case 'range':
        text = fill(t.importErrRange, by);
        break;
      case 'enum':
        text = fill(t.importErrEnum, by);
        break;
      case 'extra':
        text = fill(t.importErrExtra, by);
        break;
      case 'many':
        text = fill(e.field === 'lists' ? t.importErrManyLists : t.importErrManyEntries, by);
        break;
    }
    return {
      ...(e.entry === null ? {} : where(e.entry, e.item)),
      text,
      ...(e.path ? { path: e.path } : {})
    };
  }

  function skipLine(s: Skipped): Line {
    return {
      ...where(s.entry, s.id),
      text:
        s.why === 'unknown'
          ? t.importSkipUnknown
          : t.importSkipRepeat.replace('%n', String((s.first ?? 0) + 1))
    };
  }

  /* The error report: the file's own errors, then one block per list, in file order. */
  const refused = $derived.by(() => {
    if (view.kind !== 'errors') return null;
    const { errors, names } = view;
    const file = errors.filter((e) => e.list === null).map(errorLine);
    const indexes = errors
      .map((e) => e.list)
      .filter((l, i, all): l is number => l !== null && all.indexOf(l) === i)
      .sort((a, b) => a - b);
    const lists = indexes.map((i) => ({
      head: `${String(i + 1)}. ${listName(names[i])}`,
      lines: errors.filter((e) => e.list === i).map(errorLine)
    }));
    return { file, lists, more: view.more };
  });

  /* The preview's report: every list, when any list has a skip or a name the account
     holds. */
  const report = $derived.by(() => {
    if (view.kind !== 'preview') return null;
    const held = app.cloudLists?.lists ?? [];
    const { skipped } = view;
    const lists = view.lists.map((l, i) => {
      const lines = skipped.filter((s) => s.list === i).map(skipLine);
      if (held.some((h) => h.name.trim() === l.name.trim()))
        lines.push({ text: t.importNameTaken });
      return {
        head: `${String(i + 1)}. ${listName(l.name)}`,
        size: l.entries.length
          ? plural(l.entries.length, t.importWillN, app.lang)
          : t.importListEmpty,
        lines
      };
    });
    return lists.some((l) => l.lines.length) ? lists : null;
  });

  /* The preview's head: the texts with each number in bold (the odd parts). */
  const head = $derived.by(() => {
    if (view.kind !== 'preview') return null;
    const { lists, skipped, other, otherMore } = view;
    const counts: Record<string, number> = {
      '%l': lists.length,
      '%n': lists.reduce((sum, l) => sum + l.entries.length, 0)
    };
    return {
      parts: t.importPreview.split(/(%[ln])/).map((p) => String(counts[p] ?? p)),
      skipped: skipped.length
        ? t.importSkippedN.split(/(%n)/).map((p) => (p === '%n' ? String(skipped.length) : p))
        : null,
      other: other.length
        ? t.importZipOther.replace('%s', () => fewNames(other, t, otherMore))
        : ''
    };
  });

  async function send(rows: ImportRow[]): Promise<void> {
    const store = app.cloudLists;
    if (!store || sending) return;
    sending = true;
    const answer = await store.import(rows);
    sending = false;
    if (answer.ok) {
      const n = rows.length;
      app.say((t) => t.importDone.replace('%n', String(n)));
      onclose();
    } else if (answer.error === 'limit') {
      const { key, value } = answer;
      app.say((t) => limitText(key, value, t), { error: true });
    } else if (answer.error === 'refused' && answer.reason === 'tooSlow') {
      app.say((t) => t.importTooSlow, { error: true });
    } else {
      app.say((t) => t.accountFailed, { error: true });
    }
  }
</script>

<!-- A `{@render}` tag reads as a void expression to this rule wherever it
     sits among text; the report renders its snippets inside lines and boxes. -->
<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -->
{#snippet lineOf(l: Line)}{#if l.pos}{l.pos}{#if l.item},&#32;{#if l.name}{l.name}&#32;(<code
          >{l.item}</code
        >){:else}<code>{l.item}</code>{/if}{/if}:&#32;{/if}{l.text}{l.path
    ? ' '
    : ''}{#if l.path}<code>{l.path}</code>{/if}{/snippet}

{#snippet bold(parts: string[])}{#each parts as part, i (i)}{#if i % 2}<b>{part}</b
      >{:else}{part}{/if}{/each}{/snippet}

{#snippet lines(ls: Line[], cls?: string)}
  <ul>
    {#each ls.slice(0, REPORT_LINES) as l, i (i)}
      <li class={cls}>{@render lineOf(l)}</li>
    {/each}
    {#if ls.length > REPORT_LINES}
      <li class={cls}>{t.importErrMoreList.replace('%n', String(ls.length - REPORT_LINES))}</li>
    {/if}
  </ul>
{/snippet}

{#snippet cancel()}
  <Button size="sm" variant="ghost" disabled={sending} onclick={onclose}>{t.cancel}</Button>
{/snippet}

<Field label={t.importHead}>
  <Actions>
    <Button size="sm" onclick={() => input?.click()}>{t.importPick}</Button>
    {#if fileName}<span class="fname">{fileName}</span>{/if}
  </Actions>
  <input
    bind:this={input}
    type="file"
    hidden
    accept=".json,.zip,application/json,application/zip"
    onchange={onfile}
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
      {#if refused.file.length}{@render lines(refused.file)}{/if}
    </div>
    {#if refused.lists.length || refused.more}
      <div class="rep">
        {#each refused.lists as l (l.head)}
          <div class="rep-list bad">
            <b>{l.head}</b>
            {@render lines(l.lines)}
          </div>
        {/each}
        {#if refused.more}
          <p class="rep-more">{plural(refused.more, t.importErrMore, app.lang)}</p>
        {/if}
      </div>
    {/if}
    <Actions style="margin-top:12px">{@render cancel()}</Actions>
  {:else if view.kind === 'preview' && head}
    {@const rows = view.rows}
    <p class="preview">
      {@render bold(head.parts)}{head.skipped ? ' ' : ''}{#if head.skipped}{@render bold(
          head.skipped
        )}{/if}
    </p>
    {#if head.other}
      <p class="preview">{head.other}</p>
    {/if}
    {#if report}
      <div class="rep">
        {#each report as l (l.head)}
          <div class="rep-list">
            <b>{l.head}</b><small>{l.size}</small>
            {#if l.lines.length}{@render lines(l.lines, 'skip')}{/if}
          </div>
        {/each}
      </div>
    {/if}
    <Actions style="margin-top:12px">
      <Button size="sm" variant="primary" disabled={sending} onclick={() => void send(rows)}
        >{`${t.importGo} (${String(rows.length)})`}</Button
      >
      {@render cancel()}
    </Actions>
  {/if}

  <p class="hint">
    {t.importHintBefore}<a href="schema/import-v1.json" target="_blank" rel="noopener"
      >{t.importSchema}</a
    >{t.importHintMid}<a href="llms.txt" target="_blank" rel="noopener">{t.importLlms}</a
    >{t.importHintAfter}
  </p>
</Field>

<!-- eslint-enable @typescript-eslint/no-confusing-void-expression -->

<style>
  /* The import report grouped by list. */
  .rep {
    margin: 12px 0 0;
    display: grid;
    gap: 8px;
  }

  .rep-list {
    overflow-wrap: anywhere;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    padding: 8px 12px;
    background: var(--bg2);
    font-size: 13px;
  }

  .rep-list.bad {
    background: var(--warn-bg);
    border-color: var(--warn-line);
    color: var(--warn-text);
  }

  .rep-list > b {
    display: block;
    font-size: 13.5px;
    color: var(--txt);
  }

  .rep-list.bad > b {
    color: var(--warn-strong);
  }

  .rep-list small {
    color: var(--muted2);
    font-size: 12.5px;
  }

  .rep-list ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }

  .rep-list code {
    font: 12px/1.4 var(--mono);
    color: var(--gold-soft);
  }

  .rep-list.bad code {
    color: var(--warn-strong);
  }

  .rep-list .skip {
    color: var(--muted);
  }

  /* The count of errors past the kept ones. */
  .rep-more {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--warn-text);
  }

  .fname {
    font-size: 13px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .preview {
    margin: 12px 0 0;
    font-size: 13.5px;
    line-height: 1.55;
  }

  /* A refused file: the warning box of StorageNotice.svelte, in the warn tokens. */
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

  .errs ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }

  .errs code {
    font: 12px/1.4 var(--mono);
    color: var(--warn-strong);
  }

  .hint {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
