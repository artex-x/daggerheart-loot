<script lang="ts">
  /* «Импорт из файла JSON» in the lists index's «Новый список» panel: the
     file, its preview with the skips grouped by list, or the reason it is
     refused, and the press that imports every list or none
     (docs/specs/FEATURES.md, "Lists"). A zip's `lists.json` is read by
     `ImportFile`; its `homebrew.json` is the homebrew import's. The rows are
     built once per file, so a retry after a lost answer sends the same ids; a
     kept entry without a snapshot whose own item went reads the file again. */
  import { untrack } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Field from './Field.svelte';
  import ImportFile from './ImportFile.svelte';
  import ImportLines from './ImportLines.svelte';
  import {
    ID_PATTERN,
    parseBundle,
    type BundleError,
    type ImportList,
    type ImportPlan,
    type Skipped
  } from '../lib/bundle.js';
  import { limitText } from '../lib/cloudLists.js';
  import { fewNames, nameOf } from '../lib/i18n.js';
  import { plural } from '../lib/plural.js';
  import type { ReportLine as Line } from '../lib/types.js';
  import type { FileRead, FileRefusal } from '../lib/zip.js';
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
        /* The file's text, read again when a kept entry's own item goes. */
        text: string;
        lists: ImportList[];
        skipped: Skipped[];
        plan: ImportPlan;
        sibling: boolean;
        other: string[];
        otherMore: number;
      };

  type Refusal =
    | 'importTooBig'
    | 'importZipTooBig'
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

  const t = $derived(app.t);
  /* Raw: every change replaces the view whole, and its plan reaches the ports as built,
     never as a reactive proxy a structured clone refuses. */
  let view = $state.raw<View>({ kind: 'empty' });
  /* The text of a v2 file read while the account's items load: read again once they are. */
  let waiting = $state<{
    text: string;
    sibling: boolean;
    other: string[];
    more: number;
  } | null>(null);
  /* The report draws the first lists; «и ещё N списков» opens the rest. */
  let allLists = $state(false);

  const LISTS_SHOWN = 20;
  const REFUSALS: Record<FileRefusal, Refusal> = {
    tooBig: 'importTooBig',
    zipTooBig: 'importZipTooBig',
    failed: 'accountFailed',
    notJson: 'importNotJson',
    notZip: 'importNotZip',
    missing: 'importZipNoLists',
    many: 'importZipManyLists',
    packed: 'importZipPacked'
  };

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
  const moreLines = (n: number): string => t.importErrMoreList.replace('%n', String(n));

  function refuse(key: Refusal, version?: string): void {
    view = version === undefined ? { kind: 'refused', key } : { kind: 'refused', key, version };
  }

  function onread(r: FileRead): void {
    if (!r.ok) refuse(REFUSALS[r.reason]);
    else read(r.text, r.sibling, r.other, r.more);
  }

  /* A v2 file names own items: its plan waits for the account's items, so a held key is
     linked, never copied by a read that has not answered yet. */
  const homebrewLoading = (): boolean => {
    const status = app.homebrew?.status;
    return status !== undefined && status !== 'ready';
  };

  /* The held-key test for an entry without a snapshot, which imports only under a held key;
     the copy line and `importPlan` test a snapshot's copy apart. */
  const holdsNow = (): ((key: string) => boolean) => {
    const held = new Set((app.homebrew?.items ?? []).map((i) => i.key));
    return (key) => held.has(key);
  };

  function read(text: string, sibling: boolean, other: string[], otherMore: number): void {
    waiting = null;
    allLists = false;
    /* A lists file holds catalog ids only: an own key never imports as an official entry. */
    const p = parseBundle(text, (id) => app.catalog?.byId.has(id) ?? false, holdsNow());
    if (p.ok) {
      if (
        (p.lists.some((l) => l.entries.some((e) => e.source === 'homebrew')) ||
          p.skipped.some((s) => s.why === 'unheld')) &&
        homebrewLoading()
      ) {
        waiting = { text, sibling, other, more: otherMore };
        view = { kind: 'empty' };
        return;
      }
      const plan = app.importPlan(p.lists) ?? { rows: [], copies: null };
      view = {
        kind: 'preview',
        text,
        lists: p.lists,
        skipped: p.skipped,
        plan,
        sibling,
        other,
        otherMore
      };
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

  $effect(() => {
    if (waiting && !homebrewLoading()) {
      const w = waiting;
      read(w.text, w.sibling, w.other, w.more);
    }
  });

  /* A kept entry without a snapshot whose own item went reads the file again, with new
     ids: the server refuses such a link whole, so none of the file's lists landed. A
     skipped key that comes stays skipped: the press's own copies would make it held
     after a failed lists call, and that press must keep its ids. */
  $effect(() => {
    if (view.kind !== 'preview' || sending || homebrewLoading()) return;
    const holds = holdsNow();
    const gone = view.lists.some((l) =>
      l.entries.some(
        (e) => e.source === 'homebrew' && e.snapshot === null && !holds(e.item_key)
      )
    );
    if (gone) {
      const v = view;
      untrack(() => {
        read(v.text, v.sibling, v.other, v.otherMore);
      });
    }
  });

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
      case 'hbId':
        text = fill(t.importErrHbId, by);
        break;
      case 'snapshot':
        text = t.importErrSnapshot;
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
          : s.why === 'unheld'
            ? t.importSkipUnheld
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
     holds. The skips are grouped by list once, so a file of 1000 lists reads them once. */
  const report = $derived.by(() => {
    if (view.kind !== 'preview') return null;
    const held = new Set((app.cloudLists?.lists ?? []).map((h) => h.name.trim()));
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a grouping read once, never state
    const byList = new Map<number, Skipped[]>();
    for (const s of view.skipped) {
      const list = byList.get(s.list);
      if (list) list.push(s);
      else byList.set(s.list, [s]);
    }
    const lists = view.lists.map((l, i) => {
      const lines = (byList.get(i) ?? []).map(skipLine);
      if (held.has(l.name.trim())) lines.push({ text: t.importNameTaken });
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
    const { lists, skipped, plan, other, otherMore } = view;
    const counts: Record<string, number> = {
      '%l': lists.length,
      '%n': lists.reduce((sum, l) => sum + l.entries.length, 0)
    };
    /* Read from the account's items now: a copy whose key the account holds since the
       preview is not made, and one deleted since is made at the press. */
    const own = app.homebrew;
    const planned = new Set((plan.copies?.items ?? []).map((i) => i.key));
    const unheld = new Set(
      lists.flatMap((l) =>
        l.entries.flatMap((e) =>
          e.source === 'homebrew' &&
          e.snapshot !== null &&
          !own?.has(e.item_key) &&
          !planned.has(e.item_key)
            ? [e.item_key]
            : []
        )
      )
    );
    const frozen =
      (plan.copies?.items ?? []).filter((i) => !own?.has(i.key)).length + unheld.size;
    return {
      parts: t.importPreview.split(/(%[ln])/).map((p) => String(counts[p] ?? p)),
      skipped: skipped.length
        ? t.importSkippedN.split(/(%n)/).map((p) => (p === '%n' ? String(skipped.length) : p))
        : null,
      frozen: frozen ? t.importFrozenN.replace('%n', String(frozen)) : '',
      other: other.length
        ? t.importZipOther.replace('%s', () => fewNames(other, t, otherMore))
        : ''
    };
  });

  async function send(plan: ImportPlan, lists: ImportList[]): Promise<void> {
    if (!app.cloudLists || sending) return;
    /* An own item deleted since the preview gains its copy, with the same ids. */
    const fresh = app.importPlan(lists, plan) ?? plan;
    if (fresh !== plan && view.kind === 'preview') view = { ...view, plan: fresh };
    sending = true;
    const answer = await app.importLists(fresh);
    sending = false;
    if (answer.ok) {
      const n = fresh.rows.length;
      app.say((t) => t.importDone.replace('%n', String(n)));
      onclose();
    } else if (answer.error === 'limit') {
      const { key, value } = answer;
      app.say((t) => limitText(key, value, t), { error: true });
    } else if (answer.error === 'refused' && answer.reason === 'tooSlow') {
      app.say((t) => t.importTooSlow, { error: true });
    } else if (answer.error === 'refused') {
      /* The account changed under the preview (a linked item deleted) or a copy was
         refused: the next press builds its plan from the read; an entry without a snapshot
         then becomes a skip through the re-read. */
      void app.homebrew?.read();
      app.say((t) => t.importRefused, { error: true });
    } else {
      app.say((t) => t.accountFailed, { error: true });
    }
  }
</script>

<!-- A `{@render}` tag reads as a void expression to this rule wherever it
     sits among text; the report renders its snippets inside lines and boxes. -->
<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -->
{#snippet bold(parts: string[])}{#each parts as part, i (i)}{#if i % 2}<b>{part}</b
      >{:else}{part}{/if}{/each}{/snippet}

{#snippet cancel()}
  <Button size="sm" variant="ghost" disabled={sending} onclick={onclose}>{t.cancel}</Button>
{/snippet}

<Field label={t.importHead}>
  <ImportFile
    {t}
    name="lists.json"
    onpick={() => {
      view = { kind: 'empty' };
      waiting = null;
    }}
    {onread}
  />

  {#if waiting}
    <p class="preview" role="status">{t.hbNotReady}</p>
  {:else if view.kind === 'refused'}
    {@const version = view.version ?? ''}
    <div class="errs" role="alert">
      <b>{t[view.key].replace('%s', () => version)}</b>
    </div>
    <Actions style="margin-top:12px">{@render cancel()}</Actions>
  {:else if view.kind === 'errors' && refused}
    <div class="errs" role="alert">
      <b>{t.importErrors}</b>
      {#if refused.file.length}<ImportLines lines={refused.file} more={moreLines} />{/if}
    </div>
    {#if refused.lists.length || refused.more}
      <div class="rep">
        {#each refused.lists as l (l.head)}
          <div class="rep-list bad">
            <b>{l.head}</b>
            <ImportLines lines={l.lines} more={moreLines} />
          </div>
        {/each}
        {#if refused.more}
          <p class="rep-more">{plural(refused.more, t.importErrMore, app.lang)}</p>
        {/if}
      </div>
    {/if}
    <Actions style="margin-top:12px">{@render cancel()}</Actions>
  {:else if view.kind === 'preview' && head}
    {@const plan = view.plan}
    {@const lists = view.lists}
    <p class="preview">
      {@render bold(head.parts)}{head.skipped ? ' ' : ''}{#if head.skipped}{@render bold(
          head.skipped
        )}{/if}
    </p>
    {#if head.frozen}
      <p class="preview">{head.frozen}</p>
    {/if}
    {#if view.sibling}
      <p class="preview">{t.importZipHomebrew}</p>
    {/if}
    {#if head.other}
      <p class="preview">{head.other}</p>
    {/if}
    {#if report}
      <div class="rep">
        {#each allLists ? report : report.slice(0, LISTS_SHOWN) as l (l.head)}
          <div class="rep-list">
            <b>{l.head}</b><small>{l.size}</small>
            {#if l.lines.length}<ImportLines lines={l.lines} more={moreLines} cls="skip" />{/if}
          </div>
        {/each}
        {#if report.length > LISTS_SHOWN}
          <div>
            <Button
              size="sm"
              variant="bare"
              caret
              expanded={allLists}
              onclick={() => {
                allLists = !allLists;
              }}
              >{allLists
                ? t.relLess
                : plural(report.length - LISTS_SHOWN, t.importMoreLists, app.lang)}</Button
            >
          </div>
        {/if}
      </div>
    {/if}
    <Actions style="margin-top:12px">
      <Button
        size="sm"
        variant="primary"
        disabled={sending}
        onclick={() => void send(plan, lists)}
        >{`${t.importGo} (${String(plan.rows.length)})`}</Button
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

  .rep-list :global(code) {
    color: var(--gold-soft);
  }

  .rep-list.bad :global(code) {
    color: var(--warn-strong);
  }

  .rep-list :global(.skip) {
    color: var(--muted);
  }

  /* The count of errors past the kept ones. */
  .rep-more {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--warn-text);
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

  .errs :global(code) {
    color: var(--warn-strong);
  }

  .hint {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
