<script lang="ts">
  /* The list page - `#/lists/<id>` and `#/l/<own payload>` - off `renderOneList`
   * (app.js 2960-2995), `moneyPickerHTML` (2933-2958), `listRollPanel`
   * (2997-3029), `rolledNoteHTML` (3031-3037), `listRowHTML` (3040-3092),
   * `listNoteHTML` (3094-3101), `notePairHTML` (3109-3128), the address
   * (1537-1607), the handlers (3944-3969, 4086-4150, 4251-4256, 4346-4434,
   * 4532-4571), the copy (1609-1647), `contextNote`/`onListPage` (568-578),
   * the live drag event model (4443-4530), the bar's actions (`batchBarHTML`,
   * 724-745) and the money panel (`moneyPanelHTML`, 750-782, `guessWhy`
   * 831-842). */
  import { onDestroy, tick, untrack } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import Die from './Die.svelte';
  import Empty from './Empty.svelte';
  import Field from './Field.svelte';
  import HelpBox from './HelpBox.svelte';
  import HelpButton from './HelpButton.svelte';
  import Icon from './Icon.svelte';
  import NumberField from './NumberField.svelte';
  import OrGrid from './OrGrid.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordModal from './RecordModal.svelte';
  import RowMain from './RowMain.svelte';
  import StorageNotice from './StorageNotice.svelte';
  import { moneyHelpFor } from '../lib/help.js';
  import { printHash, sectionHash, sharedListHash } from '../lib/hash.js';
  import type { IconName } from '../lib/icons.js';
  import { itemsWord, nameOf } from '../lib/i18n.js';
  import { encodeListRaw } from '../lib/listLink.js';
  import type { ListEntryMeta, MoneyMode } from '../lib/listLink.js';
  import { findListByPayload, itemMeta, type StoredList } from '../lib/lists.js';
  import { MONEY_MODES, moneyMode, priceText } from '../lib/money.js';
  import { pick, rollLabel as rollLabelFor } from '../lib/roll.js';
  import { entryNoteBlock, shareList } from '../lib/share.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);
  const store = $derived(app.lists);

  const route = $derived(app.route);

  /** Which id the data still knows, for `findListByPayload`'s own comparison
   *  and for dropping an unknown entry silently, as the live app does. */
  const knows = (id: string): boolean => index?.byId.has(id) ?? false;

  /**
   * The list this address shows, or `null` for an id nobody has, a shared
   * payload matching no list of ours (B5.6 keeps the `todo` paragraph for
   * that), or a packed payload (also B5.6's).
   */
  const own = $derived.by((): StoredList | null => {
    const r = route;
    if (r.kind === 'storedList') return app.lists.get(r.listId) ?? null;
    if (r.kind === 'sharedList' && !r.packed) {
      if (r.payload === app.urlPayload) {
        const mine = app.lists.get(app.openList);
        if (mine) return mine;
      }
      return findListByPayload(app.lists.lists, r.payload, knows);
    }
    return null;
  });

  const byId = (id: string): Record_ | undefined => index?.byId.get(id);
  const items = $derived(
    own ? own.ids.map(byId).filter((it): it is Record_ => it != null) : []
  );

  /**
   * Reading `own`'s fields (through `encodeList`, inside `syncListUrl`)
   * subscribes this effect to every edit - the live `freshenListUrl` after
   * each writer, collapsed into one place. After `replace`, the route's
   * payload equals `urlPayload` already, so there is no loop back into this
   * effect.
   *
   * Deliberately not an `$effect` cleanup for the "clear on every other
   * route" half: a cleanup runs before *every* re-run of this effect, not
   * only on unmount, so clearing `openList`/`urlPayload` there raced the very
   * next line that was about to set them again - `own`'s own short-circuit
   * (`r.payload === app.urlPayload`) could see them blanked mid-edit, fall
   * through to the content-based `findListByPayload`, and reject the list
   * against a payload snapshot one keystroke stale, leaving `own` stuck null
   * with nothing left to re-trigger a fix. Measured: clearing a list note's
   * text this way could permanently swap the page to the "not ours" `todo`
   * paragraph after a single keystroke. `onDestroy` fires exactly once, when
   * `App.svelte` remounts a different page component - the live app's own
   * "every other route" moment.
   */
  $effect(() => {
    const l = own;
    if (l) app.syncListUrl(l);
  });

  onDestroy(() => {
    app.clearOpenList();
  });

  /* Local state. `roll` is the live `S.listRoll.n` for this list, but kept in
     the component rather than in app memory - a recorded difference (a roll
     made, then a navigation away and back, shows an empty field here and the
     result there); `noteOpen` is the live `S.keepOpen['rnote:...']`, a
     person's own fold/unfold per entry. `dragFrom`/`dragMark` have no live
     counterpart at all - they exist only to drive the three drag classes off
     the port's callbacks, since Svelte drops a scoped rule no template
     element can match and `npm run check` fails it as dead CSS if the port
     toggled them itself. */
  const lsel = new SvelteSet<string>();
  let roll = $state(0);
  let moneyHelp = $state(false);
  const noteOpen = new SvelteMap<string, boolean>();
  let open = $state<Record_ | null>(null);
  let rowsEl = $state<HTMLDivElement | undefined>(undefined);
  let dragFrom = $state(-1);
  let dragMark = $state<{ over: number; where: 'before' | 'after' } | null>(null);

  const hit = $derived(roll >= 1 && roll <= items.length ? (items[roll - 1] ?? null) : null);
  const rollLabel = $derived(rollLabelFor(items.length, t));

  const mode = $derived(moneyMode(own));
  const priced = $derived.by((): boolean => {
    const l = own;
    return l ? l.ids.some((id) => (itemMeta(l, id).gold ?? 0) > 0) : false;
  });

  /** The live `hidden` default (no note → hidden), with a person's own
   *  fold/unfold winning once they have touched it - the live `keepOpen`. */
  function boxHidden(id: string, meta: ListEntryMeta): boolean {
    return noteOpen.has(id) ? !noteOpen.get(id) : !(meta.note || meta.hnote);
  }

  function metaOf(id: string): ListEntryMeta {
    return own ? itemMeta(own, id) : {};
  }

  /** The gold hint / field title - empty in coin mode, where there is
   *  nothing to translate. */
  function goldText(coins: number): string {
    return coins > 0 && mode !== 'coin' ? priceText(coins, mode, app.lang) : '';
  }

  const say = (msg: string, error?: boolean): void => {
    app.say(msg, { error });
  };

  /* ---------- handlers, each the live one by line ---------- */

  function rename(e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    if (own) store.rename(own.id, el.value);
  }

  async function shareLink(forPlayers: boolean): Promise<void> {
    const l = own;
    if (!l) return;
    if (!l.ids.length) {
      say(t.listEmpty);
      return;
    }
    const payload = await app.env.compress.pack(encodeListRaw(l, forPlayers));
    const ok = await app.env.clipboard.writeText(app.linkTo(sharedListHash(payload)));
    say(ok ? (forPlayers ? t.playersLinkCopied : t.gmLinkCopied) : t.copyFailed, !ok);
  }
  async function sharePlayers(): Promise<void> {
    await shareLink(true);
  }
  async function shareGm(): Promise<void> {
    await shareLink(false);
  }

  async function copyList(): Promise<void> {
    const l = own;
    if (!l || !index) return;
    const { text, html } = shareList(l, index, app.lang, t);
    const ok = await app.env.clipboard.writeRich({ html, plain: text });
    say(ok ? t.listCopied : t.copyFailed, !ok);
  }

  function del(): void {
    const l = own;
    if (!l) return;
    if (!app.env.dialog.confirm(t.deleteConfirm.replace('%s', l.name))) return;
    store.remove(l.id);
    app.go('#/lists');
  }

  function pickMoney(mode2: MoneyMode): void {
    if (own) store.setMoney(own.id, mode2);
  }

  function toggleMoneyHelp(): void {
    moneyHelp = !moneyHelp;
  }

  /* Auto-size: the module-level rule (app.js 1100-1110) - skip a hand-resized
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
    if (key === 'list') store.setNote(l.id, kind, el.value);
    else store.setMeta(l.id, key, kind, el.value.trim());
  }

  /** The live `data-note-clear` handler (app.js 4096-4111): empty the sibling
   *  textarea through a synthetic `input` event, so the same handler above
   *  updates the model, the storage and the address - no second copy of that
   *  logic here. */
  function clearNote(e: MouseEvent): void {
    const btn = e.currentTarget as HTMLElement;
    const ta = btn.closest('.nfield')?.querySelector('textarea');
    if (!ta) return;
    const was = ta.value;
    if (!was) return;
    const put = (v: string): void => {
      ta.value = v;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    };
    put('');
    app.say(t.noteCleared, {
      action: {
        label: t.undo,
        run: () => {
          put(was);
        }
      }
    });
  }

  /** The live `data-note-toggle` handler (app.js 4113-4123): flip the box,
   *  remember the person's own choice, and - only on the way open - auto-size
   *  and focus its first textarea once Svelte has un-hidden it. */
  function toggleNote(id: string, e: MouseEvent): void {
    const btn = e.currentTarget as HTMLElement;
    const box = btn.closest('.lrow')?.querySelector<HTMLElement>('.rnote');
    const wasHidden = boxHidden(id, metaOf(id));
    noteOpen.set(id, wasHidden);
    if (wasHidden && box) {
      void tick().then(() => {
        for (const ta of box.querySelectorAll<HTMLTextAreaElement>('textarea')) autoSize(ta);
        box.querySelector('textarea')?.focus();
      });
    }
  }

  /** The live `data-remove` handler (app.js 3944-3969): remember everything
   *  needed to put the entry back exactly where it was, then offer to. */
  function removeEntry(it: Record_, i: number): void {
    const l = own;
    if (!l) return;
    const meta = { ...itemMeta(l, it.id) };
    const listId = l.id;
    store.removeEntry(listId, it.id);
    app.say(t.removedItem.replace('%s', nameOf(it, app.lang)), {
      action: {
        label: t.undo,
        run: () => {
          store.restoreEntry(listId, it.id, i, meta);
        }
      }
    });
  }

  /** The live `change` handler on the position field (app.js 4545-4549): an
   *  out-of-range or non-numeric value is rejected by putting the field's own
   *  position back - there is nothing to re-render to, since the value is
   *  already right. */
  function setPos(it: Record_, i: number, e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    const l = own;
    if (!l) return;
    const n = parseInt(el.value, 10);
    if (!(n >= 1) || n > l.ids.length) {
      el.value = String(i + 1);
      return;
    }
    store.move(l.id, it.id, n - 1);
  }

  function setQty(id: string, e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    if (own) store.setMeta(own.id, id, 'qty', parseInt(el.value, 10) || 0);
  }
  function setGold(id: string, e: Event): void {
    const el = e.currentTarget as HTMLInputElement;
    if (own) store.setMeta(own.id, id, 'gold', parseInt(el.value, 10) || 0);
  }

  function rollNow(): void {
    roll = pick(items.length, app.env.random);
  }
  function setRoll(n: number): void {
    roll = n;
  }
  function clearRoll(): void {
    roll = 0;
  }

  function pickRow(id: string, on: boolean): void {
    if (on) lsel.add(id);
    else lsel.delete(id);
  }
  function pickAll(on: boolean): void {
    lsel.clear();
    if (on && own) for (const id of own.ids) lsel.add(id);
  }

  /* Drag through the `nativeDrag` port's live event model (app.js 4443-4530):
     the port owns every listener and the edge-scroll loop, and reports back
     which row is being dragged and where it would land so the template can
     drive the three classes below off state rather than off a class the port
     would have to toggle itself. */
  $effect(() => {
    const el = rowsEl;
    const l = own;
    if (!el || !l) return;
    return app.env.drag.bind(el, {
      onDrop: (from, to) => {
        const id = l.ids[from];
        if (id !== undefined) store.move(l.id, id, to);
      },
      onDrag: (from) => {
        dragFrom = from;
      },
      onOver: (over, where) => {
        dragMark = where ? { over, where } : null;
      },
      onEnd: () => {
        dragFrom = -1;
        dragMark = null;
      }
    });
  });

  /* The live `autoSizeNotes()` on render: every note box sizes to its text
     once the page (or a fresh entry) is on screen. */
  $effect(() => {
    void items;
    untrack(() => {
      for (const ta of document.querySelectorAll<HTMLTextAreaElement>(
        '.lnote textarea, .rnote textarea'
      )) {
        autoSize(ta);
      }
    });
  });

  /* The live `pointerdown`/`pointerup` pair (app.js 4562-4571): a box whose
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
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
    };
  });

  /** Seeds a textarea's text child once, at mount - the live `<textarea>
   *  {esc(value)}</textarea>`. Never re-applied: the component reads edits
   *  through `oninput` rather than binding `value`, exactly as the live
   *  uncontrolled field does, which is what gives the inventory the live
   *  names (a bound value leaves `textContent` empty). */
  function seedText(node: HTMLTextAreaElement, value: string): void {
    node.textContent = value;
  }
