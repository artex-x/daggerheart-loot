<script lang="ts">
  /* The list page - `#/lists/<id>` - off `renderOneList`, `moneyPickerHTML`, `listRollPanel`,
   * `rolledNoteHTML`, `listRowHTML`, `listNoteHTML`, `notePairHTML`, the list handlers, the
   * copy, `contextNote`/`onListPage`, the live drag event model, the bar's actions
   * (`batchBarHTML`) and the money panel (`moneyPanelHTML`, `guessWhy`), all in
   * `git show 23c00a6^:app.js`. */
  import { onDestroy, tick, untrack } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import CompactRow from './CompactRow.svelte';
  import Die from './Die.svelte';
  import Empty from './Empty.svelte';
  import ErrorPage from './ErrorPage.svelte';
  import Field from './Field.svelte';
  import HelpBox from './HelpBox.svelte';
  import HelpButton from './HelpButton.svelte';
  import HitNote from './HitNote.svelte';
  import Icon from './Icon.svelte';
  import ListFind from './ListFind.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import NoData from './NoData.svelte';
  import NumberField from './NumberField.svelte';
  import NumRow from './NumRow.svelte';
  import OrGrid from './OrGrid.svelte';
  import LoadState from './LoadState.svelte';
  import MarkupField from './MarkupField.svelte';
  import PageTitle from './PageTitle.svelte';
  import PickQty from './PickQty.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordHost from './RecordHost.svelte';
  import RowMain from './RowMain.svelte';
  import RequestsPanel from './RequestsPanel.svelte';
  import SelectionBar from './SelectionBar.svelte';
  import SelMode from './SelMode.svelte';
  import SharePanel from './SharePanel.svelte';
  import Sheet from './Sheet.svelte';
  import StatusRegion from './StatusRegion.svelte';
  import SyncSaid from './SyncSaid.svelte';
  import SyncStatus from './SyncStatus.svelte';
  import QuickItem from './QuickItem.svelte';
  import { linkedOf, isCloudId, NAME_MAX, NOTE_MAX } from '../lib/cloudLists.js';
  import { withRecords } from '../lib/homebrew.js';
  import { sectionLabel, type Dict } from '../lib/dict.js';
  import { listFacetRows } from '../lib/facets.js';
  import {
    chosenCount,
    inForceOf,
    LIST_GROUPS,
    toggledFilter,
    type FilterState
  } from '../lib/filters.js';
  import type { MarkupTool } from '../lib/markupEdit.js';
  import { moneyHelpFor } from '../lib/help.js';
  import { sectionHash } from '../lib/hash.js';
  import { nameOf, selCountText } from '../lib/i18n.js';
  import { countOf } from '../lib/plural.js';
  import {
    gmOnlyCount,
    itemMeta,
    LIST_SEARCH_AT,
    narrowEntries,
    QTY_MAX,
    stockLeft,
    takenQty,
    takenTotal,
    type ListEntryMeta,
    type StoredList
  } from '../lib/lists.js';
  import {
    guessPrice,
    guessWhy,
    MONEY_MODES,
    moneyMode,
    priceText,
    reprice,
    totalParts,
    type MoneyMode
  } from '../lib/money.js';
  import { pick, rollLabel as rollLabelFor } from '../lib/roll.js';
  import { hayFor, parseQuery, statLineFor } from '../lib/search.js';
  import { entryNoteBlock, shareList, shareSelection } from '../lib/share.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);

  const route = $derived(app.route);
  const cloud = $derived(app.cloudLists);

  /** The route's list as the store holds it, its entries read or not. */
  const held = $derived.by((): StoredList | null => {
    const r = route;
    if (r.kind !== 'storedList') return null;
    return cloud?.get(r.listId) ?? null;
  });
  /** Whether the store holds the list's entries' details. */
  const detail = $derived(held && cloud ? cloud.detailOf(held.id) : 'absent');
  /** The list this address shows once its entries are read, or `null`. */
  const own = $derived(held && detail === 'ready' ? held : null);
  /* The page reads the list's entries once; after a failure only «Повторить» reads again. */
  $effect(() => {
    if (held && cloud && detail === 'absent') void cloud.detail([held.id]);
  });

  /* The records of the items the list links from other accounts join this page's index:
     the store's edits keep the object, so a note or a quantity typed keeps the index too. */
  const linkedMap = $derived(own ? linkedOf(own) : null);
  const index = $derived(
    app.index && linkedMap ? withRecords(app.index, [], Object.values(linkedMap)) : app.index
  );
  /* A `#/lists/<uuid>` the account store does not hold (yet). */
  const cloudAddress = $derived(
    route.kind === 'storedList' && isCloudId(route.listId) && cloud !== null
  );
  const byId = (id: string): Record_ | undefined => index?.byId.get(id);
  const items = $derived(
    own ? own.ids.map(byId).filter((it): it is Record_ => it != null) : []
  );
  /** The rows the page draws. A row with no record draws as the key and «Предмет не
   *  загружен»; the count, the roll and the position box count every stored entry
   *  (docs/specs/FEATURES.md, "Own items in lists"). */
  const rows = $derived.by((): { id: string; it: Record_ | null }[] =>
    own ? own.ids.map((id) => ({ id, it: byId(id) ?? null })) : []
  );
  const qtyById = $derived(
    Object.fromEntries((own?.ids ?? []).map((id) => [id, metaOf(id).qty ?? 0]))
  );
  /* Up to 760 px a row folds (docs/specs/FEATURES.md, "Lists"). */
  const narrow = $derived(app.band === 'narrow');

  /* The search and the filter: page memory, per list, never in the address
     (docs/specs/STATE.md, "Filters"). */
  let q = $state('');
  let facets = $state<FilterState>({});
  let filterOpen = $state(false);
  /* Latched per list, as on `#/s/`: the control that has the focus never leaves. */
  let finding = $state(false);
  let filterToggle = $state<HTMLButtonElement | undefined>(undefined);
  /* The compact rows a press unfolded, by entry id; memory only. */
  const openRows = new SvelteSet<string>();
  /* Up to 760 px the list notes and the roll open from the head. */
  let notesOpen = $state(false);
  let rollOpen = $state(false);
  const facRows = $derived(listFacetRows(items, t, app.lang));
  const inForce = $derived(inForceOf(facRows, facets));
  const terms = $derived(parseQuery(q));
  const statLine = $derived(statLineFor(app.lang, t));
  const hay = $derived(hayFor(statLine));
  const narrowed = $derived(terms.length > 0 || chosenCount(inForce, LIST_GROUPS) > 0);
  /** The rows drawn, each with `at`, its true place in the list. */
  const shownRows = $derived(narrowEntries(rows, inForce, terms, statLine, hay));
  $effect(() => {
    if (
      !finding &&
      own &&
      (own.ids.length >= LIST_SEARCH_AT || q !== '' || chosenCount(inForce, LIST_GROUPS) > 0)
    )
      finding = true;
  });
  /* An entry that leaves the list takes its unfolded mark with it. */
  $effect(() => {
    const ids = new Set(own?.ids ?? []);
    untrack(() => {
      for (const id of [...openRows]) if (!ids.has(id)) openRows.delete(id);
    });
  });

  function flipRow(id: string): void {
    if (openRows.has(id)) openRows.delete(id);
    else openRows.add(id);
  }

  function pickFacet(group: string, value: string): void {
    facets = toggledFilter(facRows, inForce, group, value);
  }

  /* Rule 20: «Сбросить всё» leaves with the empty state; the focus goes to «Фильтры», else
     the search box, else `#main`. */
  async function resetFromEmpty(): Promise<void> {
    q = '';
    facets = {};
    await tick();
    (
      (filterToggle?.isConnected ? filterToggle : null) ??
      document.querySelector<HTMLElement>('.lfind input[type="search"]') ??
      document.getElementById('main')
    )?.focus();
  }

  /* The page draws only signed in (an account list), so «Печать» always stores a set. */
  function pressPrint(): void {
    if (own) void app.print([...own.ids], qtyById);
  }

  /* Local state. `roll` is the live `S.listRoll.n` for this list, but kept in
     the component rather than in app memory - a recorded difference (a roll
     made, then a navigation away and back, shows an empty field here and the
     result there); `noteOpen` is the live `S.keepOpen['rnote:...']`, a
     person's own fold/unfold per entry. `guess` and `rp` are the live
     `S.guess`/`S.rp` (default `false`/`-20`) the same way: the panel's own
     open state and a typed percentage forget themselves on a navigation away
     and back here, where the live app's app-wide memory keeps them.
     `dragId`/`dragMark` have no live counterpart at all - they exist only
     to drive the three drag classes off the port's callbacks, since Svelte
     drops a scoped rule no template element can match and `npm run check`
     fails it as dead CSS if the port toggled them itself. */
  const lsel = new SvelteSet<string>();
  /* A ticked row's taken count, when the person narrowed it below the stock
     - the twin of `app.picked` for this page's own selection, cleared with
     it. */
  const picked = new SvelteMap<string, number>();

  /* Back/Forward between two different list addresses does not remount
     this component - Svelte only remounts between two different *route
     kinds* - so `lsel` and the open batch bar used to survive a history move
     onto a different list entirely, showing the previous list's ticks over
     rows that were never ticked. `app.navigations` is the same signal
     `TablesPage`/`SearchPage` already watch for the equivalent case. */
  $effect(() => {
    void app.navigations;
    lsel.clear();
    picked.clear();
    said = '';
  });

  let roll = $state(0);
  let moneyHelp = $state(false);
  let guess = $state(false);
  let rp = $state(-20);
  const noteOpen = new SvelteMap<string, boolean>();
  let rowsEl = $state<HTMLDivElement | undefined>(undefined);
  /* The id of the entry being dragged, captured when the drag starts. */
  let dragId = $state<string | null>(null);
  let dragMark = $state<{ over: number; where: 'before' | 'after' } | null>(null);
  let said = $state('');

  /* "after 3" and "before 4" are one insertion point, so both sides of the
     gap light. `dropGap` is the number of rows above that place. */
  const dropGap = $derived(
    dragMark === null ? -1 : dragMark.where === 'before' ? dragMark.over : dragMark.over + 1
  );

  const hit = $derived(roll >= 1 && roll <= rows.length ? (rows[roll - 1]?.it ?? null) : null);
  const rollLabel = $derived(rollLabelFor(rows.length, t));

  const mode = $derived(moneyMode(own));
  const priced = $derived.by((): boolean => {
    const l = own;
    return l ? l.ids.some((id) => (itemMeta(l, id).gold ?? 0) > 0) : false;
  });

  /** The ticked ids, in list order - the live `batchBarHTML`'s own `ids`. */
  const ticked = $derived(own ? own.ids.filter((id) => lsel.has(id)) : []);
  const pricedCount = $derived(ticked.filter((id) => (metaOf(id).gold ?? 0) > 0).length);
  const takenOf = (id: string): number => takenQty(metaOf(id), picked.get(id));
  const taken = $derived(takenTotal(ticked, metaOf, takenOf));
  const total = $derived(totalParts(taken, mode, app.lang, t));
  const gmN = $derived(gmOnlyCount(own?.ids ?? [], metaOf));
  const tickedShown = $derived(ticked.length - gmOnlyCount(ticked, metaOf));

  /** The live `hidden` default (no note → hidden), with a person's own
   *  fold/unfold winning once they have touched it - the live `keepOpen`. */
  function boxHidden(id: string, meta: ListEntryMeta): boolean {
    return noteOpen.has(id) ? !noteOpen.get(id) : !(meta.note || meta.hnote);
  }

  function metaOf(id: string): ListEntryMeta {
    return own ? itemMeta(own, id) : {};
  }

  /** The price field's conversion hint - empty in coin mode, where there is
   *  nothing to translate. */
  function goldText(coins: number): string {
    return coins > 0 && mode !== 'coin' ? priceText(coins, mode, app.lang) : '';
  }

  /* ---------- handlers, each the live one by line ---------- */

  function rename(e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    if (own) cloud?.rename(own.id, el.value);
  }

  async function copyList(): Promise<void> {
    const l = own;
    if (!l || !index) return;
    const { text, html } = shareList(l, index, app.lang, t);
    await app.copied(
      () => app.env.clipboard.writeRich({ html, plain: text }),
      (t) => t.listCopied
    );
  }

  function del(): void {
    const l = own;
    if (!l) return;
    const name = l.name;
    /* For good: the confirm names the share links, and there is no undo. */
    if (!app.env.dialog.confirm(t.deleteCloudConfirm.replace('%s', l.name))) return;
    cloud?.remove(l.id);
    app.go('#/lists');
    app.say((t) => t.listDeleted.replace('%s', name));
  }

  function pickMoney(mode2: MoneyMode): void {
    if (own) cloud?.setMoney(own.id, mode2);
  }

  function toggleMoneyHelp(): void {
    moneyHelp = !moneyHelp;
  }

  /* Auto-size: the module-level rule (`git show 23c00a6^:app.js`) - skip a hand-resized
     or hidden box, otherwise grow to content up to the ceiling. */
  function autoSize(ta: HTMLTextAreaElement | null | undefined): void {
    if (!ta || ta.dataset['manual']) return;
    if (!ta.offsetParent) return;
    ta.style.height = 'auto';
    const frame = ta.offsetHeight - ta.clientHeight;
    ta.style.height = `${String(Math.min(ta.scrollHeight + frame, 320))}px`;
  }

  /** The list note (`key === 'list'`) writes through `setNote`; an entry
   *  note (`key` is the entry's id) writes through `setMeta`, trimmed - the
   *  live app trims the entry note on input but not the list note (`setNote`
   *  trims it itself, on write). */
  function noteInput(key: string, kind: 'note' | 'hnote', e: Event): void {
    const el = e.currentTarget as HTMLTextAreaElement;
    autoSize(el);
    const l = own;
    if (!l) return;
    if (key === 'list') cloud?.setNote(l.id, kind, el.value);
    else cloud?.setMeta(l.id, key, kind, el.value.trim());
  }

  /** The live `data-note-clear` handler (`git show 23c00a6^:app.js`): empty the sibling
   *  textarea through a synthetic `input` event, so the same handler above
   *  updates the model, the storage and the address - no second copy of that
   *  logic here. The undo writes through the store instead: clearing a row's
   *  only note unmounts its box, and an event on a detached textarea reaches
   *  no handler (Svelte delegates `input` to the root). */
  function clearNote(key: string, kind: 'note' | 'hnote', e: MouseEvent): void {
    const btn = e.currentTarget as HTMLElement;
    const ta = btn.closest('.nfield')?.querySelector('textarea');
    const l = own;
    if (!ta || !l) return;
    const was = ta.value;
    if (!was) return;
    const at = cloud;
    if (!at) return;
    const listId = l.id;
    ta.value = '';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    app.say((t) => t.noteCleared, {
      action: {
        label: (t) => t.undo,
        run: () => {
          if (key === 'list') {
            at.setNote(listId, kind, was);
            return;
          }
          /* An entry another tab removed meanwhile gets no meta back. */
          if (at.get(listId)?.ids.includes(key)) at.setMeta(listId, key, kind, was.trim());
        }
      }
    });
  }

  /** The live `data-note-toggle` handler (`git show 23c00a6^:app.js`): flip the box,
   *  remember the person's own choice, and - only on the way open - focus its
   *  first textarea once Svelte has mounted it (the box sizes itself). */
  function toggleNote(id: string, at: number): void {
    const row = rowsEl?.querySelector(`.lrow[data-index="${String(at)}"]`);
    const wasHidden = boxHidden(id, metaOf(id));
    noteOpen.set(id, wasHidden);
    if (wasHidden && row) {
      void tick().then(() => {
        row.querySelector<HTMLTextAreaElement>('.rnote textarea')?.focus();
      });
    }
  }

  /** The live `data-remove` handler (`git show 23c00a6^:app.js`): remember everything
   *  needed to put the entry back exactly where it was, then offer to. */
  function removeEntry(id: string, it: Record_ | null, i: number): void {
    const l = own;
    if (!l) return;
    const meta = { ...itemMeta(l, id) };
    const listId = l.id;
    const into = cloud;
    if (!into) return;
    into.removeEntry(listId, id);
    app.say((t, lang) => t.removedItem.replace('%s', it ? nameOf(it, lang) : id), {
      action: {
        label: (t) => t.undo,
        run: () => {
          into.restoreEntry(listId, id, i, meta);
        }
      }
    });
  }

  /** The live `change` handler on the position field (`git show 23c00a6^:app.js`): an
   *  out-of-range or non-numeric value is rejected by putting the field's own
   *  position back - there is nothing to re-render to, since the value is
   *  already right. */
  function setPos(id: string, i: number, e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    const l = own;
    if (!l) return;
    const n = parseInt(el.value, 10);
    if (!(n >= 1) || n > l.ids.length) {
      el.value = String(i + 1);
      return;
    }
    if (cloud?.move(l.id, id, n - 1)) announceMove(id, n - 1);
  }

  /** Fills the live region with the record's new position, after a move that
   *  actually happened. Both facts are plain nominals - a name and two
   *  numbers - so no Russian word has to agree with the record's gender
   *  (docs/specs/I18N.md, "Rules"). */
  function announceMove(id: string, to: number): void {
    const l = own;
    const it = byId(id);
    if (!l) return;
    said = t.movedItem
      .replace('%s', it ? nameOf(it, app.lang) : id)
      .replace('%n', String(to + 1))
      .replace('%m', String(l.ids.length));
  }

  /* Held to 0..QTY_MAX, the most an entry stores, so the stored stock and the field
     never disagree. The field is written back because a clamp
     that stores an unchanged value draws nothing new ("99" then "0"). */
  function setQty(id: string, e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    const typed = parseInt(el.value, 10) || 0;
    const qty = Math.max(0, Math.min(typed, QTY_MAX));
    if (qty !== typed) el.value = qty ? String(qty) : '';
    if (own) cloud?.setMeta(own.id, id, 'qty', qty);
  }
  function setGold(id: string, e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    if (own) cloud?.setMeta(own.id, id, 'gold', parseInt(el.value, 10) || 0);
  }

  function rollNow(): void {
    roll = pick(rows.length, app.env.random);
  }
  function setRoll(n: number): void {
    roll = n;
  }
  function clearRoll(): void {
    roll = 0;
  }

  function pickRow(id: string, on: boolean): void {
    if (on) lsel.add(id);
    else {
      lsel.delete(id);
      picked.delete(id);
    }
  }
  /* «Все» ticks the drawn rows only. */
  function pickAll(on: boolean): void {
    lsel.clear();
    picked.clear();
    if (on) for (const row of shownRows) lsel.add(row.id);
  }

  /* A tick the search or the filter hides leaves the selection, so the bar never deletes a
     row out of sight (docs/specs/FEATURES.md, "Account and browser lists"). */
  $effect(() => {
    const shown = new Set(shownRows.map((r) => r.id));
    untrack(() => {
      for (const id of [...lsel]) {
        if (!shown.has(id)) {
          lsel.delete(id);
          picked.delete(id);
        }
      }
    });
  });

  /* The selection mode: the ticks draw only in it, and its bar is this page's own, drawn
     in the bar's one place through `app.pageBar`. Leaving it drops the ticks. */
  $effect(() => {
    if (app.selecting) return;
    untrack(() => {
      lsel.clear();
      picked.clear();
      guess = false;
    });
  });
  $effect(() => {
    const on = !!own && app.selecting;
    untrack(() => {
      app.pageBar = on ? listBar : null;
    });
  });
  onDestroy(() => {
    app.pageBar = null;
  });

  /* «Выбрать» opens the mode; the focus moves to the bar's «Все». */
  async function startSelecting(): Promise<void> {
    app.pageBar = listBar;
    app.selecting = true;
    await tick();
    document.querySelector<HTMLElement>('.selbarwrap .selall input')?.focus();
  }

  /* «Снять выделение» leaves it; the focus returns to «Выбрать», else `#main`. */
  async function leaveSelecting(): Promise<void> {
    app.clearSel();
    await tick();
    (
      document.querySelector<HTMLElement>('button.selmode') ?? document.getElementById('main')
    )?.focus();
  }

  /** Copies the ticked rows, in list order, with each taken count and unit
   *  price and the total line - the shared page's bar copy, on this page. */
  async function copyTicked(): Promise<void> {
    if (!index) return;
    const recs = ticked.map(byId).filter((it): it is Record_ => it != null);
    if (!recs.length) return;
    const { text, html } = shareSelection(recs, index, app.lang, { metaOf, takenOf, mode, t });
    await app.copied(
      () => app.env.clipboard.writeRich({ html, plain: text }),
      (t) => t.selCopied
    );
  }

  /* ---------- the actions under a ticked selection (`git show 23c00a6^:app.js`) ---------- */

  let guessBtn = $state<HTMLButtonElement | undefined>(undefined);
  function toggleGuess(): void {
    guess = !guess;
  }
  /* The price sheet closes with the last tick. */
  $effect(() => {
    if (!ticked.length) guess = false;
  });
  /* Rule 20: the sheet's close returns the focus to «Цены». */
  function closeGuess(): void {
    guess = false;
    void tick().then(() => {
      guessBtn?.focus();
    });
  }

  /**
   * The shape all three batch price actions below repeated: for every
   * ticked row, ask `next(id)` for a new gold value - `undefined` skips the
   * row (no eligible price, or nothing to change) - remember what it was,
   * write it, and if anything actually changed, toast `msg(n, t)` with an undo
   * that puts every touched row's old value back. Returns how many rows
   * changed, since `applyGuess` alone has a further thing to do only on
   * success (fold its own panel).
   */
  function goldEdit(
    next: (id: string) => number | undefined,
    msg: (n: number, t: Dict) => string
  ): number {
    const l = own;
    if (!l) return 0;
    const into = cloud;
    if (!into) return 0;
    const before: Record<string, number> = {};
    let n = 0;
    for (const id of ticked) {
      const v = next(id);
      if (v === undefined) continue;
      before[id] = metaOf(id).gold ?? 0;
      into.setMeta(l.id, id, 'gold', v);
      n++;
    }
    if (n) {
      app.say((t) => msg(n, t), {
        action: {
          label: (t) => t.repriceUndo,
          run: () => {
            for (const [id, gold] of Object.entries(before))
              into.setMeta(l.id, id, 'gold', gold);
          }
        }
      });
    }
    return n;
  }

  /** The live `data-guess-apply` handler: every ticked row a band
   *  can be guessed for gets its gold set to the guessed price. */
  function applyGuess(): void {
    if (!index) return;
    const idx = index;
    const n = goldEdit(
      (id) => {
        const it = byId(id);
        const v = it ? guessPrice(it, idx.rarityOf) : 0;
        return v || undefined;
      },
      (count, t) => `${t.guessDone} (${String(count)})`
    );
    if (n) closeGuess();
  }

  /** The live `data-reprice` handler: every ticked, priced row
   *  shifts by `rp` percent. */
  function repriceTicked(): void {
    if (!rp) return;
    const pct = rp;
    goldEdit(
      (id) => {
        const gold = metaOf(id).gold ?? 0;
        return gold > 0 ? reprice(gold, pct) : undefined;
      },
      (n, t) => `${t.repriceDone} (${pct > 0 ? '+' : ''}${String(pct)}%, ${String(n)})`
    );
  }

  /** The live `data-batch-clearprice` handler: every ticked,
   *  priced row loses its price. */
  function clearPrices(): void {
    goldEdit(
      (id) => {
        const gold = metaOf(id).gold ?? 0;
        return gold > 0 ? 0 : undefined;
      },
      (_, t) => t.batchNoPrice
    );
  }

  /** The live `data-batch-del` handler, by the taken count: a
   *  row taken whole leaves the list, a row taken in part keeps the rest of
   *  its stock. Remembers every ticked row's own position and meta, so the
   *  one undo puts a removed row back exactly where it was and gives a
   *  lowered row its stock back. */
  function batchDelete(): void {
    const l = own;
    if (!l) return;
    const gone: { id: string; at: number; meta: ListEntryMeta; left: number }[] = [];
    l.ids.forEach((id, i) => {
      if (!lsel.has(id)) return;
      const meta = { ...itemMeta(l, id) };
      gone.push({ id, at: i, meta, left: stockLeft(meta, takenOf(id)) });
    });
    if (!gone.length) return;
    const into = cloud;
    if (!into) return;
    for (const g of gone) {
      if (g.left > 0) into.setMeta(l.id, g.id, 'qty', g.left > 1 ? g.left : 0);
      else into.removeEntry(l.id, g.id);
    }
    lsel.clear();
    picked.clear();
    const n = gone.length;
    app.say((t) => `${t.batchDeleted} (${String(n)})`, {
      action: {
        label: (t) => t.undo,
        run: () => {
          for (const g of gone) {
            if (g.left > 0) into.setMeta(l.id, g.id, 'qty', g.meta.qty ?? 0);
            else into.restoreEntry(l.id, g.id, g.at, g.meta);
          }
        }
      }
    });
  }

  /** The bar's «Скрыть от игроков» / «Показать игрокам»: hides every ticked
   *  entry while any of them is shown to players, else shows them all. Keeps
   *  the ticks; the undo puts back only the entries the press changed. */
  function gmOnlyTicked(): void {
    const l = own;
    if (!l || !cloud) return;
    const into = cloud;
    const listId = l.id;
    const on = tickedShown > 0;
    const changed = ticked.filter((id) => (metaOf(id).gmOnly === true) !== on);
    for (const id of changed) into.setGmOnly(listId, id, on);
    const n = changed.length;
    if (!n) return;
    app.say((t) => (on ? t.gmOnlyHidden : t.gmOnlyShown).replace('%n', String(n)), {
      action: {
        label: (t) => t.undo,
        run: () => {
          for (const id of changed) into.setGmOnly(listId, id, !on);
        }
      }
    });
  }

  /* Drag through the `nativeDrag` port's live event model (`git show 23c00a6^:app.js`):
     the port owns every listener and the edge-scroll loop, and reports back
     which row is being dragged and where it would land so the template can
     drive the three classes below off state rather than off a class the port
     would have to toggle itself. Keyed on the list's id, not the list, so a
     storage merge mid-drag does not unbind a live drag; the drop moves the
     id captured at `dragstart`, not whatever row now sits at its index. */
  const ownId = $derived(own?.id);
  /* A hand-resized note box's height by its id (`note-<key>-<kind>`), so a
     row's box that unmounts on a fold keeps the height when it comes back. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- read at a box's mount, never drawn
  const handHeight = new Map<string, string>();
  const NOTE_TOOLS: readonly MarkupTool[] = ['bold', 'italic', 'ul', 'ol'];
  /* A note box's text while the person edits it, by box id; memory only. */
  const drafts = new SvelteMap<string, string>();
  /* The note boxes whose «?» hint is open, by box id. */
  const noteHelp = new SvelteSet<string>();
  /* The rows whose price «?» shows its conversion, by entry id. */
  const priceHelp = new SvelteSet<string>();
  /* The share and own-item panels fold when another list opens, and the hand
     heights, keyed by record id, belong to the list that set them. */
  let sharing = $state(false);
  let quick = $state(false);
  let quickBtn = $state<HTMLElement | undefined>(undefined);
  $effect(() => {
    void ownId;
    sharing = false;
    quick = false;
    q = '';
    facets = {};
    filterOpen = false;
    finding = false;
    openRows.clear();
    notesOpen = false;
    rollOpen = false;
    handHeight.clear();
    drafts.clear();
    noteHelp.clear();
    priceHelp.clear();
  });
  $effect(() => {
    const el = rowsEl;
    const listId = ownId;
    if (!el || !listId) return;
    return app.env.drag.bind(el, {
      onDrop: (_from, to) => {
        const id = dragId;
        if (id !== null && cloud?.move(listId, id, to)) announceMove(id, to);
      },
      onDrag: (from) => {
        dragId = rows[from]?.id ?? null;
      },
      onOver: (over, where) => {
        dragMark = where ? { over, where } : null;
      },
      onEnd: () => {
        dragId = null;
        dragMark = null;
      }
    });
  });

  /* The live `pointerdown`/`pointerup` pair (`git show 23c00a6^:app.js`): a box whose
     height actually changed between the two is the person's own resize, and
     auto-sizing must not undo it on the next keystroke. */
  $effect(() => {
    let dragging: { ta: HTMLTextAreaElement; h: number } | null = null;
    const sel = '.lnote textarea, .rnote textarea';
    const onDown = (e: PointerEvent): void => {
      const ta = (e.target as HTMLElement).closest<HTMLTextAreaElement>(sel);
      dragging = ta ? { ta, h: ta.offsetHeight } : null;
    };
    const onUp = (): void => {
      const d = dragging;
      dragging = null;
      if (!d || !d.ta.isConnected || d.ta.offsetHeight === d.h) return;
      d.ta.dataset['manual'] = '1';
      if (d.ta.id) handHeight.set(d.ta.id, d.ta.style.height);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
    };
  });

  /* The store trims a note on write, so a box keeps the person's text as a draft while
     it has focus; a stored change from elsewhere replaces it only in a box without focus. */
  function noteBox(
    node: HTMLElement,
    text: string
  ): { update(v: string): void; destroy(): void } {
    let last = text;
    const ta = node.querySelector('textarea');
    const id = ta?.id ?? '';
    /* A focused box holds a draft from its first focus, so a stored change cannot reach it. */
    const hold = (): void => {
      if (ta && !drafts.has(id)) drafts.set(id, ta.value);
    };
    /* Leaving the box shows the stored note when another write landed during the focus. */
    const settle = (e: FocusEvent): void => {
      if (node.contains(e.relatedTarget as Node | null)) return;
      const draft = drafts.get(id);
      if (!ta || draft === undefined || draft.trim() === last) return;
      drafts.delete(id);
      void tick().then(() => {
        autoSize(ta);
      });
    };
    node.addEventListener('focusin', hold);
    node.addEventListener('focusout', settle);
    /* Each box sizes itself at mount and on a write: a walk over every box on
       each edit of the list cost every keystroke a layout read per box. */
    void tick().then(() => {
      if (!ta) return;
      const h = handHeight.get(id);
      if (h) {
        ta.style.height = h;
        ta.dataset['manual'] = '1';
      } else autoSize(ta);
    });
    return {
      update(v: string) {
        if (v === last) return;
        last = v;
        if (!ta || node.contains(document.activeElement)) return;
        const draft = drafts.get(id);
        if (draft !== undefined && draft.trim() !== v) drafts.delete(id);
        void tick().then(() => {
          autoSize(ta);
        });
      },
      destroy() {
        node.removeEventListener('focusin', hold);
        node.removeEventListener('focusout', settle);
        drafts.delete(id);
      }
    };
  }
