<script lang="ts">
  /* «Импорт из файла JSON», the panel under the lists index's head: the
     file, its preview with the skips grouped by list, or the reason it is
     refused, and the press that imports every list or none
     (docs/specs/FEATURES.md, "Lists"). A zip's `lists.json` is read by
     `ImportFile`; its `homebrew.json` is the homebrew import's. The rows are
     built once per file, so a retry after a lost answer sends the same ids; a
     kept entry without a snapshot whose own item went reads the file again. */
  import { untrack } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import FoldButton from './FoldButton.svelte';
  import Field from './Field.svelte';
  import ImportFileRow from './ImportFileRow.svelte';
  import ImportLines from './ImportLines.svelte';
  import {
    parseBundle,
    type BundleError,
    type ImportList,
    type ImportPlan,
    type Skipped
  } from '../lib/bundle.js';
  import { limitText } from '../lib/cloudLists.js';
  import { fewNames, nameOf } from '../lib/i18n.js';
  import { listName, listsErrorReport, listsRefusal, skipLine } from '../lib/importReport.js';
  import { plural } from '../lib/plural.js';
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

  /* A catalog record named in the language on screen, when the data knows it. */
  const recordName = (id: string): string | undefined => {
    const it = app.index?.byId.get(id);
    return it ? nameOf(it, app.lang) : undefined;
  };
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

  /* The held-key test for an entry without a snapshot, which imports only under a held key
     or its held derived key; the copy line and `importPlan` test a snapshot's copy apart. */
  const holdsNow = (): ((key: string) => boolean) => {
    const held = new Set((app.homebrew?.items ?? []).map((i) => i.key));
    return (key) => held.has(key) || held.has(app.ownKeyFor(key));
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
    } else {
      const r = listsRefusal(p);
      refuse(r.key, r.version);
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

  /* The error report: the file's own errors, then one block per list, in file order. */
  const refused = $derived.by(() => {
    if (view.kind !== 'errors') return null;
    const { errors, names } = view;
    return { ...listsErrorReport(errors, names, t, recordName), more: view.more };
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
    const lists = view.lists.map((l, i) => ({
      head: `${String(i + 1)}. ${listName(t, l.name)}`,
      size: l.entries.length
        ? plural(l.entries.length, t.importWillN, app.lang)
        : t.importListEmpty,
      skips: (byList.get(i) ?? []).map((s) => skipLine(s, t, recordName)),
      taken: held.has(l.name.trim())
    }));
    return lists.some((l) => l.skips.length || l.taken) ? lists : null;
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
    const mine = (key: string): boolean => !!own?.has(key) || planned.has(key);
    const unheld = new Set(
      lists.flatMap((l) =>
        l.entries.flatMap((e) =>
          e.source === 'homebrew' &&
          e.snapshot !== null &&
          !mine(e.item_key) &&
          !mine(app.ownKeyFor(e.item_key))
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
    app.closeErrorToast();
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
  <ImportFileRow
    {t}
    name="lists.json"
    schema="/schema/import-v3.json"
    pagesDir={app.pagesDir}
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
            {#if l.taken}<p class="taken">{t.importNameTaken}</p>{/if}
            {#if l.skips.length}
              <details class="skips">
                <summary>{t.importSkippedList.replace('%n', String(l.skips.length))}</summary>
                <ImportLines lines={l.skips} more={moreLines} cls="skip" />
              </details>
            {/if}
          </div>
        {/each}
        {#if report.length > LISTS_SHOWN}
          <div>
            <FoldButton
              open={allLists}
              more={plural(report.length - LISTS_SHOWN, t.importMoreLists, app.lang)}
              {t}
              ontoggle={() => {
                allLists = !allLists;
              }}
            />
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

  <p class="hint">{t.importFits}</p>
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
    font-size: var(--t-data);
  }

  .rep-list.bad {
    border-color: var(--danger);
    color: var(--danger-text);
  }

  .rep-list > b {
    display: block;
    font-size: var(--t-small);
    color: var(--txt);
  }

  .rep-list.bad > b {
    color: var(--danger-text);
  }

  .rep-list small {
    color: var(--muted2);
    font-size: var(--t-data);
  }

  .rep-list :global(code) {
    color: var(--gold-soft);
  }

  .rep-list.bad :global(code) {
    color: var(--danger-text);
  }

  .rep-list :global(.skip),
  .taken {
    color: var(--muted);
  }

  .taken {
    margin: 4px 0 0;
  }

  /* A list's skips are details on request (D6): closed on arrival, the count in the summary. */
  .skips {
    margin-top: 4px;
  }

  .skips summary {
    width: fit-content;
    color: var(--muted2);
    cursor: pointer;
  }

  .skips summary:hover {
    color: var(--txt);
  }

  @media screen and (max-width: 600px) {
    .skips summary {
      padding-block: max(0px, calc((var(--thumb) - 1lh) / 2));
      margin-block: min(0px, calc((1lh - var(--thumb)) / 2));
    }
  }

  /* The count of errors past the kept ones. */
  .rep-more {
    margin: 4px 0 0;
    font-size: var(--t-data);
    color: var(--danger-text);
  }

  .preview {
    margin: 12px 0 0;
    font-size: var(--t-small);
    line-height: 1.55;
  }

  /* A refused file: the error look of docs/specs/FEATURES.md, rule 19 - the danger border
     and text, no fill. */
  .errs {
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-sm);
    background: none;
    border: 1px solid var(--danger);
    color: var(--danger-text);
    font-size: var(--t-data);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .errs b {
    color: var(--danger-text);
    font-weight: 650;
    display: block;
  }

  .errs :global(code) {
    color: var(--danger-text);
  }

  .hint {
    margin: 10px 0 0;
    font-size: var(--t-data);
    color: var(--muted);
  }
</style>
