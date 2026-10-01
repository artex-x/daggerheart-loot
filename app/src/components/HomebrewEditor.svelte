<script lang="ts">
  /* `#/homebrew/new` and `#/homebrew/<key>`: the editor of one own item (m04, m05,
     m18-m20 and m13's last line in the homebrew mocks), the form beside a live preview.

     The form checks on «Сохранить» only, with the database's own rules; a failed save
     keeps the form, the draft and the guard. The name and the description edit the
     item's own language; the other language is written back untouched. A dirty form
     asks before any navigation and before the tab closes. The editor keeps its own key:
     a save that creates replaces the address and keeps this form mounted. The fold
     «Связи» holds the relations; the preview reads its own index, with the draft in place
     of the stored row, so it draws the draft's ladder, set and reverse links
     (docs/specs/FEATURES.md, "Homebrew";
     docs/decisions/2026-09-30-the-homebrew-editor-keeps-its-save-button-with-a-guard.md). */
  import { tick, untrack } from 'svelte';
  import AddToList from './AddToList.svelte';
  import Button from './Button.svelte';
  import FormField from './FormField.svelte';
  import HomebrewLoad from './HomebrewLoad.svelte';
  import HomebrewRelations from './HomebrewRelations.svelte';
  import NameField from './NameField.svelte';
  import NoticeBox from './NoticeBox.svelte';
  import PageTitle from './PageTitle.svelte';
  import Panel from './Panel.svelte';
  import RecordCard from './RecordCard.svelte';
  import Seg from './Seg.svelte';
  import SignInPrompt from './SignInPrompt.svelte';
  import TextArea from './TextArea.svelte';
  import TextInput from './TextInput.svelte';
  import { limitText } from '../lib/cloudLists.js';
  import { lineMembers } from '../lib/data.js';
  import { HOMEBREW_HASH, homebrewItemHash } from '../lib/hash.js';
  import {
    DESC_MAX,
    editLang,
    itemUses,
    nameTaken,
    SECTIONS_MAX,
    withRecords,
    type BookRef,
    type CardKind,
    type HomebrewContent,
    type ItemRow,
    type Problem
  } from '../lib/homebrew.js';
  import {
    contentOf,
    DICE,
    dmgOf,
    draftOf,
    fieldOf,
    formProblems,
    previewOf,
    problemText,
    type FieldId,
    type ItemDraft
  } from '../lib/homebrewForm.js';
  import {
    EQ_BURDEN,
    EQ_CLS,
    EQ_DT,
    EQ_RANGE,
    EQ_TRAIT,
    EQ_TYPE,
    nameOf
  } from '../lib/i18n.js';
  import { whereFrom } from '../lib/label.js';
  import { plural } from '../lib/plural.js';
  import type { Lang } from '../lib/types.js';
  import type { HomebrewSaved, ListWrite } from '../ports/index.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew, NewIds } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    /** The item's key; null is a new item. Read once: the editor keeps its own. */
    key: string | null;
  }

  const { app, store, key }: Props = $props();

  const t = $derived(app.t);
  const lang = $derived(app.lang);

  /* The item this form edits: `key`, or the key of the item it created. */
  let rowKey = $state<string | null>(untrack(() => key));
  /* The id pair a new item is created with, kept until an `ok`. */
  let ids = $state<NewIds>(untrack(() => store.newIds()));
  let draft = $state<ItemDraft>(draftOf(null, 'ru'));
  /* The draft as loaded, the stored part it came from, its revision, its row. */
  let loaded = $state('');
  let base = $state.raw<HomebrewContent | null>(null);
  let revision = $state<number | null>(null);
  let loadedId = $state<string | null>(null);
  /* The language the name and description are written in: the item's own. */
  let editIn = $state<Lang>('ru');
  let formLoaded = $state(false);
  let missing = $state(false);
  let problems = $state.raw<Problem[]>([]);
  let banner = $state<'conflict' | 'gone' | null>(null);
  let refused = $state<string | null>(null);
  let busy = $state(false);
  let leaving = $state(false);
  /* A delete in this tab: the row leaves the store before the lists are read again, and
     the form must not read that as another tab's delete. */
  let deleting = $state(false);
  /* The inline name field under «Источник» or «Раздел». */
  let adding = $state<'book' | 'section' | null>(null);
  /* The inline set or rule card form inside «Связи». */
  let cardForm = $state<CardKind | null>(null);
  /* The fold «Связи»: open for an item with relations, a save problem inside it, or the
     author's press; it never closes by itself. */
  let relOpen = $state(false);
  let addIds = $state<NewIds | null>(null);
  let summary = $state<HTMLDivElement | undefined>(undefined);
  let formEl = $state<HTMLFormElement | undefined>(undefined);

  const dirty = $derived(formLoaded && JSON.stringify(draft) !== loaded);
  const row = $derived(rowKey === null ? undefined : store.item(rowKey));

  function load(r: ItemRow | null): void {
    editIn = editLang(r?.content ?? null, app.lang);
    base = r?.content ?? null;
    revision = r?.revision ?? null;
    loadedId = r?.id ?? null;
    draft = draftOf(r, editIn);
    const c = r?.content;
    relOpen = !!(c && (c.eq?.line || c.craft || c.craft_from || c.set || c.refs));
    loaded = JSON.stringify(draft);
    problems = [];
    banner = null;
    formLoaded = true;
  }

  /* Decided once the store is first ready, and again only while the form is clean: a
     read that removes the row under a dirty form keeps the typed text and draws the
     `gone` banner. */
  $effect(() => {
    const ready = store.status === 'ready';
    const r = rowKey === null ? null : (store.item(rowKey) ?? null);
    untrack(() => {
      if (!ready || deleting) return;
      if (formLoaded && dirty) {
        if (rowKey !== null && r === null) banner = 'gone';
        return;
      }
      if (rowKey !== null && r === null) {
        missing = true;
        return;
      }
      missing = false;
      if (r === null) {
        if (!formLoaded) load(null);
        return;
      }
      if (!formLoaded || r.id !== loadedId || r.revision !== revision) load(r);
    });
  });

  /* Every navigation and a closing tab ask while the form is dirty. */
  $effect(() => {
    const check = (): boolean => dirty && !leaving;
    const offLeave = app.guardLeave(check);
    const offUnload = app.env.page.guardUnload(check);
    return () => {
      offLeave();
      offUnload();
    };
  });

  const books = $derived(
    [...store.books].sort((a, b) => a.created_at.localeCompare(b.created_at))
  );
  const book = $derived(draft.bookId === null ? undefined : store.book(draft.bookId));
  const bookRef = $derived<BookRef | null>(book ? { ...book.content, key: book.key } : null);
  const named = (v: { en?: string; ru?: string }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  const selfKey = $derived(rowKey ?? ids.key);
  const preview = $derived(previewOf(selfKey, draft, editIn, base, bookRef, store.cardRefs));
  /* The other rungs of the line «В линии» joins: `formProblems` refuses another type. */
  const rungs = $derived(
    draft.line && app.index
      ? lineMembers(app.index, draft.line).filter((r) => r.id !== selfKey)
      : []
  );
  /* The catalog and the own records with the draft in place of the stored row. */
  const previewIndex = $derived.by(() => {
    if (!app.catalog) return app.index;
    const own = store.records.filter((r) => r.id !== selfKey);
    return withRecords(app.catalog, [...own, preview], []);
  });
  const relCount = $derived(
    (draft.kind === 'equip' &&
    (draft.lineMode === 'new' || (draft.lineMode === 'in' && draft.line !== ''))
      ? 1
      : 0) +
      draft.craft.length +
      draft.craftFrom.length +
      (draft.set ? 1 : 0) +
      draft.refs.length
  );
  const title = $derived(nameOf(preview, lang) || t.hbNewItem);
  /* The card's name is a heading: an item with no name yet draws «Новый предмет». */
  const card = $derived(
    nameOf(preview, lang) ? preview : { ...preview, en: t.hbNewItem, ru: t.hbNewItem }
  );
  const sub = $derived(
    whereFrom(preview, lang) +
      (draft.kind === 'equip' && draft.eqTier !== '' && draft.eqTier !== 'A'
        ? ` · ${t.tier} ${draft.eqTier}`
        : '')
  );
  const inLists = $derived(rowKey === null ? 0 : app.listsHolding([rowKey]));

  /* One problem per field, the first; the order is the validators'. */
  const shown = $derived.by(() => {
    const seen: FieldId[] = [];
    const out: { field: FieldId; p: Problem }[] = [];
    for (const p of problems) {
      const field = fieldOf(p);
      if (seen.includes(field)) continue;
      seen.push(field);
      out.push({ field, p });
    }
    return out;
  });
  const problemOf = (field: FieldId): Problem | undefined =>
    shown.find((s) => s.field === field)?.p;
  const errId = (field: FieldId): string | undefined =>
    problemOf(field) ? field + '-err' : undefined;
  const errText = (field: FieldId): string | undefined => {
    const p = problemOf(field);
    return p && problemText(p, t);
  };

  function clear(field: FieldId): void {
    if (problemOf(field)) problems = problems.filter((p) => fieldOf(p) !== field);
  }

  function set<K extends keyof ItemDraft>(k: K, v: ItemDraft[K], field: FieldId): void {
    draft[k] = v;
    clear(field);
  }

  const LABELS = $derived<Record<FieldId, string>>({
    'hb-kind': t.hbKind,
    'hb-type': t.hbType,
    'hb-book': t.hbSource,
    'hb-section': t.hbSection,
    'hb-name': t.hbName,
    'hb-desc': t.hbDesc,
    'hb-tier': t.tier,
    'hb-eqtier': t.tier,
    'hb-cls': t.hbCls,
    'hb-tr': t.hbTrait,
    'hb-rg': t.hbRange,
    'hb-dmg': t.hbDmg,
    'hb-dt': t.hbDt,
    'hb-bu': t.hbBurden,
    'hb-as': t.hbAs,
    'hb-th': t.hbTh,
    'hb-alt-tr': t.hbAlt + ': ' + t.hbTrait,
    'hb-alt-rg': t.hbAlt + ': ' + t.hbRange,
    'hb-alt-dmg': t.hbAlt + ': ' + t.hbDmg,
    'hb-alt-dt': t.hbAlt + ': ' + t.hbDt,
    'hb-line': t.hbLine,
    'hb-craft': t.craftInto,
    'hb-craft-from': t.craftFrom,
    'hb-set': t.setLabel,
    'hb-refs': t.hbRefs
  });

  const REL_FIELDS: readonly FieldId[] = [
    'hb-line',
    'hb-craft',
    'hb-craft-from',
    'hb-set',
    'hb-refs'
  ];

  const lowerFirst = (s: string): string => s.charAt(0).toLocaleLowerCase() + s.slice(1);

  function focusField(field: FieldId): void {
    const id =
      field === 'hb-th'
        ? 'hb-th0'
        : field === 'hb-set' && cardForm === 'set'
          ? 'hb-set-new-name'
          : field === 'hb-refs' && cardForm === 'ref'
            ? 'hb-ref-new-name'
            : field;
    if (field.startsWith('hb-alt')) altOpen = true;
    if (REL_FIELDS.includes(field)) relOpen = true;
    void tick().then(() => {
      document.getElementById(id)?.focus();
    });
  }

  let altOpen = $state(false);
  let altSummary = $state<HTMLElement | undefined>(undefined);
  /* The second set is written when any of its four fields holds a value. */
  const altFilled = $derived(
    !!(draft.altTr || draft.altRg || dmgOf(draft.altDmgDie, draft.altDmgBonus) || draft.altDt)
  );
  const dropAltProblems = (): void => {
    if (problems.some((p) => fieldOf(p).startsWith('hb-alt'))) {
      problems = problems.filter((p) => !fieldOf(p).startsWith('hb-alt'));
    }
  };
  /* An emptied set by any path takes its lines along: they would name a button that has
     left the tree. */
  $effect(() => {
    const filled = altFilled;
    untrack(() => {
      if (filled) altOpen = true;
      else dropAltProblems();
    });
  });

  async function clearAlt(): Promise<void> {
    draft.altTr = '';
    draft.altRg = '';
    draft.altDmgDie = '';
    draft.altDmgBonus = '';
    draft.altDt = '';
    dropAltProblems();
    await tick();
    altSummary?.focus();
  }

  function refusedLine(r: ListWrite | HomebrewSaved): string {
    if (!r.ok && r.error === 'limit') return t.hbNotSaved + ' ' + limitText(r.key, r.value, t);
    return t.hbSaveNetwork;
  }

  /* After a write that created or wrote over the row: the draft is what is stored. */
  function settled(id: string, rev: number, content: HomebrewContent): void {
    loadedId = id;
    revision = rev;
    base = content;
    loaded = JSON.stringify(draft);
    banner = null;
    const name = title;
    app.say((t) => t.hbSaved.replace('%s', name));
  }

  async function create(pair: NewIds, content: HomebrewContent): Promise<void> {
    const r = await store.createItem(pair, draft.bookId, content);
    if (!r.ok) {
      refused = refusedLine(r);
      return;
    }
    rowKey = pair.key;
    ids = store.newIds();
    settled(pair.id, 1, content);
    app.replace(homebrewItemHash(pair.key));
  }

  async function write(content: HomebrewContent, forced: boolean): Promise<void> {
    const r0 = row;
    if (!r0) {
      banner = 'gone';
      return;
    }
    const r = await store.updateItem(
      r0,
      { content, book_id: draft.bookId },
      forced ? null : revision
    );
    if (r.ok) settled(r0.id, r.revision, content);
    else if (r.error === 'conflict' || r.error === 'gone') banner = r.error;
    else refused = refusedLine(r);
  }

  /* Checks first: nothing is sent while a problem remains. `key` is the key the write
     uses: «Новая линия» stores it as the line. */
  async function run(
    key: string,
    send: (content: HomebrewContent) => Promise<void>
  ): Promise<void> {
    if (busy) return;
    refused = null;
    const found = formProblems(draft, editIn, base, store.books, {
      key,
      rungs,
      open: cardForm
    });
    if (found.length) {
      problems = found;
      if (found.some((p) => REL_FIELDS.includes(fieldOf(p)))) relOpen = true;
      await tick();
      summary?.focus();
      return;
    }
    problems = [];
    busy = true;
    try {
      await send(contentOf(draft, editIn, base, key) as HomebrewContent);
    } finally {
      busy = false;
    }
  }

  function save(): Promise<void> {
    return rowKey === null
      ? run(ids.key, (c) => create(ids, c))
      : run(rowKey, (c) => write(c, false));
  }

  async function showNew(): Promise<void> {
    if (dirty && !app.env.dialog.confirm(t.hbDropEdits)) return;
    refused = null;
    if (!(await store.read())) {
      refused = t.hbWriteFailed;
      return;
    }
    const r = rowKey === null ? undefined : store.item(rowKey);
    if (r) load(r);
    else banner = 'gone';
  }

  async function remove(): Promise<void> {
    const r0 = row;
    if (!r0) return;
    const name = nameOf(preview, lang);
    const uses = itemUses(store.items, r0.key);
    const lists = plural(inLists, t.hbListsIn, lang);
    const items = plural(uses, t.hbItemsIn, lang);
    const ask =
      inLists && uses
        ? t.hbDeleteItemInListsRel.replace('%s', name).replace('%l', lists).replace('%r', items)
        : inLists
          ? t.hbDeleteItemInLists.replace('%s', name).replace('%l', lists)
          : uses
            ? t.hbDeleteItemRel.replace('%s', name).replace('%r', items)
            : t.hbDeleteItem.replace('%s', name);
    if (!app.env.dialog.confirm(ask)) return;
    refused = null;
    deleting = true;
    busy = true;
    const r = await store.removeItem(r0);
    busy = false;
    if (!r.ok) {
      deleting = false;
      refused = t.hbDeleteFailed;
      return;
    }
    leaving = true;
    app.say((t) => t.hbDeleted.replace('%s', name));
    app.go(HOMEBREW_HASH);
  }

  /* Enter in a one-line field saves, whatever the kind: the form has several text fields,
     so the browser's own implicit submission would save only a loot form. A name field
     inside the form sends itself and stops the event first. */
  function enterSaves(e: KeyboardEvent): boolean {
    if (e.key !== 'Enter' || e.defaultPrevented) return false;
    const el = e.target;
    return el instanceof HTMLInputElement && !!formEl?.contains(el);
  }

  /* Ctrl+S or Cmd+S saves while the form is on screen. */
  function onkeydown(e: KeyboardEvent): void {
    if (!formLoaded || missing || !app.user) return;
    if (enterSaves(e) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's')) {
      e.preventDefault();
      void save();
    }
  }

  function pickBook(value: string): void {
    if (value === '__new') {
      adding = 'book';
      addIds = store.newIds();
      return;
    }
    draft.bookId = value || null;
    draft.section = null;
    clear('hb-book');
    clear('hb-section');
  }

  function pickSection(value: string): void {
    if (value === '__new') {
      adding = 'section';
      addIds = store.newIds();
      return;
    }
    draft.section = value || null;
    clear('hb-section');
  }

  function closeAdd(): void {
    adding = null;
    addIds = null;
  }

  async function createSource(name: string): Promise<string | null> {
    if (!name.trim()) return t.hbErrSourceName;
    const home = { ru: 'Хоумбрю', en: 'Homebrew' };
    if (nameTaken([...store.books.map((b) => b.content), home], name)) {
      return t.hbSourceTaken.replace('%s', name.trim());
    }
    if (!addIds) return t.hbCreateFailed;
    const pair = addIds;
    const r = await store.createBook(pair, name, lang);
    if (!r.ok) return r.error === 'limit' ? limitText(r.key, r.value, t) : t.hbCreateFailed;
    draft.bookId = pair.id;
    draft.section = null;
    clear('hb-book');
    const made = name.trim();
    app.say((t) => t.hbSourceCreated.replace('%s', made));
    closeAdd();
    return null;
  }

  async function createSection(name: string): Promise<string | null> {
    const b = book;
    if (!b) return t.hbErrBookGone;
    const sections = b.content.sections ?? [];
    if (!name.trim()) return t.hbErrSectionName;
    if (nameTaken(sections, name)) return t.hbSectionTaken.replace('%s', name.trim());
    if (sections.length >= SECTIONS_MAX) {
      return t.hbSectionsFull.replace('%n', String(SECTIONS_MAX));
    }
    if (!addIds) return t.hbWriteFailed;
    const sectionKey = addIds.key;
    const r = await store.addSection(b, sectionKey, name, lang);
    if (!r.ok) {
      return r.error === 'conflict' || r.error === 'gone' ? t.hbBookChanged : t.hbWriteFailed;
    }
    draft.section = sectionKey;
    clear('hb-section');
    const made = name.trim();
    app.say((t) => t.hbSectionCreated.replace('%s', made));
    closeAdd();
    return null;
  }

  const pair = (map: Record<string, readonly [string, string]>) =>
    Object.entries(map).map(([value, words]) => ({
      value,
      label: lang === 'ru' ? words[0] : words[1]
    }));
  const KINDS = $derived([
    { value: 'item' as const, label: t.item },
    { value: 'consumable' as const, label: t.cons },
    { value: 'equip' as const, label: t.fEquip }
  ]);
  const TYPES = $derived(pair(EQ_TYPE) as { value: ItemDraft['t']; label: string }[]);
  const TIERS = $derived([
    { value: '' as const, label: t.hbNone },
    { value: '1' as const, label: '1' },
    { value: '2' as const, label: '2' },
    { value: '3' as const, label: '3' },
    { value: '4' as const, label: '4' },
    { value: 'A' as const, label: t.voaArtifact1 },
    { value: 'C' as const, label: t.voaCursed1 }
  ]);
  const EQ_TIERS = $derived([
    { value: '1' as const, label: '1' },
    { value: '2' as const, label: '2' },
    { value: '3' as const, label: '3' },
    { value: '4' as const, label: '4' },
    { value: 'A' as const, label: t.voaArtifact1 }
  ]);
  const CLASSES = $derived(pair(EQ_CLS) as { value: ItemDraft['cls']; label: string }[]);
  const TRAITS = $derived(pair(EQ_TRAIT) as { value: ItemDraft['tr']; label: string }[]);
  const RANGES = $derived(pair(EQ_RANGE) as { value: ItemDraft['rg']; label: string }[]);
  const DAMAGE = $derived(pair(EQ_DT) as { value: ItemDraft['dt']; label: string }[]);
  const BURDEN = $derived(pair(EQ_BURDEN) as { value: ItemDraft['bu']; label: string }[]);
  const descLength = $derived(Array.from(draft.desc).length);
  const weapon = $derived(draft.kind === 'equip' && draft.t !== 'armor');