</script>

{#snippet notePair(o: { note?: string | undefined; hnote?: string | undefined }, key: string)}
  <div class="npair">
    <div class="nfield n-pub">
      <span class="nlbl"
        ><Icon name="eye" />{t.notePub}<i>{t.notePubHint}</i><button
          type="button"
          class="note-x"
          title={t.noteClear}
          aria-label={t.noteClear}
          onclick={clearNote}>&times;</button
        ></span
      >
      <textarea
        rows="3"
        placeholder={key === 'list' ? t.listNotePhPub : t.notePhPub}
        use:seedText={o.note ?? ''}
        oninput={(e) => {
          noteInput(key, 'note', e);
        }}></textarea>
    </div>
    <div class="nfield n-hid">
      <span class="nlbl"
        ><Icon name="eyeOff" />{t.noteHid}<i>{t.noteHidHint}</i><button
          type="button"
          class="note-x"
          title={t.noteClear}
          aria-label={t.noteClear}
          onclick={clearNote}>&times;</button
        ></span
      >
      <textarea
        rows="3"
        placeholder={key === 'list' ? t.listNotePhHid : t.notePhHid}
        use:seedText={o.hnote ?? ''}
        oninput={(e) => {
          noteInput(key, 'hnote', e);
        }}></textarea>
    </div>
  </div>
{/snippet}

{#snippet hitnote(icon: IconName, label: string, text: string | undefined)}
  {#if text}
    <div class="hitnote">
      <Icon name={icon} />
      <span
        ><b>{label}</b>{#each text.split('\n') as line, i (i)}{#if i > 0}<br
            />{/if}{line}{/each}</span
      >
    </div>
  {/if}
{/snippet}

{#if !index}
  <p class="miss">{t.noData}</p>
{:else if route.kind === 'storedList' && !own}
  <h1 class="page-h">{t.listNotFound}</h1>
  <p class="page-sub">{t.listNotFoundSub}</p>
  <Button variant="primary" href={sectionHash('lists')} sameTab>{t.lists}</Button>
{:else if !own}
  <!-- B5.6's shared page: a payload that decodes to nobody's list. -->
  <p class="todo">{app.hash}</p>
{:else}
  <!-- The live app's own shape: the heading carries no text of its own, only
       the rename input - `renderOneList` writes no separate title. -->
  <!-- svelte-ignore a11y_missing_content -->
  <h1 class="page-h">
    <input
      type="text"
      class="titleinput"
      value={own.name}
      aria-label={t.rename}
      oninput={rename}
    />
  </h1>
  <p class="page-sub">{String(items.length)} {itemsWord(items.length, app.lang)}</p>
  <div class="card-acts" style="margin-bottom:16px">
    <Button size="sm" onclick={() => void sharePlayers()}
      ><Icon name="link" />{t.sharePlayers}</Button
    >
    <Button size="sm" onclick={() => void shareGm()}><Icon name="link" />{t.shareGm}</Button>
    <Button size="sm" onclick={() => void copyList()}><Icon name="copy" />{t.copyText}</Button>
    {#if items.length}
      <Button size="sm" href={printHash(items.map((x) => x.id))} sameTab title={t.printHint}
        ><Icon name="print" />{t.print}</Button
      >
    {/if}
    <Button size="sm" variant="danger" onclick={del}>{t.del}</Button>
  </div>

  <StorageNotice {app} />

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

  <details class="lnote" open={untrack(() => !!(own.note || own.hnote))}>
    <summary><Icon name="note" /><span>{t.listNote}</span></summary>
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
    {@render notePair(own, 'list')}
  </details>

  {#if items.length > 1}
    <details class="panel lroll">
      <summary><Icon name="die" /><span>{t.rollBy}</span></summary>
      <Field label="{t.rollResult} (1–{items.length})" after={hit ? 14 : 0}>
        <div class="numrow">
          <NumberField
            value={roll}
            min={1}
            max={items.length}
            empty
            label={t.rollResult}
            stepDownLabel={t.stepDown}
            stepUpLabel={t.stepUp}
            onchange={setRoll}
          />
          <Button variant="primary" onclick={rollNow}
            ><Die faces={items.length} />{rollLabel}</Button
          >
          {#if hit}<Button variant="ghost" onclick={clearRoll}>{t.clear}</Button>{/if}
        </div>
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
              onopen={(r: Record_) => {
                open = r;
              }}
            >
              {#snippet nameActions()}
                <RecordActions {app} {index} {it} row="name" {say} />
              {/snippet}
              {#snippet actions()}
                <RecordActions
                  {app}
                  {index}
                  {it}
                  row="card"
                  {say}
                  extra={entryNoteBlock(metaOf(it.id), t)}
                />
              {/snippet}
            </RecordCard>
          {/snippet}
        </OrGrid>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render hitnote('eye', t.notePub, metaOf(h.id).note)}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render hitnote('eyeOff', t.noteHid, metaOf(h.id).hnote)}
      {/if}
    </details>
  {/if}

  {#if items.length}
    <div class="batch" class:on={lsel.size > 0}>
      <label class="batch-all"
        ><input
          type="checkbox"
          checked={lsel.size > 0 && lsel.size === own.ids.length}
          onchange={(e) => {
            pickAll(e.currentTarget.checked);
          }}
        />{lsel.size ? `${t.pickedN} ${String(lsel.size)}` : t.pickAll}</label
      >
    </div>
    <div class="rows lrows" bind:this={rowsEl}>
      {#each items as it, i (it.id)}
        {@const m = metaOf(it.id)}
        {@const hasNote = !!(m.note || m.hnote)}
        <div
          class="row lrow"
          class:has-note={hasNote}
          class:dragging={dragFrom === i}
          class:drop-before={dragMark?.over === i && dragMark.where === 'before'}
          class:drop-after={dragMark?.over === i && dragMark.where === 'after'}
          data-index={i}
        >
          <span
            class="lrow-grip"
            draggable="true"
            data-drag="{own.id}:{it.id}"
            title={t.dragHint}
            aria-hidden="true"><Icon name="grip" /></span
          >
          <label class="lrow-pick"
            ><input
              type="checkbox"
              checked={lsel.has(it.id)}
              aria-label={t.pickRow}
              onchange={(e) => {
                pickRow(it.id, e.currentTarget.checked);
              }}
            /></label
          >
          <input
            type="number"
            class="lrow-n"
            min="1"
            max={own.ids.length}
            inputmode="numeric"
            value={i + 1}
            aria-label={t.position}
            onchange={(e) => {
              setPos(it, i, e);
            }}
          />
          <RowMain
            {it}
            {index}
            lang={app.lang}
            artBroken={(id: string) => app.artBroken(id)}
            onartfail={(bad: string) => {
              app.markArtBroken(bad);
            }}
            onopen={(r: Record_) => {
              open = r;
            }}
          />
          <div class="lrow-meta">
            <label
              ><span>{t.qty}</span><input
                type="number"
                min="1"
                max="99"
                inputmode="numeric"
                data-qty
                value={m.qty || ''}
                placeholder="1"
                oninput={(e) => {
                  setQty(it.id, e);
                }}
              /></label
            >
            <label
              ><span
                >{t.gold}{#if goldText(m.gold ?? 0)}<span
                    class="goldhint"
                    data-goldhint={goldText(m.gold ?? 0)}
                    title={goldText(m.gold ?? 0)}>?</span
                  >{/if}</span
              ><input
                type="number"
                min="0"
                max="99999"
                inputmode="numeric"
                data-gold
                value={m.gold || ''}
                placeholder="—"
                title={goldText(m.gold ?? 0) || undefined}
                oninput={(e) => {
                  setGold(it.id, e);
                }}
              /></label
            >
          </div>
          <div class="lrow-acts">
            <button
              type="button"
              class="lrow-note"
              class:on={hasNote}
              title={t.note}
              aria-label={t.note}
              onclick={(e) => {
                toggleNote(it.id, e);
              }}><Icon name="note" /></button
            >
            <button
              type="button"
              class="row-x"
              title={t.removeItem}
              aria-label={t.removeItem}
              onclick={() => {
                removeEntry(it, i);
              }}>&times;</button
            >
          </div>
          <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
          <div class="rnote" hidden={boxHidden(it.id, m)}>{@render notePair(m, it.id)}</div>
        </div>
      {/each}
    </div>
  {:else}
    <Empty>{t.listEmptyHint}</Empty>
  {/if}
{/if}

{#if open && index}
  <RecordModal
    {app}
    {index}
    it={open}
    extra={entryNoteBlock(metaOf(open.id), t)}
    onclose={() => {
      open = null;
    }}
    onopen={(r: Record_) => {
      open = r;
    }}
  />
{/if}

<style>
  /* off `.page-h` (style.css:105) */
  .page-h {
    margin: 0 0 4px;
    font-size: 23px;
    font-weight: 680;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* off `.page-sub` (style.css:140) */
  .page-sub {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 14px;
    max-width: 70ch;
  }

  .miss,
  .todo {
    margin: 0;
    color: var(--muted2);
  }

  .todo {
    font-family: var(--mono);
    font-size: var(--step--1);
  }

  /* off the global `input[type=text]` rule (style.css:254-258), scoped as
     `ListsPage.svelte` already does, then `.titleinput` (848-853) - the
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
    font-size: 23px;
    font-weight: 680;
    letter-spacing: -0.01em;
    padding: 0 0 4px;
  }

  .titleinput:focus {
    outline: none;
    border-bottom-color: var(--gold);
  }

  .titleinput:hover {
    border-bottom-color: var(--muted2);
  }

  /* off `.card-acts` (style.css:405) - `margin-bottom:16px` is the live
     inline style on this specific block, written directly in the markup
     above rather than as a class rule. */
  .card-acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: auto;
    padding-top: 3px;
  }

  /* off `.money`, `.money-l`, `.money-br`, `.money-help` (style.css:694-702).
     `.money-help` reaches into `HelpBox`'s own root, hence `:global()`. */
  .money {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    margin: 0 0 14px;
  }

  .money-l {
    font: 650 11px/1 var(--mono);
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

  /* off `.lnote` and its family (style.css:636-644) */
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
    font: 650 11px/1 var(--mono);
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
     (style.css:646-657) */
  .lnote textarea,
  .rnote textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    background: var(--bg2);
    border: 1px solid var(--line2);
    border-radius: 8px;
    color: var(--txt);
    font: 14px/1.5 var(--ui);
    padding: 9px 11px;
    max-height: 320px;
    overflow-y: auto;
  }

  .rnote textarea {
    font-size: 13px;
    background: var(--surface);
  }

  .lnote textarea:focus,
  .rnote textarea:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  /* off `.npair`, `.nfield`, `.nlbl` (both declarations, style.css:663 and
     1088), `.nlbl i`, `.n-hid textarea`, the 640px override (659-670) */
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
    font: 650 10.5px/1 var(--mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .nlbl i {
    font-style: normal;
    font-size: 10.5px;
    letter-spacing: 0.02em;
    text-transform: none;
    color: var(--muted2);
    opacity: 0.75;
    font-weight: 400;
  }

  .n-hid textarea {
    border-style: dashed;
  }

  @media (max-width: 640px) {
    .npair {
      grid-template-columns: 1fr;
    }
  }

  /* off `.note-x`, `:hover`, `.nfield:has(textarea:placeholder-shown)
     .note-x` (style.css:1089-1096) */
  .note-x {
    margin-left: auto;
    width: 20px;
    height: 20px;
    flex: none;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--muted2);
    font: 400 17px/1 var(--ui);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
  }

  .note-x:hover {
    background: var(--surface);
    color: var(--txt);
  }

  .nfield:has(textarea:placeholder-shown) .note-x {
    display: none;
  }

  /* off `.panel` (style.css:145-149) */
  .panel {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
  }

  /* off `.lroll` and its family (style.css:679-687) */
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
    font: 650 11px/1 var(--mono);
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

  /* off `.rollhint` (style.css:690) */
  .rollhint {
    margin: 10px 0 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  /* off `.numrow` (style.css:181) */
  .numrow {
    display: flex;
    gap: 10px;
    align-items: stretch;
    flex-wrap: wrap;
  }

  /* off `.hitnote` and its four (style.css:626-633) */
  .hitnote {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--line2);
    border-left: 2px solid var(--gold);
    border-radius: 9px;
    background: rgb(216 171 94 / 6%);
    font-size: 13px;
    line-height: 1.5;
    color: var(--txt);
  }

  .hitnote :global(svg) {
    fill: var(--gold);
    margin-top: 3px;
    flex: none;
  }

  .hitnote + .hitnote {
    margin-top: 8px;
  }

  .hitnote b {
    display: block;
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
    font-weight: 650;
    margin-bottom: 2px;
  }

  .hitnote span {
    min-width: 0;
    overflow-wrap: break-word;
  }

  /* off `.batch`, `.batch.on`, `.batch-all`, `.batch.on .batch-all`
     (style.css:1050-1058) */
  .batch {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin: 16px 0 0;
    padding: 8px 12px;
    border-radius: 10px 10px 0 0;
    border: 1px solid var(--line2);
    border-bottom: none;
    background: var(--surface);
  }

  .batch.on {
    border-color: var(--gold);
    background: rgb(216 171 94 / 7%);
  }

  .batch-all {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font: 650 11px/1 var(--mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .batch.on .batch-all {
    color: var(--gold-soft);
  }

  /* off `.rows`, `.row`, the `(hover:hover)` `.row:hover` (style.css:547-553)
     - the third copy of three short rules, recorded (plan.md, "Decided"). */
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
    transition: 0.15s;
    overflow: hidden;
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

  /* the `.lrow` family: `.lrow`, `.rnote`, `.lrow.has-note`,
     `.lrow-acts .lrow-note`, `.on`, `svg` (style.css:618-623) */
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

  .lrow-acts .lrow-note {
    color: var(--muted2);
  }

  .lrow-acts .lrow-note.on {
    color: var(--gold);
    background: rgb(216 171 94 / 12%);
  }

  .lrow-acts .lrow-note :global(svg) {
    display: block;
    margin: 0 auto;
  }

  /* off `.lrow-grip`, `:hover`, `:active`, `.lrow-n` and its three
     (style.css:732-746) */
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

  .lrow-n {
    flex: none;
    align-self: stretch;
    width: 40px;
    box-sizing: border-box;
    padding: 0 2px;
    border: 0;
    border-right: 1px solid var(--line);
    font: 650 12px/1 var(--mono);
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

  /* off `.lrow.dragging`, `.drop-before`, `.drop-after` (style.css:747-749) */
  .lrow.dragging {
    opacity: 0.45;
  }

  .lrow.drop-before {
    box-shadow: inset 0 3px 0 0 var(--gold);
  }

  .lrow.drop-after {
    box-shadow: inset 0 -3px 0 0 var(--gold);
  }

  /* off `.lrow-meta` and its nine, including `.goldhint` and the
     `:hover`/`:focus-within` pair (style.css:750-776) */
  .lrow-meta {
    flex: none;
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 8px 10px;
    border-left: 1px solid var(--line);
  }

  .lrow-meta label {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .lrow-meta span {
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .goldhint {
    width: 13px;
    height: 13px;
    flex: none;
    border-radius: 50%;
    cursor: help;
    border: 1px solid var(--line2);
    color: var(--muted2);
    font: 700 9px/1 var(--ui);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
  }

  .goldhint:hover,
  .lrow-meta label:hover .goldhint,
  .lrow-meta label:focus-within .goldhint {
    border-color: var(--gold);
    color: var(--gold-soft);
  }

  .lrow-meta input {
    width: 64px;
    height: 30px;
    padding: 0 8px;
    border-radius: 7px;
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: 600 13px/1 var(--mono);
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

  /* off `.lrow-acts` and its four (style.css:777-784) */
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
    font-size: 14px;
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
    font-size: 18px;
  }

  /* off `.lrow-pick` (style.css:1083) */
  .lrow-pick {
    display: flex;
    align-items: center;
    padding: 0 2px 0 10px;
    flex: none;
  }

  /* off the focus rules for `.lrow-acts button`, `.row-x`, `.lrow-grip`
     (style.css:999-1004), this component's own share of that combined
     selector. */
  .lrow-acts button:focus-visible,
  .row-x:focus-visible,
  .lrow-grip:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    border-radius: 8px;
  }

  /* off the 600px block for `.lrow`, `.lrow .row-main`, `.lrow-meta`,
     `.lrow-acts`, its `button`, `.row-x` (style.css:890-895) */
  @media (max-width: 600px) {
    .lrow {
      flex-wrap: wrap;
    }

    .lrow > :global(.row-main) {
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

    .lrow-acts button {
      width: 44px;
      min-height: 38px;
    }

    .lrow-acts .row-x {
      border-top: 0;
      border-left: 1px solid var(--line);
    }
  }
</style>