</script>

{#snippet noteField(
  o: { note?: string | undefined; hnote?: string | undefined },
  key: string,
  kind: 'note' | 'hnote'
)}
  {@const id = `note-${key}-${kind}`}
  {@const caption = kind === 'note' ? t.notePub : t.noteHid}
  {@const stored = (kind === 'note' ? o.note : o.hnote) ?? ''}
  <div
    class="nfield"
    class:n-pub={kind === 'note'}
    class:n-hid={kind === 'hnote'}
    use:noteBox={stored}
  >
    <span class="nlbl"
      ><Icon name={kind === 'note' ? 'eye' : 'eyeOff'} /><label for={id}>{caption}</label><i
        id="{id}-hint">{kind === 'note' ? t.notePubHint : t.noteHidHint}</i
      ><HelpButton
        lang={app.lang}
        size="sm"
        open={noteHelp.has(id)}
        label={t.fieldHelp.replace('%s', caption)}
        controls="{id}-help"
        onclick={() => {
          if (noteHelp.has(id)) noteHelp.delete(id);
          else noteHelp.add(id);
        }}
      /><button
        type="button"
        class="note-x"
        title={t.noteClear}
        aria-label={t.noteClear}
        onclick={(e) => {
          clearNote(key, kind, e);
        }}>&times;</button
      ></span
    >
    <p class="nhelp" id="{id}-help" hidden={!noteHelp.has(id)}>
      {t.mdHelp.replace('%n', String(NOTE_MAX))}
    </p>
    <MarkupField
      bind:value={
        () => drafts.get(id) ?? stored,
        (v: string) => {
          drafts.set(id, v);
        }
      }
      {id}
      rows={3}
      maxlength={NOTE_MAX}
      placeholder={kind === 'note'
        ? key === 'list'
          ? t.listNotePhPub
          : t.notePhPub
        : key === 'list'
          ? t.listNotePhHid
          : t.notePhHid}
      describedby="{id}-hint"
      label={caption}
      tools={NOTE_TOOLS}
      preview
      {t}
      oninput={(e: Event) => {
        noteInput(key, kind, e);
      }}
    />
  </div>
{/snippet}

