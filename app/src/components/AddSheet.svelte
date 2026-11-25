<script lang="ts">
  /* The add sheet of the share page: the bar's «В список» (the ticked entries with their
     taken counts) and an accepted request's toast (the lines as sent) both open it. The
     reader chooses the list each time, sees what the add does, and presses «Добавить»
     (docs/specs/FEATURES.md, "Purchase requests: the send"). Everything here is component
     state and starts fresh at each opening: nothing reaches the browser's storage. */
  import { tick, untrack } from 'svelte';
  import Button from './Button.svelte';
  import FoldButton from './FoldButton.svelte';
  import ListRows from './ListRows.svelte';
  import LoadState from './LoadState.svelte';
  import Sheet from './Sheet.svelte';
  import { NAME_MAX } from '../lib/cloudLists.js';
  import type { Msg } from '../lib/dict.js';
  import { countPiecesText, nameOf } from '../lib/i18n.js';
  import {
    copyMeta,
    pickerOrder,
    takenQty,
    takenRows,
    type ListEntryMeta,
    type StoredList,
    type TakenRow
  } from '../lib/lists.js';
  import { moneyMode, priceText } from '../lib/money.js';
  import { plural } from '../lib/plural.js';
  import type { AddSheetSource, AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    source: AddSheetSource;
  }

  const { app, source }: Props = $props();

  const t = $derived(app.t);
  const store = $derived(app.cloudLists);
  const taken = $derived(source.kind === 'taken' ? source : null);

  /* The lines and what each carries: the bar's ticked entries at their taken counts, or the
     request as it was sent. */
  const shared = $derived(app.shared);
  const metaOf = (id: string): ListEntryMeta => shared?.meta?.[id] ?? {};
  const ids = $derived([...app.sel]);
  const lines = $derived(
    taken
      ? taken.lines
      : ids.map((id) => ({ item: id, qty: takenQty(metaOf(id), app.picked.get(id)) }))
  );
  const carry = $derived<Readonly<Record<string, ListEntryMeta>>>(
    taken
      ? taken.carry
      : Object.fromEntries(
          lines.map(
            (l) => [l.item, { ...metaOf(l.item), qty: l.qty }] as [string, ListEntryMeta]
          )
        )
  );
  const pieces = $derived(lines.reduce((n, l) => n + l.qty, 0));
  const lead = $derived(
    (taken ? t.addSheetLeadTaken : t.addSheetLeadSel).replace(
      '%s',
      countPiecesText(lines.length, pieces, t.itemsN, app.lang, t)
    )
  );

  /* The account's lists, newest first. */
  const all = $derived<StoredList[]>(
    store?.status === 'ready' && app.newListTarget === 'cloud' ? store.lists : []
  );
  const sorted = $derived(pickerOrder(all, () => false));

  /* The choice: a list id, or a list still to make. None at each opening. */
  let chosenId = $state<string | null>(null);
  let making = $state(false);
  let draft = $state('');
  let pickQ = $state('');
  let diffOpen = $state(false);
  let copyOpen = $state(false);
  let copyPrice = $state(true);
  let copyNote = $state(true);
  let allLines = $state(false);
  let newInput = $state<HTMLInputElement | undefined>(undefined);
  let summaryEl = $state<HTMLElement | undefined>(undefined);

  const chosen = $derived(chosenId === null ? undefined : store?.get(chosenId));
  const detail = $derived(chosen && store ? store.detailOf(chosen.id) : 'absent');
  const target = $derived(making ? null : (chosen ?? null));
  const mode = $derived(moneyMode(target));
  /* The summary shows once the choice is known whole: a new list holds nothing to read. */
  const ready = $derived(making || (chosen !== undefined && detail === 'ready'));

  /* A list deleted elsewhere while the sheet is open leaves the choice. */
  $effect(() => {
    if (chosenId !== null && store?.status === 'ready' && !store.get(chosenId)) chosenId = null;
  });

  const writable = (key: string): boolean => app.sourceOf(key) !== null;
  const rows = $derived<TakenRow[]>(
    ready
      ? takenRows(
          making ? null : (chosen ?? null),
          lines,
          carry,
          (id) => app.knows(id),
          { price: copyPrice, note: copyNote },
          writable
        )
      : []
  );
  const fresh = $derived(rows.filter((r) => r.add > 0));
  const heldRows = $derived(rows.filter((r) => r.held));
  const refused = $derived(rows.some((r) => r.refused));
  const freshPieces = $derived(fresh.reduce((n, r) => n + r.add, 0));
  const refusal = $derived(app.hbRefusal()(t, app.lang));
  const chosenName = $derived(chosen?.name ?? '');

  const LINES_SHOWN = 5;
  const shownRows = $derived(allLines ? rows : rows.slice(0, LINES_SHOWN));

  const name = (id: string): string => {
    const it = app.recordFor(id);
    return it ? nameOf(it, app.lang) : id;
  };

  /* «2 шт. по 30 зол., ваша заметка останется»: what a held entry keeps. */
  function heldText(r: TakenRow): string {
    const h = r.held;
    if (!h) return '';
    let what = t.pcsN.replace('%n', String(h.qty));
    if (h.gold !== null) {
      what += ' ' + t.addSheetHeldPrice.replace('%s', priceText(h.gold, mode, app.lang));
    }
    if (h.note) what += ', ' + t.addSheetHeldNote;
    return t.addSheetHeld.replace('%s', () => what);
  }

  const priceOf = (r: TakenRow): string =>
    r.gold === null ? t.reqNoPrice : priceText(r.gold, mode, app.lang);

  function choose(l: StoredList): void {
    chosenId = l.id;
    making = false;
    if (store && store.detailOf(l.id) === 'absent') void store.detail([l.id]);
  }

  function openNew(): void {
    making = true;
    chosenId = null;
    draft = pickQ.trim();
    void tick().then(() => {
      newInput?.focus({ preventScroll: true });
      /* The rows box above can push the field under the foot or the keyboard. */
      if (typeof newInput?.scrollIntoView === 'function') {
        newInput.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  /* After the tick that draws the summary, the body scrolls it into view: a long list of
     lists must not push it under the foot. */
  $effect(() => {
    void chosenId;
    void making;
    void detail;
    const el = summaryEl;
    if (!el) return;
    void tick().then(() => {
      if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
    });
  });

  /* The sheet ends with no add when its source is gone: the reader signed out, the link
     stopped, or the selection emptied. A route change is `AppState`'s. */
  $effect(() => {
    const gone =
      app.newListTarget !== 'cloud' ||
      (source.kind === 'sel' && (!app.shared || app.sel.size === 0));
    if (gone) {
      untrack(() => {
        app.closeAddSheet('left');
      });
    }
  });

  const barButton = (): HTMLElement | null =>
    document.querySelector<HTMLElement>('.selbarwrap .seldrop > .btn');

  /* Escape, «Закрыть», the scrim and «Отмена»: no add. An offer's toast comes back and takes
     the focus; the bar's sheet returns the focus to «В список». */
  function close(): void {
    if (app.addSheet !== source) return;
    app.closeAddSheet('cancel');
    void tick().then(async () => {
      if (taken) {
        await tick();
        (
          document.querySelector<HTMLElement>('.toast.page .toast-act') ??
          document.getElementById('main')
        )?.focus();
      } else (barButton() ?? document.getElementById('main'))?.focus();
    });
  }

  function add(): void {
    const lists = store;
    if (!lists || app.addSheet !== source) return;
    const keys = lines.map((l) => l.item);
    const send = copyMeta(carry, { price: copyPrice, note: copyNote });
    let into: StoredList | undefined;
    const makes = making;
    if (makes) {
      if (!draft.trim()) {
        app.say((t) => t.nameFirst, { error: true });
        newInput?.focus({ preventScroll: true });
        return;
      }
      if (app.listsFull()) return;
      app.closeErrorToast();
      into = lists.create(draft);
      /* A failed add below leaves the sheet open on the list just made, not on a second one. */
      chosenId = into.id;
      making = false;
    } else into = chosen;
    if (!into || (!makes && detail !== 'ready')) return;
    const listName = into.name;
    const added = lists.add(into.id, keys, (id) => app.knows(id), send);
    if (!lists.saved) return;
    if (!added.length) {
      /* Nothing was written: a held key is skipped by design, a refused one says why. */
      if (refused) app.say(app.hbRefusal(), { error: true });
      return;
    }
    const count = keys.length > 1 ? added.length : null;
    const text: Msg = (t) =>
      t.addedTo.replace('%s', () => listName) + (count === null ? '' : ': ' + String(count));
    const token = app.requestToken;
    /* Read before the sheet closes: its deriveds end with its source. */
    const sent = lines;
    const sentCarry = carry;
    const fromBar = source.kind === 'sel';
    app.closeAddSheet('added');
    app.say(text);
    /* After an add from the bar, signed in and not the owner: «Сообщить владельцу?» or the
       remembered answer. An offer never asks: its items were sent already. */
    if (fromBar && app.user && token !== null) {
      app.requestSender?.afterAdd(token, sent, text, sentCarry);
    }
    /* Rule 20: «В список» takes the focus back; the owner question that replaced it, or an
       offer's gone toast button, leaves it to the question or to `#main`. */
    void tick().then(() => {
      const now = document.activeElement;
      if (now && now !== document.body && now.isConnected) return;
      ((fromBar ? barButton() : null) ?? document.getElementById('main'))?.focus();
    });
  }

  const addOff = $derived(!ready || fresh.length === 0);
</script>

<Sheet {app} label={t.addToList} title={t.addToList} onclose={close}>
  <p class="lead">{lead}</p>
  <div class="field listfield">
    <span class="lbl" id="addsheet-list">{t.addSheetList}</span>
    <ListRows
      {app}
      lists={sorted}
      mode="choose"
      idBase="addsheet"
      labelledby="addsheet-list"
      checked={(l: StoredList) => !making && l.id === chosenId}
      query={pickQ}
      onquery={(q: string) => {
        pickQ = q;
      }}
      onpick={choose}
      onnew={openNew}
      creating={making ? creating : undefined}
    />
  </div>
  {#if chosenId === null && !making}
    <p class="sum">{t.addSheetChoose}</p>
  {:else if !ready && store}
    <LoadState
      {t}
      failed={detail === 'error'}
      text={t.cloudLoadFailed}
      onretry={() => {
        if (chosenId !== null) void store.detail([chosenId]);
      }}
    />
  {:else}
    <div class="sum" bind:this={summaryEl}>
      {#if fresh.length}
        <p>
          {t.addSheetSummary.replace(
            '%s',
            countPiecesText(fresh.length, freshPieces, t.itemsN, app.lang, t)
          )}
        </p>
      {:else if heldRows.length}
        <p class="warn">{t.addSheetNothing.replace('%s', () => chosenName)}</p>
      {:else if refused}
        <p class="warn">{refusal}</p>
      {:else}
        <p>{t.addSheetSummary.replace('%s', countPiecesText(0, 0, t.itemsN, app.lang, t))}</p>
      {/if}
      {#if fresh.length && heldRows.length}
        <p class="warn">{plural(heldRows.length, t.addSheetHeldN, app.lang)}</p>
      {/if}
      {#if fresh.length && refused}
        <p class="warn">{refusal}</p>
      {/if}
    </div>
    <div class="folds">
      <Button
        variant="bare"
        size="sm"
        caret
        expanded={diffOpen}
        controls="addsheet-diff"
        onclick={() => {
          diffOpen = !diffOpen;
        }}>{t.addSheetDiff}</Button
      >
      {#if diffOpen}
        <div id="addsheet-diff">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.reqItem}</th>
                <th scope="col" class="n">{t.reqWas}</th>
                <th scope="col" class="n">{t.addSheetAdded}</th>
                <th scope="col" class="n">{t.reqBecomes}</th>
                <th scope="col" class="n wide">{t.reqPrice}</th>
              </tr>
            </thead>
            <tbody>
              {#each shownRows as r (r.item)}
                <tr>
                  <td>
                    {name(r.item)}
                    {#if r.held}
                      <span class="sub warn">{heldText(r)}</span>
                    {:else if r.refused}
                      <span class="sub warn">{refusal}</span>
                    {:else}
                      <span class="sub narrow">{priceOf(r)}</span>
                      {#if r.note}<span class="sub">{t.addSheetWithNote}</span>{/if}
                    {/if}
                  </td>
                  <td class="n" data-h={t.reqWas}
                    >{r.was === null ? t.requestNotInList : r.was}</td
                  >
                  <td class="n" data-h={t.addSheetAdded}>{r.add}</td>
                  <td class="n" data-h={t.reqBecomes}>{r.becomes}</td>
                  <td class="n wide" data-h={t.reqPrice}
                    >{r.held ? t.addSheetOwn : r.refused ? '' : priceOf(r)}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
          {#if rows.length > LINES_SHOWN}
            <FoldButton
              open={allLines}
              more={plural(rows.length - LINES_SHOWN, t.requestLinesMoreN, app.lang)}
              {t}
              ontoggle={() => {
                allLines = !allLines;
              }}
            />
          {/if}
        </div>
      {/if}
      <Button
        variant="bare"
        size="sm"
        caret
        expanded={copyOpen}
        controls="addsheet-copy"
        onclick={() => {
          copyOpen = !copyOpen;
        }}>{t.addSheetCopy}</Button
      >
      {#if copyOpen}
        <div id="addsheet-copy" class="toggles">
          <label><input type="checkbox" bind:checked={copyPrice} />{t.addSheetCopyPrice}</label>
          <label><input type="checkbox" bind:checked={copyNote} />{t.addSheetCopyNote}</label>
        </div>
      {/if}
    </div>
  {/if}
  {#snippet foot()}
    <Button size="sm" variant="ghost" onclick={close}>{t.cancel}</Button>
    <Button size="sm" variant="primary" disabled={addOff} onclick={add}>{t.addSheetAdd}</Button>
  {/snippet}
</Sheet>

{#snippet creating()}
  <input
    type="text"
    class="newname"
    bind:this={newInput}
    value={draft}
    placeholder={t.listNamePh}
    maxlength={NAME_MAX}
    aria-label={t.newList}
    oninput={(e) => {
      draft = e.currentTarget.value;
    }}
    onkeydown={(e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      add();
    }}
  />
{/snippet}

<style>
  .lead {
    margin: 0 0 12px;
    font-size: var(--t-small);
    color: var(--txt);
  }

  .field {
    margin-bottom: 12px;
  }

  .lbl {
    display: block;
    font-size: var(--t-label);
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 4px;
  }

  /* Only the rows scroll: the search box, «Новый список», the summary and the foot stay in
     reach (docs/specs/FEATURES.md, "Purchase requests: the send"). */
  .listfield :global(.pickchips) {
    max-height: min(30dvh, 340px);
    overflow: auto;
  }

  .newname {
    width: 100%;
    height: max(32px, var(--thumb));
    padding: 0 11px;
    border-radius: 8px;
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
    font-size: var(--t-data);
    box-sizing: border-box;
  }

  .newname:focus {
    outline: none;
    border-color: var(--gold);
  }

  @media (max-width: 600px) {
    /* 16 px: a smaller field makes iOS zoom the page on focus. */
    .newname {
      font-size: 16px;
    }
  }

  .sum {
    margin: 0 0 8px;
    font-size: var(--t-data);
    color: var(--txt);
    scroll-margin-bottom: 8px;
  }

  .sum p {
    margin: 0;
  }

  /* A held line, the summary's note and a refusal tell a fact and block nothing: the warning
     colour, not the error look (docs/specs/FEATURES.md, rule 19). */
  .warn {
    color: var(--warn-text);
  }

  .folds {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .folds > div {
    align-self: stretch;
    margin-bottom: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 4px 0;
    font-size: var(--t-data);
  }

  th {
    padding: 3px 0;
    text-align: left;
    font-size: var(--t-badge);
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  th.n {
    text-align: right;
    padding-left: 10px;
  }

  td {
    padding: 4px 0;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  td.n {
    text-align: right;
    white-space: nowrap;
    padding-left: 10px;
    font-variant-numeric: tabular-nums;
  }

  .sub {
    display: block;
    font-weight: 400;
    color: var(--muted);
  }

  .sub.warn {
    color: var(--warn-text);
  }

  /* From 601 px the price has its own column; up to 600 px it sits under the name, so the
     table keeps four short columns at 360 px. */
  .wide {
    display: none;
  }

  @media (min-width: 601px) {
    .wide {
      display: table-cell;
    }

    .narrow {
      display: none;
    }
  }

  .toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }

  .toggles label {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-height: var(--thumb);
    font-size: var(--t-data);
    color: var(--txt);
  }

  .toggles input {
    accent-color: var(--txt);
    width: 17px;
    height: 17px;
    margin: 0;
    cursor: pointer;
  }
</style>