</script>

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag
     reads as a void expression to this rule; every field below renders one. -->
{#snippet choice<T extends string>(
  field: FieldId,
  label: string,
  options: readonly { value: T; label: string }[],
  value: T,
  onchange: (v: T) => void,
  required: boolean,
  none: T | undefined
)}
  <FormField {label} {required} error={errText(field)} errorId={errId(field)}>
    <Seg
      id={field}
      label={LABELS[field]}
      {options}
      {value}
      describedby={errId(field)}
      {none}
      {onchange}
    />
  </FormField>
{/snippet}

<!-- «Урон»: a die select and a flat bonus field, one problem for the pair. -->
{#snippet damage(
  field: 'hb-dmg' | 'hb-alt-dmg',
  dieKey: 'dmgDie' | 'altDmgDie',
  bonusKey: 'dmgBonus' | 'altDmgBonus',
  main: boolean
)}
  <div class="dmg">
    <select
      id={field}
      value={draft[dieKey]}
      aria-label={main ? undefined : LABELS[field]}
      aria-required={main ? true : undefined}
      aria-invalid={problemOf(field) ? true : undefined}
      aria-describedby={errId(field)}
      onchange={(e) => {
        set(dieKey, e.currentTarget.value as ItemDraft['dmgDie'], field);
      }}
    >
      <option value="">{t.hbDie}</option>
      {#each DICE as d (d)}
        <option value={d}>{d}</option>
      {/each}
    </select>
    <span class="plus" aria-hidden="true">+</span>
    <TextInput
      id={field + '-bonus'}
      label={main ? t.hbDmgBonus : t.hbAlt + ': ' + t.hbDmgBonus}
      bind:value={draft[bonusKey]}
      inputmode="numeric"
      invalid={!!problemOf(field)}
      describedby={errId(field)}
      autocomplete="off"
      oninput={() => {
        clear(field);
      }}
    />
  </div>
{/snippet}

<!-- A saved item goes into a list as a reference: unsaved edits reach it with «Сохранить». -->
{#snippet addPick()}
  {#if rowKey !== null}
    <AddToList {app} key={rowKey} ids={[rowKey]} primary />
  {/if}
{/snippet}

<svelte:window {onkeydown} />

{#if app.user === null}
  <PageTitle title={t.myItems} sub={t.subHomebrew} />
  <SignInPrompt {app} lead={t.hbSignIn} after={{ hash: app.hash }} />
{:else if app.user === undefined}
  <!-- The session is not known yet. -->
{:else if store.status === 'error' && !formLoaded}
  <PageTitle title={t.myItems} sub={t.subHomebrew} />
  <HomebrewLoad {app} failed />
{:else if !formLoaded && !missing}
  <HomebrewLoad {app} failed={false} />
{:else if missing}
  <PageTitle title={t.notFound} sub={t.notFoundSub} />
  <Button variant="primary" href={HOMEBREW_HASH} sameTab>{t.hbToMyItems}</Button>
{:else}
  <PageTitle {title} {sub} />
  <div class="hbedit">
    <Panel>
      <form
        class="hbform"
        novalidate
        bind:this={formEl}
        onsubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {#if shown.length}
          <div class="errs" role="alert" tabindex="-1" bind:this={summary}>
            <b>{plural(shown.length, t.hbFixN, lang)}</b>
            <ul>
              {#each shown as s (s.field)}
                <li>
                  <button
                    type="button"
                    class="errlink"
                    onclick={() => {
                      focusField(s.field);
                    }}>{LABELS[s.field]} - {lowerFirst(problemText(s.p, t))}</button
                  >
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if banner === 'conflict'}
          <NoticeBox warn>
            {t.hbConflict}
            {#snippet actions()}
              <Button
                size="sm"
                variant="primary"
                onclick={() => {
                  if (rowKey !== null) void run(rowKey, (c) => write(c, true));
                }}>{t.hbSaveMine}</Button
              >
              <Button size="sm" onclick={() => void showNew()}>{t.hbShowNew}</Button>
            {/snippet}
          </NoticeBox>
        {:else if banner === 'gone'}
          <NoticeBox warn>
            {t.hbGone}
            {#snippet actions()}
              <Button
                size="sm"
                variant="primary"
                onclick={() => void run(ids.key, (c) => create(ids, c))}>{t.hbSaveAsNew}</Button
              >
              <Button size="sm" href={HOMEBREW_HASH} sameTab>{t.hbToMyItems}</Button>
            {/snippet}
          </NoticeBox>
        {/if}
        <p class="legend">{t.hbLegend}</p>

        {@render choice(
          'hb-kind',
          t.hbKind,
          KINDS,
          draft.kind,
          (v) => {
            set('kind', v, 'hb-kind');
          },
          false,
          undefined
        )}
        {#if draft.kind === 'equip'}
          {@render choice(
            'hb-type',
            t.hbType,
            TYPES,
            draft.t,
            (v) => {
              set('t', v, 'hb-type');
            },
            false,
            undefined
          )}
        {/if}

        <FormField
          label={adding === 'book' ? undefined : t.hbSource}
          for="hb-book"
          error={adding === 'book' ? undefined : errText('hb-book')}
          errorId={errId('hb-book')}
        >
          {#if adding === 'book'}
            <NameField
              id="hb-book-new"
              label={t.hbNewSource}
              submit={t.create}
              cancel={t.cancel}
              onsubmit={createSource}
              oncancel={closeAdd}
            />
          {:else}
            <select
              id="hb-book"
              value={draft.bookId ?? ''}
              aria-invalid={problemOf('hb-book') ? true : undefined}
              aria-describedby={errId('hb-book')}
              onchange={(e) => {
                pickBook(e.currentTarget.value);
              }}
            >
              <option value="">{t.srcHomebrew}</option>
              {#each books as b (b.id)}
                <option value={b.id}>{named(b.content)}</option>
              {/each}
              {#if draft.bookId !== null && !book}
                <option value={draft.bookId}>?</option>
              {/if}
              <option value="__new">{t.hbSourceNew}</option>
            </select>
          {/if}
        </FormField>
        {#if book}
          <FormField
            label={adding === 'section' ? undefined : t.hbSection}
            for="hb-section"
            error={adding === 'section' ? undefined : errText('hb-section')}
            errorId={errId('hb-section')}
          >
            {#if adding === 'section'}
              <NameField
                id="hb-section-new"
                label={t.hbNewSection}
                submit={t.create}
                cancel={t.cancel}
                onsubmit={createSection}
                oncancel={closeAdd}
              />
            {:else}
              <select
                id="hb-section"
                value={draft.section ?? ''}
                aria-describedby={errId('hb-section')}
                onchange={(e) => {
                  pickSection(e.currentTarget.value);
                }}
              >
                <option value="">{t.hbNoSection}</option>
                {#each book.content.sections ?? [] as s (s.key)}
                  <option value={s.key}>{named(s)}</option>
                {/each}
                <option value="__new">{t.hbSectionNew}</option>
              </select>
            {/if}
          </FormField>
        {/if}

        <FormField
          label={t.hbName}
          for="hb-name"
          required
          error={errText('hb-name')}
          errorId={errId('hb-name')}
        >
          <TextInput
            id="hb-name"
            bind:value={draft.name}
            required
            invalid={!!problemOf('hb-name')}
            describedby={errId('hb-name')}
            autocomplete="off"
            oninput={() => {
              clear('hb-name');
            }}
          />
        </FormField>
        <FormField
          label={t.hbDesc}
          for="hb-desc"
          error={errText('hb-desc')}
          errorId={errId('hb-desc')}
        >
          <TextArea
            id="hb-desc"
            rows={5}
            bind:value={draft.desc}
            invalid={!!problemOf('hb-desc')}
            describedby={errId('hb-desc')}
            oninput={() => {
              clear('hb-desc');
            }}
          />
          {#if descLength > 2500}
            <span class="counter">{descLength} / {DESC_MAX}</span>
          {/if}
        </FormField>

        {#if draft.kind !== 'equip'}
          {@render choice(
            'hb-tier',
            t.tier,
            TIERS,
            draft.tier,
            (v) => {
              set('tier', v, 'hb-tier');
            },
            false,
            undefined
          )}
        {:else}
          <FormField
            label={t.tier}
            required
            error={errText('hb-eqtier')}
            errorId={errId('hb-eqtier')}
          >
            <Seg
              id="hb-eqtier"
              label={t.tier}
              options={EQ_TIERS}
              value={draft.eqTier}
              describedby={errId('hb-eqtier') ?? 'hb-eqtier-hint'}
              onchange={(v: ItemDraft['eqTier']) => {
                set('eqTier', v, 'hb-eqtier');
              }}
            />
            {#if !problemOf('hb-eqtier')}
              <p class="hint" id="hb-eqtier-hint">{t.hbTierHint}</p>
            {/if}
          </FormField>
          {#if weapon}
            {@render choice(
              'hb-cls',
              t.hbCls,
              CLASSES,
              draft.cls,
              (v) => {
                set('cls', v, 'hb-cls');
              },
              true,
              undefined
            )}
            {@render choice(
              'hb-tr',
              t.hbTrait,
              TRAITS,
              draft.tr,
              (v) => {
                set('tr', v, 'hb-tr');
              },
              true,
              undefined
            )}
            {@render choice(
              'hb-rg',
              t.hbRange,
              RANGES,
              draft.rg,
              (v) => {
                set('rg', v, 'hb-rg');
              },
              true,
              undefined
            )}
            <FormField
              label={t.hbDmg}
              for="hb-dmg"
              required
              error={errText('hb-dmg')}
              errorId={errId('hb-dmg')}
            >
              {@render damage('hb-dmg', 'dmgDie', 'dmgBonus', true)}
            </FormField>
            {@render choice(
              'hb-dt',
              t.hbDt,
              DAMAGE,
              draft.dt,
              (v) => {
                set('dt', v, 'hb-dt');
              },
              true,
              undefined
            )}
            {@render choice(
              'hb-bu',
              t.hbBurden,
              BURDEN,
              draft.bu,
              (v) => {
                set('bu', v, 'hb-bu');
              },
              true,
              undefined
            )}
            <details class="alt" bind:open={altOpen}>
              <summary bind:this={altSummary}>{t.hbAlt}</summary>
              <p class="hint" id="hb-alt-hint">{t.hbAltHint}</p>
              {@render choice(
                'hb-alt-tr',
                t.hbTrait,
                TRAITS,
                draft.altTr,
                (v) => {
                  set('altTr', v, 'hb-alt-tr');
                },
                false,
                ''
              )}
              {@render choice(
                'hb-alt-rg',
                t.hbRange,
                RANGES,
                draft.altRg,
                (v) => {
                  set('altRg', v, 'hb-alt-rg');
                },
                false,
                ''
              )}
              <FormField
                label={t.hbDmg}
                for="hb-alt-dmg"
                error={errText('hb-alt-dmg')}
                errorId={errId('hb-alt-dmg')}
              >
                {@render damage('hb-alt-dmg', 'altDmgDie', 'altDmgBonus', false)}
              </FormField>
              {@render choice(
                'hb-alt-dt',
                t.hbDt,
                DAMAGE,
                draft.altDt,
                (v) => {
                  set('altDt', v, 'hb-alt-dt');
                },
                false,
                ''
              )}
              {#if altFilled}
                <Button size="sm" onclick={() => void clearAlt()}>{t.hbAltClear}</Button>
              {/if}
            </details>
          {:else}
            <FormField
              label={t.hbAs}
              for="hb-as"
              required
              error={errText('hb-as')}
              errorId={errId('hb-as')}
            >
              <TextInput
                id="hb-as"
                bind:value={draft.as}
                inputmode="numeric"
                required
                invalid={!!problemOf('hb-as')}
                describedby={errId('hb-as')}
                autocomplete="off"
                oninput={() => {
                  clear('hb-as');
                }}
              />
            </FormField>
            <FormField
              label={t.hbTh}
              for="hb-th0"
              required
              error={errText('hb-th')}
              errorId={errId('hb-th')}
            >
              <div class="pair">
                <TextInput
                  id="hb-th0"
                  bind:value={draft.th0}
                  inputmode="numeric"
                  required
                  invalid={!!problemOf('hb-th')}
                  describedby={errId('hb-th')}
                  autocomplete="off"
                  oninput={() => {
                    clear('hb-th');
                  }}
                />
                <TextInput
                  id="hb-th1"
                  label={t.hbTh + ' 2'}
                  bind:value={draft.th1}
                  inputmode="numeric"
                  required
                  invalid={!!problemOf('hb-th')}
                  describedby={errId('hb-th')}
                  autocomplete="off"
                  oninput={() => {
                    clear('hb-th');
                  }}
                />
              </div>
            </FormField>
          {/if}
        {/if}

        <details class="rel" bind:open={relOpen}>
          <summary
            >{t.hbRelations}{#if relCount > 0}<span class="n">{' · ' + String(relCount)}</span
              >{/if}</summary
          >
          <HomebrewRelations
            {app}
            {store}
            {draft}
            {selfKey}
            {errText}
            {errId}
            {set}
            bind:adding={cardForm}
          />
        </details>

        <div class="buttons">
          <Button variant="primary" disabled={busy} onclick={() => void save()}>{t.save}</Button
          >
          <Button variant="ghost" href={HOMEBREW_HASH} sameTab>{t.cancel}</Button>
          {#if rowKey !== null && row}
            <Button variant="danger" onclick={() => void remove()}>{t.del}</Button>
          {/if}
        </div>
        {#if refused}
          <p class="refused" role="alert">{refused}</p>
        {/if}
        {#if inLists > 0}
          <p class="hint">{plural(inLists, t.hbInListsN, lang)}</p>
        {/if}
      </form>
    </Panel>
    <div class="preview">
      {#if app.index}
        <RecordCard
          it={card}
          index={previewIndex ?? app.index}
          lang={app.lang}
          artBroken={false}
          onartfail={() => {}}
          pick={rowKey !== null && row ? addPick : undefined}
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  .hbedit {
    display: grid;
    gap: 18px;
    align-items: start;
  }

  @media (min-width: 800px) {
    .hbedit {
      grid-template-columns: minmax(0, 1fr) 340px;
    }

    /* A full card with its relations is taller than the viewport: the sticky preview
       scrolls inside, or its bottom stays out of reach. */
    .preview {
      position: sticky;
      top: 130px;
      max-height: calc(100vh - 146px);
      overflow-y: auto;
    }
  }

  .hbform {
    display: grid;
    gap: 16px;
  }

  /* A long choice row wraps instead of running off a narrow screen. */
  .hbform :global(.seg) {
    flex-wrap: wrap;
    width: fit-content;
    max-width: 100%;
    border-radius: var(--r-sm);
  }

  .legend,
  .hint,
  .counter {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .counter {
    justify-self: end;
  }

  .refused {
    margin: 0;
    font-size: 13px;
    color: var(--danger-text);
  }

  select:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  select {
    height: 38px;
    width: auto;
    max-width: 100%;
    padding: 0 10px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
    justify-self: start;
  }

  .pair {
    display: flex;
    gap: var(--gap-sm);
    max-width: 240px;
  }

  .dmg {
    display: flex;
    align-items: center;
    gap: var(--gap-sm);
    max-width: 240px;
  }

  .dmg select {
    flex: none;
  }

  .plus {
    color: var(--muted);
  }

  .alt,
  .rel {
    display: grid;
    gap: 16px;
  }

  .alt > :global(.btn) {
    justify-self: start;
  }

  .alt summary,
  .rel summary {
    cursor: pointer;
    font-size: 13.5px;
    color: var(--gold-soft);
    width: fit-content;
  }

  .rel summary .n {
    color: var(--muted2);
    font-weight: 500;
  }

  .alt[open] summary,
  .rel[open] summary {
    margin-bottom: 12px;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }

  /* The summary box: ImportPanel.svelte's refused-file box, in the warn tokens. */
  .errs {
    padding: 10px 12px;
    border-radius: var(--r-sm);
    background: var(--warn-bg);
    border: 1px solid var(--warn-line);
    color: var(--warn-text);
    font-size: 13px;
    line-height: 1.5;
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

  .errlink {
    border: 0;
    padding: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }

  @media (max-width: 600px) {
    select {
      height: 44px;
    }
  }
</style>