{#snippet notePair(o: { note?: string | undefined; hnote?: string | undefined }, key: string)}
  <div class="npair">
    <!-- eslint-disable @typescript-eslint/no-confusing-void-expression -->
    {@render noteField(o, key, 'note')}
    {@render noteField(o, key, 'hnote')}
    <!-- eslint-enable @typescript-eslint/no-confusing-void-expression -->
  </div>
{/snippet}

<!-- The owner's selection bar, drawn by `SelBar` through `app.pageBar` (a top-level snippet,
     so the script can hand it over): the ticks are this page's own. -->
{#snippet listBar()}
  {#if own}
    <SelectionBar
      label={t.selRegion}
      total={shownRows.length}
      picked={ticked.length}
      allLabel={t.selectAll}
      allText={t.allShort}
      count={selCountText(ticked.length, taken.pieces, app.lang, t)}
      clearText={t.clearSel}
      onall={pickAll}
      onclear={() => void leaveSelecting()}
    >
      {#snippet summary()}{#if total}<span class="batch-total"
            >{total.label} <b>{total.value}</b>&#32;{#if total.unpriced}
              <span class="np">{total.unpriced}</span>{/if}</span
          >{/if}{/snippet}
      {#snippet actions()}
        <Button
          size="sm"
          on={guess}
          caret
          expanded={guess}
          disabled={!ticked.length}
          bind:el={guessBtn}
          onclick={toggleGuess}>{t.batchMoney}</Button
        >
        {#if narrow}
          <span class="bulkmore">
            <MoreMenu {app} id="list-bulk" up size="sm" disabled={!ticked.length}>
              {#snippet children(close: () => void)}
                <button
                  type="button"
                  role="menuitem"
                  tabindex="-1"
                  onclick={() => {
                    close();
                    void copyTicked();
                  }}><Icon name="copy" />{t.copyText}</button
                >
                <button
                  type="button"
                  role="menuitem"
                  tabindex="-1"
                  onclick={() => {
                    close();
                    gmOnlyTicked();
                  }}
                  >{(tickedShown > 0 ? t.gmOnlyHide : t.gmOnlyShow).replace(
                    '%n',
                    String(ticked.length)
                  )}</button
                >
                <div role="separator" class="msep"></div>
                <button
                  type="button"
                  role="menuitem"
                  tabindex="-1"
                  class="danger"
                  onclick={() => {
                    close();
                    batchDelete();
                  }}>{t.del} ({String(ticked.length)})</button
                >
              {/snippet}
            </MoreMenu>
          </span>
        {:else}
          <Button size="sm" disabled={!ticked.length} onclick={() => void copyTicked()}
            ><Icon name="copy" />{t.copyText}</Button
          >
          <Button size="sm" disabled={!ticked.length} onclick={gmOnlyTicked}
            >{(tickedShown > 0 ? t.gmOnlyHide : t.gmOnlyShow).replace(
              '%n',
              String(ticked.length)
            )}</Button
          >
          <Button size="sm" variant="danger" disabled={!ticked.length} onclick={batchDelete}
            >{t.del} ({String(ticked.length)})</Button
          >
        {/if}
      {/snippet}
    </SelectionBar>
  {/if}
{/snippet}

<!-- A list this account does not hold (A18): signed out, the sign-in; signed in, the
     account it was looked for in (docs/specs/FEATURES.md, "Lists"). -->
{#snippet gone()}
  {#if app.user}
    {@const email = app.user.email}
    <ErrorPage title={t.listGoneAccount}>
      {email
        ? `${t.listGoneAccountSub} ${t.listGoneAs.replace('%s', () => email)}`
        : t.listGoneAccountSub}
      {#snippet actions()}
        <Button variant="primary" href={app.href(sectionHash('lists'))} sameTab
          >{sectionLabel('lists', t)}</Button
        >
        <Button href={app.href(sectionHash('tables'))} sameTab>{t.openTables}</Button>
      {/snippet}
    </ErrorPage>
  {:else}
    <ErrorPage title={t.listGoneSignedOut}>
      {t.listGoneSignedOutSub}
      {#snippet actions()}
        <Button
          variant="primary"
          onclick={() => {
            app.askSignIn({ hash: app.hash });
          }}>{t.signIn}</Button
        >
        <Button href={app.href(sectionHash('tables'))} sameTab>{t.openTables}</Button>
      {/snippet}
    </ErrorPage>
  {/if}
{/snippet}

<RecordHost {app} {index} extra={(it: Record_) => entryNoteBlock(metaOf(it.id), t)}>
  {#snippet children(openRecord: (it: Record_) => void)}
    {#if !index}
      <NoData>{t.noData}</NoData>
    {:else if !own}
      {#if cloudAddress && app.user === null}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render gone()}
      {:else if cloudAddress && cloud?.status === 'error'}
        <PageTitle title={t.sharedFailed} />
        <LoadState
          {t}
          failed
          page
          text={t.cloudLoadFailed}
          onretry={() => void app.retryLists()}
        />
      {:else if held && detail === 'error'}
        <PageTitle title={t.sharedFailed} />
        <LoadState
          {t}
          failed
          page
          text={t.cloudLoadFailed}
          onretry={() => void cloud?.detail([held.id])}
        />
      {:else if held}
        <!-- The page waits for the list's entries; the name is the heading, so none is drawn. -->
        <LoadState
          {t}
          failed={false}
          text={t.cloudLoadFailed}
          onretry={() => void cloud?.detail([held.id])}
        />
      {:else if cloudAddress && app.user === undefined}
        <!-- The session is not known yet: nothing, so neither the sign-in line
             nor "not found" flashes. -->
      {:else if cloudAddress && cloud?.status !== 'ready'}
        <!-- The account is still answering. The list's name is the heading, so none is
             drawn, as on `#/s/`. -->
        <LoadState
          {t}
          failed={false}
          text={t.cloudLoadFailed}
          onretry={() => void app.retryLists()}
        />
      {:else}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render gone()}
      {/if}
    {:else}
      <!-- The heading shows only the rename input; an account list's heading holds
       the name as visually hidden text too, so the outline names it (rule 16). -->
      {#snippet renameTitle()}
        <span class="vh" id="list-name">{own.name}</span><input
          type="text"
          class="titleinput"
          value={own.name}
          maxlength={NAME_MAX}
          aria-label={t.rename}
          oninput={rename}
        />
      {/snippet}
      {#snippet cloudSub()}
        {narrowed
          ? t.shownOf.replace('%n', String(shownRows.length)).replace('%m', String(rows.length))
          : countOf(own.ids.length, cloud?.entryLimit ?? null, t.itemsN, app.lang, t.ofLimit)} ·
        {#if gmN > 0}{`${t.gmOnlyN.replace('%n', String(gmN))} · `}{/if}<SyncStatus
          {app}
        />{#if narrow}&#32;·&#32;<button
            type="button"
            class="lnkb"
            aria-expanded={notesOpen}
            onclick={() => {
              notesOpen = !notesOpen;
            }}>{t.listNote}<Icon name="chevron" /></button
          >{/if}
      {/snippet}
      {#snippet listMore()}
        <MoreMenu {app} id="list-more" size="sm">
          {#snippet children(close: () => void)}
            {#if narrow}
              <button
                type="button"
                role="menuitem"
                tabindex="-1"
                onclick={() => {
                  close();
                  sharing = !sharing;
                }}><Icon name="link" />{t.share}</button
              >
              {#if items.length}
                <button
                  type="button"
                  role="menuitem"
                  tabindex="-1"
                  disabled={app.printing}
                  onclick={() => {
                    close();
                    pressPrint();
                  }}><Icon name="print" />{t.print}</button
                >
              {/if}
              {#if rows.length > 1}
                <button
                  type="button"
                  role="menuitem"
                  tabindex="-1"
                  onclick={() => {
                    close();
                    rollOpen = !rollOpen;
                  }}><Icon name="die" />{t.rollFromList}</button
                >
              {/if}
              <div role="separator" class="msep"></div>
              {#if priced}
                {@const to = mode === 'coin' ? 'bag' : 'coin'}
                <button
                  type="button"
                  role="menuitem"
                  tabindex="-1"
                  onclick={() => {
                    close();
                    pickMoney(to);
                  }}>{t[`moneyTo_${to}`]}</button
                >
              {/if}
            {/if}
            <button
              type="button"
              role="menuitem"
              tabindex="-1"
              onclick={() => {
                close();
                void copyList();
              }}><Icon name="copy" />{t.copyText}</button
            >
            <button
              type="button"
              role="menuitem"
              tabindex="-1"
              onclick={() => {
                close();
                void app.exportLists([own.id]);
              }}>{t.exportJson}</button
            >
            <div role="separator" class="msep"></div>
            <button
              type="button"
              role="menuitem"
              tabindex="-1"
              class="danger"
              onclick={() => {
                close();
                del();
              }}>{t.listDeleteItem}</button
            >
          {/snippet}
        </MoreMenu>
      {/snippet}
      <!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag
           of a local snippet reads as a void expression to this rule. -->
      {#if narrow}
        <div class="lhead">
          <!-- The input's value would name the heading a second time. -->
          <PageTitle title={renameTitle} sub={cloudSub} labelledby="list-name" />
          <div class="lhead-acts">
            {#if !finding && rows.length && !app.selecting}
              <SelMode label={t.selectMode} onclick={() => void startSelecting()} />
            {/if}
            {@render listMore()}
          </div>
        </div>
      {:else}
        <PageTitle title={renameTitle} sub={cloudSub} labelledby="list-name" />
        <Actions style="margin-bottom:16px">
          <Button
            size="sm"
            caret
            on={sharing}
            expanded={sharing}
            onclick={() => {
              sharing = !sharing;
            }}><Icon name="link" />{t.share}</Button
          >
          {#if items.length}
            <Button size="sm" title={t.printHint} disabled={app.printing} onclick={pressPrint}
              ><Icon name="print" />{t.print}</Button
            >
          {/if}
          {@render listMore()}
        </Actions>
      {/if}
      {#if sharing}
        <SharePanel {app} listId={own.id} />
      {/if}
      <RequestsPanel {app} list={own} />

      {#snippet rollBody()}
        <Field label="{t.rollResult} (1-{rows.length})" after={hit ? 14 : 0}>
          <NumRow>
            <NumberField
              value={roll}
              min={1}
              max={rows.length}
              empty
              label={t.rollResult}
              stepDownLabel={t.stepDown}
              stepUpLabel={t.stepUp}
              onchange={setRoll}
            />
            <Button variant="primary" onclick={rollNow}
              ><Die faces={rows.length} />{rollLabel}</Button
            >
            {#if hit}<Button variant="ghost" onclick={clearRoll}>{t.clear}</Button>{/if}
          </NumRow>
          {#if !hit}<p class="rollhint">{t.rollHint}</p>{/if}
        </Field>
        {#if hit}
          {@const h = hit}
          <OrGrid or={t.or} items={[h]}>
            {#snippet card(it: Record_)}
              <RecordCard
                variant="compact"
                {it}
                {index}
                lang={app.lang}
                rollLabel={roll}
                artBroken={app.artBroken(it.id)}
                onartfail={(bad: string) => {
                  app.markArtBroken(bad);
                }}
                onopen={openRecord}
              >
                {#snippet nameActions()}
                  <RecordActions {app} {index} {it} row="name" />
                {/snippet}
                {#snippet actions()}
                  <RecordActions
                    {app}
                    {index}
                    {it}
                    row="card"
                    extra={entryNoteBlock(metaOf(it.id), t)}
                  />
                {/snippet}
              </RecordCard>
            {/snippet}
          </OrGrid>
          <HitNote icon="eye" label={t.notePub} text={metaOf(h.id).note} />
          <HitNote icon="eyeOff" label={t.noteHid} text={metaOf(h.id).hnote} />
        {/if}
      {/snippet}

      {#if narrow}
        {#if notesOpen}
          <div class="lnote">{@render notePair(own, 'list')}</div>
        {/if}
        {#if rollOpen && rows.length > 1}
          <details
            class="panel lroll"
            open
            ontoggle={(e) => {
              if (!e.currentTarget.open) rollOpen = false;
            }}
          >
            <summary><Icon name="die" /><span>{t.rollBy}</span></summary>
            {@render rollBody()}
          </details>
        {/if}
      {:else}
        {#if priced}
          <div class="money">
            <span class="money-l">{t.moneyAs}</span>
            {#each MONEY_MODES as m (m)}
              <Chip
                label={t[`money_${m}`]}
                on={m === mode}
                onclick={() => {
                  pickMoney(m);
                }}
              />
            {/each}
            <HelpButton lang={app.lang} size="sm" open={moneyHelp} onclick={toggleMoneyHelp} />
            {#if moneyHelp}
              <span class="money-br"></span>
              <HelpBox help={moneyHelpFor(app.lang)} class="money-help" />
            {/if}
          </div>
        {/if}

        <details
          class="lnote"
          open={untrack(() => !!(own.note || own.hnote))}
          ontoggle={(e) => {
            const box = e.currentTarget;
            if (!box.open) return;
            autoSize(box.querySelector<HTMLTextAreaElement>('#note-list-note'));
            autoSize(box.querySelector<HTMLTextAreaElement>('#note-list-hnote'));
          }}
        >
          <summary><Icon name="note" /><span>{t.listNote}</span></summary>
          {@render notePair(own, 'list')}
        </details>

        {#if rows.length > 1}
          <!-- `<details class="panel lroll">` is a `Panel.svelte` variant: a
           `<details>`, and `.lroll{padding:0}` plus its own `summary`/`[open]`
           rules are this component's own - kept inline. -->
          <details class="panel lroll">
            <summary><Icon name="die" /><span>{t.rollBy}</span></summary>
            {@render rollBody()}
          </details>
        {/if}
      {/if}

      {#if finding}
        <ListFind
          {app}
          rows={facRows}
          picked={inForce}
          shown={shownRows.length}
          query={q}
          onquery={(v: string) => {
            q = v;
          }}
          open={filterOpen}
          onopen={() => {
            filterOpen = true;
          }}
          onclose={() => {
            filterOpen = false;
          }}
          onpick={pickFacet}
          onclear={(group: string) => {
            facets = { ...inForce, [group]: [] };
          }}
          onreset={() => {
            facets = {};
          }}
          selectable={!app.selecting && shownRows.length > 0}
          onselect={() => void startSelecting()}
          bind:toggle={filterToggle}
        />
      {:else if !narrow && rows.length && !app.selecting}
        <div class="selrow">
          <SelMode label={t.selectMode} onclick={() => void startSelecting()} />
        </div>
      {/if}

      {#if guess && ticked.length && index}
        {@const idx = index}
        <Sheet {app} label={t.priceSelTitle} title={t.priceSelTitle} onclose={closeGuess}>
          <div class="guess">
            {#if pricedCount}
              <div class="money-act">
                <span class="batch-lbl">{t.repricePct}</span>
                <NumberField
                  value={rp}
                  min={-90}
                  max={500}
                  empty
                  label={t.rollResult}
                  stepDownLabel={t.stepDown}
                  stepUpLabel={t.stepUp}
                  onchange={(n: number) => {
                    rp = n;
                  }}
                />
                <Button size="sm" onclick={repriceTicked}
                  >{rp < 0 ? t.repriceDown : t.repriceUp}</Button
                >
                <span class="money-hint">{t.repriceHint}</span>
              </div>
            {/if}
            <p class="guess-note">{t.guessWhy}</p>
            <div class="guess-rows">
              {#each ticked as id (id)}
                {@const it = byId(id)}
                {#if it}
                  {@const v = guessPrice(it, idx.rarityOf)}
                  <div class="guess-row">
                    <span>{nameOf(it, app.lang)}</span>
                    <span class="guess-band">{guessWhy(it, idx.rarityOf, t)}</span>
                    <b>{v ? priceText(v, mode, app.lang) : '-'}</b>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
          {#snippet foot()}
            {#if pricedCount}
              <Button size="sm" onclick={clearPrices}
                >{t.batchNoPrice} ({String(pricedCount)})</Button
              >
            {/if}
            <Button size="sm" variant="primary" onclick={applyGuess}>{t.guessApply}</Button>
          {/snippet}
        </Sheet>
      {/if}

      {#if rows.length && !shownRows.length}
        <Empty title={t.nothing}>
          <Button size="sm" onclick={() => void resetFromEmpty()}>{t.resetAll}</Button>
        </Empty>
      {:else if rows.length}
        <div class="rows lrows" data-primary bind:this={rowsEl}>
          {#each shownRows as row (row.id)}
            {@const it = row.it}
            {@const id = row.id}
            {@const at = row.at}
            {@const label = it ? nameOf(it, app.lang) : id}
            {@const m = metaOf(id)}
            {@const hasNote = !!(m.note || m.hnote)}
            {@const goldHint = goldText(m.gold ?? 0)}
            {#snippet pick()}
              <label class="lrow-pick"
                ><input
                  type="checkbox"
                  checked={lsel.has(id)}
                  aria-label={label}
                  onchange={(e) => {
                    pickRow(id, e.currentTarget.checked);
                  }}
                /></label
              >
            {/snippet}
            {#snippet grip()}
              <span
                class="lrow-grip"
                draggable="true"
                data-drag="{own.id}:{id}"
                title={t.dragHint}
                aria-hidden="true"><Icon name="grip" /></span
              >
            {/snippet}
            {#snippet posField()}
              <input
                type="number"
                class="lrow-n"
                min="1"
                max={own.ids.length}
                inputmode="numeric"
                value={at + 1}
                aria-label={t.position}
                onchange={(e) => {
                  setPos(id, at, e);
                }}
              />
            {/snippet}
            <!-- No `<label>`: a button inside one would be a second control of the label
                 (FEATURES.md, rule 15), and 300 `label[for]` lookups stalled jsdom's role
                 queries past the timed suite's 30 s (2026-10-16), so the caption names the
                 field by `aria-labelledby`. -->
            {#snippet priceField()}
              <div class="gfield">
                <span
                  ><span id="gcap-{id}">{t.price}</span>{#if goldHint}<HelpButton
                      lang={app.lang}
                      size="sm"
                      open={priceHelp.has(id)}
                      label={t.fieldHelp.replace('%s', t.price)}
                      controls="ghint-{id}"
                      onclick={() => {
                        if (priceHelp.has(id)) priceHelp.delete(id);
                        else priceHelp.add(id);
                      }}
                    />{/if}</span
                ><input
                  aria-labelledby="gcap-{id}"
                  type="number"
                  min="0"
                  max="99999"
                  inputmode="numeric"
                  data-gold
                  value={m.gold || ''}
                  placeholder="-"
                  oninput={(e) => {
                    setGold(id, e);
                  }}
                />
              </div>
            {/snippet}
            {#snippet hint()}
              {#if goldHint}
                <p class="ghint" id="ghint-{id}" hidden={!priceHelp.has(id)}>
                  {goldHint}
                </p>
              {/if}
            {/snippet}
            {#snippet notes()}
              {#if !boxHidden(id, m)}
                <div class="rnote">{@render notePair(m, id)}</div>
              {/if}
            {/snippet}
            {#snippet qtyField()}
              <input
                type="number"
                class="cqf"
                min="1"
                max={QTY_MAX}
                inputmode="numeric"
                data-qty
                placeholder="1"
                value={m.qty || ''}
                aria-label={t.qtyOf.replace('%s', () => label)}
                oninput={(e) => {
                  setQty(id, e);
                }}
              />
            {/snippet}
            <div
              class="row lrow"
              class:compact={narrow}
              class:sel={lsel.has(id)}
              class:has-note={hasNote}
              class:gm-only={!!m.gmOnly}
              class:dragging={dragId === id}
              class:drop-before={dropGap === at}
              class:drop-after={dropGap === at + 1}
              data-index={at}
            >
              {#if narrow}
                {#if app.selecting}{@render pick()}{/if}
                <CompactRow
                  {it}
                  {id}
                  no={at + 1}
                  lang={app.lang}
                  artBroken={(id: string) => app.artBroken(id)}
                  onartfail={(bad: string) => {
                    app.markArtBroken(bad);
                  }}
                  open={openRows.has(id)}
                  ontoggle={() => {
                    flipRow(id);
                  }}
                  price={(m.gold ?? 0) > 0 ? priceText(m.gold ?? 0, mode, app.lang) : undefined}
                  note={hasNote}
                  gmOnly={!!m.gmOnly}
                  qtyText={app.selecting && (m.qty ?? 0) > 1 ? '×' + String(m.qty) : undefined}
                  field={app.selecting ? undefined : qtyField}
                >
                  {#if it}
                    <RowMain
                      full
                      {it}
                      lang={app.lang}
                      artBroken={(id: string) => app.artBroken(id)}
                      onartfail={(bad: string) => {
                        app.markArtBroken(bad);
                      }}
                      onopen={openRecord}
                    />
                  {/if}
                  <div class="cfields">
                    <label class="cf"><span>{t.position}</span>{@render posField()}</label>
                    {@render priceField()}
                    {#if !narrowed}{@render grip()}{/if}
                    <button
                      type="button"
                      class="cnote"
                      class:on={hasNote}
                      aria-expanded={!boxHidden(id, m)}
                      onclick={() => {
                        toggleNote(id, at);
                      }}><Icon name="note" />{t.note}</button
                    >
                    <MoreMenu
                      {app}
                      id="row-more-{id}"
                      size="sm"
                      label={t.moreOf.replace('%s', () => label)}
                    >
                      {#snippet children(close: () => void)}
                        <button
                          type="button"
                          role="menuitem"
                          tabindex="-1"
                          onclick={() => {
                            close();
                            cloud?.setGmOnly(own.id, id, !m.gmOnly);
                          }}
                          ><Icon name={m.gmOnly ? 'eye' : 'eyeOff'} />{m.gmOnly
                            ? t.rowShow
                            : t.rowHide}</button
                        >
                        {#if it}
                          <button
                            type="button"
                            role="menuitem"
                            tabindex="-1"
                            onclick={() => {
                              close();
                              openRecord(it);
                            }}>{t.openCard}</button
                          >
                        {/if}
                        <div role="separator" class="msep"></div>
                        <button
                          type="button"
                          role="menuitem"
                          tabindex="-1"
                          class="danger"
                          onclick={() => {
                            close();
                            removeEntry(id, it, at);
                          }}>{t.removeItem}</button
                        >
                      {/snippet}
                    </MoreMenu>
                  </div>
                  {@render hint()}
                  {@render notes()}
                </CompactRow>
              {:else}
                {#if !narrowed}{@render grip()}{/if}
                {#if app.selecting}{@render pick()}{/if}
                {@render posField()}
                {#if it}
                  <RowMain
                    {it}
                    lang={app.lang}
                    artBroken={(id: string) => app.artBroken(id)}
                    onartfail={(bad: string) => {
                      app.markArtBroken(bad);
                    }}
                    onopen={openRecord}
                    gmOnly={m.gmOnly}
                  />
                {:else}
                  <div class="unk"><b>{id}</b><span>{t.itemNotLoaded}</span></div>
                {/if}
                <div class="lrow-meta">
                  <label
                    ><span>{t.qty}</span><input
                      type="number"
                      min="1"
                      max={QTY_MAX}
                      inputmode="numeric"
                      data-qty
                      value={m.qty || ''}
                      placeholder="1"
                      oninput={(e) => {
                        setQty(id, e);
                      }}
                    /></label
                  >
                  {@render priceField()}
                </div>
                <div class="lrow-acts">
                  <button
                    type="button"
                    class="lrow-note"
                    class:on={hasNote}
                    title={t.note}
                    aria-label={t.note}
                    onclick={() => {
                      toggleNote(id, at);
                    }}><Icon name="note" /></button
                  >
                  <button
                    type="button"
                    class="lrow-gm"
                    aria-pressed={!!m.gmOnly}
                    title={t.noteHid}
                    aria-label={t.gmOnlyOf.replace('%s', label)}
                    onclick={() => {
                      cloud?.setGmOnly(own.id, id, !m.gmOnly);
                    }}><Icon name={m.gmOnly ? 'eyeOff' : 'eye'} /></button
                  >
                  <button
                    type="button"
                    class="row-x"
                    title={t.removeItem}
                    aria-label={t.removeItem}
                    onclick={() => {
                      removeEntry(id, it, at);
                    }}>&times;</button
                  >
                </div>
                {@render hint()}
              {/if}
              {#if lsel.has(id) && (m.qty ?? 0) > 1}
                {@const n = takenOf(id)}
                <div class="lrow-take">
                  <PickQty
                    value={n}
                    max={m.qty ?? 1}
                    label={t.pickQty}
                    ofText={t.pickOf.replace('%n', String(m.qty ?? 1))}
                    sum={priceText((m.gold ?? 0) * n, mode, app.lang)}
                    name={t.pickQtyOf.replace('%s', label)}
                    minText={t.pickMin}
                    maxText={t.pickMax}
                    minName={t.pickMinOf.replace('%s', label)}
                    maxName={t.pickMaxOf.replace('%s', label)}
                    onchange={(n: number) => {
                      picked.set(id, n);
                    }}
                  />
                </div>
              {/if}
              {#if !narrow}{@render notes()}{/if}
            </div>
          {/each}
        </div>
      {:else}
        <Empty
          >{t.listEmptyHint}{#if app.homebrew}{' ' + t.listEmptyHintOwn}{/if}</Empty
        >
      {/if}
      <!-- eslint-enable @typescript-eslint/no-confusing-void-expression -->
      {#if app.homebrew}
        <!-- After the last entry, so a new item's entry lands right above it. -->
        <div class="addwrap">
          <button
            type="button"
            class="addrow"
            class:on={quick}
            aria-expanded={quick}
            bind:this={quickBtn}
            onclick={() => {
              quick = !quick;
            }}
            ><span class="plus"><Icon name="plus" /></span><span>{t.quickOwn}</span><i
              class="caret"
              class:up={quick}
            ></i></button
          >
          {#if quick}
            <QuickItem
              {app}
              listId={own.id}
              onclose={() => {
                quick = false;
                void tick().then(() => {
                  quickBtn?.focus();
                });
              }}
              oncreated={() => {
                q = '';
                facets = {};
              }}
            />
          {/if}
        </div>
      {/if}
      <StatusRegion text={said} />
      <SyncSaid {app} live={app.cloudLists?.live} />
    {/if}
  {/snippet}
</RecordHost>

<style>
  /* `.page-h`/`.page-sub` moved to `PageTitle.svelte`, `.miss` to
     `NoData.svelte` (though this component's own copy read `--muted2`
     where `NoData`'s reads `--muted` - never photographed either way).

     off the global `input[type=text]` rule (`git show 23c00a6^:style.css`), scoped as
     `ListsPage.svelte` already does, then `.titleinput` - the
     cascade, not the intent: the attribute selector's higher specificity
     beats the class on every property but `max-width` and `letter-spacing`
     (never part of the `font` shorthand this rule resets), and the numbers
     that "survive" from the class are the ones `.page-h` already set on the
     input's own parent, inherited right back through `font: inherit`. */
  input[type='text'] {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
  }

  input[type='text']:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  .titleinput {
    width: 100%;
    max-width: 560px;
    background: transparent;
    border: 0;
    border-bottom: 1px dashed var(--line2);
    color: var(--txt);
    font: inherit;
    font-size: var(--t-page);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    padding: 0 0 4px;
  }

  .titleinput:focus {
    outline: none;
    border-bottom-color: var(--gold);
  }

  .titleinput:hover {
    border-bottom-color: var(--muted2);
  }

  /* The «Добавить свой предмет» row after the entries: a list row's box; the dashed
     border marks "add", not a homebrew item (that mark has no dashes). */
  .addwrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .addrow {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 0 14px 0 13px;
    border: 1px dashed var(--line2);
    border-radius: 11px;
    background: transparent;
    color: var(--gold-soft);
    font: inherit;
    font-size: var(--t-control);
    font-weight: 620;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  @media (hover: hover) {
    .addrow:hover {
      border-color: var(--gold);
    }
  }

  .addrow.on {
    border-style: solid;
    border-color: var(--gold);
  }

  .addrow .plus {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid rgb(216 171 94 / 40%);
    border-radius: 8px;
  }

  /* off `.caret` in `Button.svelte`, whose rule is scoped there */
  .caret {
    width: 0;
    height: 0;
    margin-left: auto;
    border: 4px solid transparent;
    border-top-color: currentcolor;
    transform: translateY(2px);
    display: inline-block;
    flex: none;
  }

  .caret.up {
    border-top-color: transparent;
    border-bottom-color: currentcolor;
    transform: translateY(-2px);
  }

  /* `.card-acts` moved to `Actions.svelte` - `margin-bottom:16px` is
     the live inline style on this specific block, now passed as `style`. */

  /* off `.money`, `.money-l`, `.money-br`, `.money-help` (`git show 23c00a6^:style.css`).
     `.money-help` reaches into `HelpBox`'s own root, hence `:global()`. */
  .money {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    margin: 0 0 14px;
  }

  .money-l {
    font: 650 var(--t-label)/1 var(--mono);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .money-br {
    flex: 0 0 100%;
    height: 0;
  }

  .money > :global(.money-help) {
    flex: 0 0 100%;
    margin: 2px 0 0;
  }

  /* off `.lnote` and its family (`git show 23c00a6^:style.css`) */
  .lnote {
    border: 1px solid var(--line2);
    border-radius: 12px;
    background: var(--surface);
    margin-bottom: 16px;
  }

  .lnote summary {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 13px;
    cursor: pointer;
    list-style: none;
    flex-wrap: wrap;
  }

  .lnote summary::-webkit-details-marker {
    display: none;
  }

  .lnote summary :global(svg) {
    fill: var(--muted2);
  }

  .lnote summary span {
    font: 650 var(--t-label)/1 var(--mono);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .lnote summary:hover span {
    color: var(--gold-soft);
  }

  .lnote[open] summary {
    padding-bottom: 6px;
  }

  /* off `.lnote textarea,.rnote textarea` and the `:focus` pair
     (`git show 23c00a6^:style.css`) */
  .lnote :global(textarea),
  .rnote :global(textarea) {
    display: block;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    background: var(--bg2);
    border: 1px solid var(--line2);
    border-radius: 8px;
    color: var(--txt);
    font: var(--t-small)/1.5 var(--ui);
    padding: 9px 11px;
    max-height: 320px;
    overflow-y: auto;
  }

  .rnote :global(textarea) {
    font-size: var(--t-data);
    background: var(--surface);
  }

  .lnote :global(textarea:focus),
  .rnote :global(textarea:focus) {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  /* off `.npair`, `.nfield`, `.nlbl` (both declarations), `.nlbl i`, `.n-hid textarea` and
     the 640px override in `git show 23c00a6^:style.css` */
  .npair {
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr 1fr;
  }

  .lnote .npair {
    padding: 0 13px 13px;
  }

  .rnote .npair {
    gap: 10px;
  }

  .nfield {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .nlbl {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font: 650 var(--t-badge)/1 var(--mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .nlbl i {
    font-style: normal;
    font-size: var(--t-badge);
    letter-spacing: 0.02em;
    text-transform: none;
    color: var(--muted2);
    font-weight: 400;
  }

  .n-hid :global(textarea) {
    border-style: dashed;
  }

  /* FormField's `.fhelp`: the hint keeps its line breaks. */
  .nhelp {
    margin: 0;
    font-size: var(--t-data);
    color: var(--muted2);
    white-space: pre-line;
  }

  @media (max-width: 640px) {
    .npair {
      grid-template-columns: 1fr;
    }
  }

  /* off `.note-x`, `:hover`, `.nfield:has(textarea:placeholder-shown)
     .note-x` (`git show 23c00a6^:style.css`) */
  .note-x {
    margin-left: auto;
    width: 20px;
    height: 20px;
    flex: none;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--muted2);
    font: 400 var(--t-title)/1 var(--ui);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
    position: relative;
  }

  .note-x:hover {
    background: var(--surface);
    color: var(--txt);
  }

  /* 20px of paint, 44px of target - the same `PageHead.svelte`
     `.homebtn::after` shape. */
  .note-x::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  .nfield:has(:global(textarea:placeholder-shown)) .note-x {
    display: none;
  }

  /* off `.panel` (`git show 23c00a6^:style.css`) - kept here for the `<details
     class="panel lroll">` variant above; see `Panel.svelte` for the plain
     rule this one duplicates on purpose. */
  .panel {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
  }

  /* off `.lroll` and its family (`git show 23c00a6^:style.css`) */
  .lroll {
    padding: 0;
  }

  .lroll > summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px;
    cursor: pointer;
    list-style: none;
  }

  .lroll > summary::-webkit-details-marker {
    display: none;
  }

  .lroll > summary :global(svg) {
    fill: var(--muted2);
    width: 15px;
    height: 15px;
    flex: none;
  }

  .lroll > summary span {
    font: 650 var(--t-label)/1 var(--mono);
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .lroll > summary:hover span {
    color: var(--gold-soft);
  }

  .lroll[open] > summary {
    padding-bottom: 4px;
  }

  .lroll > :global(:not(summary)) {
    margin-left: 13px;
    margin-right: 13px;
  }

  .lroll > :global(:last-child) {
    margin-bottom: 13px;
  }

  /* off `.rollhint` (`git show 23c00a6^:style.css`) */
  .rollhint {
    margin: 10px 0 0;
    font-size: var(--t-data);
    color: var(--muted2);
  }

  .batch-total b {
    font-weight: 650;
  }

  .batch-total .np {
    color: var(--muted);
  }

  /* off `.guess`, `.guess-note`, `.guess-rows`, `.guess-row` and its three
     (`git show 23c00a6^:style.css`) */
  .guess {
    padding: 2px 0 4px;
  }

  .guess-note {
    margin: 0 0 9px;
    font-size: var(--t-label);
    line-height: 1.55;
    color: var(--muted);
  }

  .guess-rows {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 11px;
    max-height: 210px;
    overflow: auto;
  }

  .guess-row {
    display: flex;
    align-items: baseline;
    gap: 9px;
    font-size: var(--t-data);
    color: var(--txt);
  }

  .guess-row > span:first-child {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .guess-band {
    color: var(--muted2);
    font-size: var(--t-data);
    white-space: nowrap;
  }

  .guess-row b {
    color: var(--gold-soft);
    font-weight: 650;
    white-space: nowrap;
  }

  /* off `.money-act`, `:last-child`, `.numbox`, `.numbox button`,
     `.numbox input[type=text]` (`git show 23c00a6^:style.css`) - reaching into
     `NumberField`'s own root, hence `:global()` on the inner selector only,
     the way `.money > :global(.money-help)` above already does. */
  .money-act {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
    margin-bottom: 11px;
  }

  .money-act:last-child {
    margin-bottom: 0;
  }

  .money-act :global(.numbox) {
    margin: 0;
    height: 32px;
  }

  .money-act :global(.numbox button) {
    width: 28px;
    height: 30px;
    font-size: var(--t-control);
  }

  .money-act :global(.numbox input[type='text']) {
    width: 52px;
    height: 30px;
    font-size: var(--t-small);
    padding: 0;
  }

  /* off `.money-hint` (`git show 23c00a6^:style.css`) */
  .money-hint {
    font-size: var(--t-data);
    line-height: 1.45;
    color: var(--muted2);
    flex: 1 1 200px;
    min-width: 0;
  }

  /* off `.money-act .btn` (`git show 23c00a6^:style.css`) */
  .money-act :global(.btn) {
    font-weight: 650;
  }

  /* off `.batch-lbl` (`git show 23c00a6^:style.css`) */
  .batch-lbl {
    font: 650 var(--t-label) / 1 var(--ui);
    color: var(--muted2);
  }

  /* off `.rows`, `.row`, the `(hover:hover)` `.row:hover` (`git show 23c00a6^:style.css`)
     - the third copy of three short rules. This copy's transition list
     diverges from `TableRows.svelte`'s: only a list row carries the drop-gap
     mark, so `box-shadow` is left out here and the mark paints at once. */
  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .row {
    display: flex;
    align-items: stretch;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 11px;
    transition:
      border-color 0.15s,
      opacity 0.15s;
    overflow: hidden;
  }

  /* Before hover and `.sel`, so they still win (docs/specs/FEATURES.md, "Account and browser lists"). */
  .lrow.gm-only {
    border-style: dashed;
    border-color: var(--line2);
    background: var(--bg2);
  }

  @media (hover: hover) {
    .row:hover {
      border-color: var(--gold);
    }
  }

  .lrows {
    margin-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  /* A stored entry whose record the page has not read: the key and «Предмет не загружен»
     in `RowMain`'s box. */
  .unk {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    padding: 8px;
    overflow-wrap: anywhere;
    color: var(--muted);
    font-size: var(--t-small);
  }

  .unk b {
    color: var(--txt);
    font-weight: 600;
  }

  /* the `.lrow` family: `.lrow`, `.rnote`, `.lrow.has-note`,
     `.lrow-acts .lrow-note`, `.on`, `svg` (`git show 23c00a6^:style.css`) */
  .lrow {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .rnote {
    flex: 0 0 100%;
    border-top: 1px solid var(--line);
    background: var(--bg2);
    padding: 9px 11px;
  }

  .lrow.has-note {
    border-color: var(--line2);
  }

  /* A ticked row is lit and neutral, as `TableRows.svelte`'s (DESIGN.md, "The Seal Rule"). */
  .lrow.sel {
    border-color: var(--muted2);
    background: var(--surface2);
  }

  /* The take line inside a ticked row (docs/specs/FEATURES.md, "Lists"),
     starting under the art: 107px, measured 2026-09-23 at 1180. No fill: a
     background would cover the `drop-after` inset mark. */
  .lrow-take {
    flex: 0 0 100%;
    display: flex;
    justify-content: flex-start;
    border-top: 1px solid rgb(216 171 94 / 22%);
    padding: 8px 11px 8px 107px;
  }

  /* The price's conversion, under the row's fields while its «?» is open, at the take
     line's inset. */
  .ghint {
    flex: 0 0 100%;
    margin: 0;
    padding: 0 11px 8px 107px;
    font-size: var(--t-data);
    color: var(--muted2);
    overflow-wrap: anywhere;
  }

  .lrow-acts .lrow-note,
  .lrow-acts .lrow-gm {
    color: var(--muted2);
  }

  .lrow-acts .lrow-gm {
    border-top: 1px solid var(--line);
  }

  .lrow-acts .lrow-gm[aria-pressed='true'] {
    color: var(--gold);
    background: rgb(216 171 94 / 12%);
  }

  .lrow-acts .lrow-note.on {
    color: var(--gold);
    background: rgb(216 171 94 / 12%);
  }

  .lrow-acts .lrow-note :global(svg),
  .lrow-acts .lrow-gm :global(svg) {
    display: block;
    margin: 0 auto;
  }

  /* off `.lrow-grip`, `:hover`, `:active`, `.lrow-n` and its three
     (`git show 23c00a6^:style.css`) */
  .lrow-grip {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    color: var(--muted2);
    cursor: grab;
    background: rgb(216 171 94 / 5%);
    border-right: 1px solid var(--line);
    touch-action: none;
  }

  .lrow-grip:hover {
    color: var(--gold-soft);
  }

  .lrow-grip:active {
    cursor: grabbing;
  }

  /* HTML5 drag never starts from a touch, so the grip is inert on a device
     whose every input device is coarse and cannot hover. `any-*`, not
     `hover`/`pointer`: those two describe only the primary input, and would
     also hide the grip on a touchscreen laptop where a mouse drags it fine.
     The position field beside it reorders on every device
     (docs/specs/FEATURES.md, "Lists"). */
  @media (any-hover: none) and (any-pointer: coarse) {
    .lrow-grip {
      display: none;
    }
  }

  .lrow-n {
    flex: none;
    align-self: stretch;
    width: 40px;
    box-sizing: border-box;
    padding: 0 2px;
    border: 0;
    border-right: 1px solid var(--line);
    font: 650 var(--t-label)/1 var(--mono);
    color: var(--gold-soft);
    text-align: center;
    background: rgb(216 171 94 / 7%);
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .lrow-n::-webkit-outer-spin-button,
  .lrow-n::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .lrow-n:focus {
    outline: none;
    background: rgb(216 171 94 / 16%);
    box-shadow: inset 0 0 0 1px var(--gold);
  }

  /* off `.lrow.dragging`, `.drop-before`, `.drop-after` (`git show 23c00a6^:style.css`) */
  .lrow.dragging {
    opacity: 0.45;
  }

  .lrow.drop-before {
    box-shadow: inset 0 3px 0 0 var(--gold);
  }

  .lrow.drop-after {
    box-shadow: inset 0 -3px 0 0 var(--gold);
  }

  /* An inset box-shadow paints above `.lrow`'s own background but below its
     children; an open note box is `.rnote`, the row's last child, and covers
     the line above (docs/specs/FEATURES.md, "Lists"). Redraw the same inset
     on it so a noted row shows the mark too. */
  .lrow.drop-after .rnote {
    box-shadow: inset 0 -3px 0 0 var(--gold);
  }

  /* off `.lrow-meta` and its labels (`git show 23c00a6^:style.css`); the price field's caption holds
     its «?», so the field is a `.gfield`, not a `<label>`. The «?» makes that caption
     taller, so the fields align at the end and the two inputs stay on one line. */
  .lrow-meta {
    flex: none;
    display: flex;
    gap: 6px;
    align-items: flex-end;
    padding: 8px 10px;
    border-left: 1px solid var(--line);
  }

  .lrow-meta > label,
  .lrow-meta > .gfield {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .lrow-meta span {
    font-size: var(--t-badge);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* `position`: the input paints over the price «?»'s 44 px target, which reaches into it. */
  .lrow-meta input {
    position: relative;
    width: 64px;
    height: 30px;
    padding: 0 8px;
    border-radius: 7px;
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: 600 var(--t-data)/1 var(--mono);
    text-align: center;
  }

  .lrow-meta input[data-qty] {
    width: 70px;
    padding-right: 2px;
  }

  .lrow-meta input[data-gold] {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .lrow-meta input[data-gold]::-webkit-outer-spin-button,
  .lrow-meta input[data-gold]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .lrow-meta input:focus {
    outline: none;
    border-color: var(--gold);
  }

  /* off `.lrow-acts` and its four (`git show 23c00a6^:style.css`) */
  .lrow-acts {
    flex: none;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--line);
  }

  .lrow-acts button {
    flex: 1;
    width: 38px;
    border: 0;
    background: transparent;
    color: var(--muted2);
    font-size: var(--t-control);
    line-height: 1;
    transition: 0.15s;
  }

  .lrow-acts button:hover:not(:disabled) {
    background: var(--surface2);
    color: var(--gold);
  }

  .lrow-acts button:disabled {
    opacity: 0.28;
  }

  .lrow-acts .row-x {
    border-left: 0;
    border-top: 1px solid var(--line);
    font-size: var(--t-title);
  }

  /* off `.lrow-pick` (`git show 23c00a6^:style.css`) */
  .lrow-pick {
    display: flex;
    align-items: center;
    padding: 0 2px 0 10px;
    flex: none;
  }

  /* Up to 760 px the head is the name, «Выбрать» and «Ещё» on one row, the meta line under
     both (DESIGN.md, "Compact row"). */
  .lhead {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 8px;
    align-items: start;
  }

  .lhead > :global(.page-h) {
    grid-column: 1;
    grid-row: 1;
  }

  .lhead > :global(h1.page-h) {
    margin-bottom: 2px;
  }

  /* The name's own line height, not the 46 px of a form field: the first entry must start
     in the first screen at 360x640 (DESIGN.md, "The First-Screen Rule"). */
  .lhead .titleinput {
    height: auto;
  }

  .lhead > :global(.page-sub) {
    grid-column: 1 / -1;
    grid-row: 2;
    margin-bottom: 8px;
  }

  .lhead-acts {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    gap: 6px;
    align-items: center;
  }

  /* «Заметки ▾» on the meta line: a text button with a 24 px target. */
  .lnkb {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 24px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--txt);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .lnkb :global(svg) {
    width: 16px;
    height: 16px;
  }

  .lnkb[aria-expanded='true'] :global(svg) {
    transform: rotate(180deg);
  }

  div.lnote {
    padding-top: 13px;
  }

  /* From 761 px «Выбрать» has its own row at the end, under the head. */
  .selrow {
    display: flex;
    justify-content: flex-end;
    margin: 0 0 10px;
  }

  /* The unfolded compact row's fields: the position, the price, the grip, «Заметка», «Ещё». */
  .cfields {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin: 8px 0 6px;
  }

  .cf,
  .cfields .gfield {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .cf > span,
  .cfields .gfield > span {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--t-badge);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .cfields .lrow-n,
  .cfields input[data-gold] {
    position: relative;
    width: 64px;
    height: 32px;
    padding: 0 8px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: 600 var(--t-data) / 1 var(--mono);
    text-align: center;
  }

  .cfields .lrow-n {
    width: 48px;
  }

  .cfields .lrow-grip {
    align-self: stretch;
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    width: 32px;
  }

  .cnote {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface);
    color: var(--txt);
    font: 600 var(--t-data) / 1 var(--ui);
    cursor: pointer;
  }

  .cnote.on {
    border-color: var(--muted2);
  }

  .cfields + .ghint {
    padding: 0 0 6px;
  }

  .lrow.compact .rnote {
    margin: 4px 0 0;
  }

  /* The bar's «Ещё» up to 760 px: this box anchors the menu, as `HomebrewBulk`'s does. */
  .bulkmore {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    display: flex;
  }

  .bulkmore :global(.morewrap) {
    flex: 1;
    min-width: 0;
  }

  /* This component's own 8px-radius override deleted - the
     global `:focus-visible` rule (tokens.css) already reaches every
     control, at the one radius the owner chose. */

  /* off the 600px block for `.lrow`, `.lrow .row-main`, `.lrow-meta`,
     `.lrow-acts`, its `button`, `.row-x` (`git show 23c00a6^:style.css`) */
  @media (max-width: 600px) {
    .lrow {
      flex-wrap: wrap;
    }

    .lrow > :global(.row-main),
    .lrow > .unk {
      flex: 1 1 auto;
    }

    .lrow-meta {
      flex: 1 1 auto;
      border-left: 0;
      border-top: 1px solid var(--line);
      padding: 8px 10px 8px 44px;
    }

    .lrow-acts {
      flex-direction: row;
      border-left: 0;
      border-top: 1px solid var(--line);
    }

    /* `flex: none`: the base `flex: 1` sized from a zero basis left the unbordered note
       button 1 px under 44 (measured 2026-10-08, tests/app/states.js case 69). */
    .lrow-acts button {
      flex: none;
      width: 44px;
      min-height: 38px;
    }

    .lrow-acts .row-x,
    .lrow-acts .lrow-gm {
      border-top: 0;
      border-left: 1px solid var(--line);
    }

    .ghint {
      padding-left: 11px;
    }
  }

  /* The take line under a compact row starts at the row's inset. */
  @media (max-width: 760px) {
    .lrow-take {
      padding-left: 11px;
    }
  }

  /* The meta box and three 44 px action buttons fill a 360 px row to the pixel; this
     leaves 4 px of slack (measured 2026-10-08, tests/app/states.js case 69). */
  @media (max-width: 400px) {
    .lrow-meta {
      padding-right: 6px;
    }
  }
</style>
