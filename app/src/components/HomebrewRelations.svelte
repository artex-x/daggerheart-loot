<script lang="ts">
  /* The fields of the editor's «Связи» fold (m04, m05 and m06 in the homebrew mocks):
     «Линия улучшений» for equipment, «Улучшается до» and «Получается из», «Комплект» with
     its inline set form, «Карты правил» with its inline rule card form. The editor draws
     the fold and owns the draft; every change goes through its `set` with a new array. A
     chosen key that resolves to nothing stays until removed, so a save keeps it
     (docs/specs/FEATURES.md, "Homebrew", "Relations"). */
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import CardForm from './CardForm.svelte';
  import FormField from './FormField.svelte';
  import Icon from './Icon.svelte';
  import ItemPicker from './ItemPicker.svelte';
  import Seg from './Seg.svelte';
  import { lineMembers } from '../lib/data.js';
  import { CRAFT_MAX, REFS_MAX, type CardKind } from '../lib/homebrew.js';
  import {
    cardMatches,
    cardOption,
    lineOption,
    recordOption,
    type FieldId,
    type ItemDraft,
    type PickOption
  } from '../lib/homebrewForm.js';
  import { hayFor, matches, statLineFor } from '../lib/search.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    /** The editor's draft; read only here. */
    draft: ItemDraft;
    /** The item's key: never offered to itself. */
    selfKey: string;
    errText: (field: FieldId) => string | undefined;
    errId: (field: FieldId) => string | undefined;
    set: <K extends keyof ItemDraft>(k: K, v: ItemDraft[K], field: FieldId) => void;
    /** The inline card form that is open. */
    adding?: CardKind | null;
  }

  let {
    app,
    store,
    draft,
    selfKey,
    errText,
    errId,
    set,
    adding = $bindable(null)
  }: Props = $props();

  const t = $derived(app.t);
  const lang = $derived(app.lang);
  const index = $derived(app.index);
  const catalog = $derived(app.catalog ?? app.index);
  const statLine = $derived(statLineFor(lang, t));
  const hay = $derived(hayFor(statLine));

  const named = (v: { en?: string; ru?: string }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  const byName = (a: { name: string }, b: { name: string }): number =>
    a.name.localeCompare(b.name, lang);

  /* A new card goes into the item's source while the store holds it. */
  const newCardBook = $derived(
    draft.bookId !== null && store.book(draft.bookId) ? draft.bookId : null
  );

  function itemChosen(ids: readonly string[]): PickOption[] {
    return ids.map((id) => {
      const it = index?.byId.get(id);
      return it ? recordOption(it, lang, t) : { id, name: t.hbGoneItem, meta: '' };
    });
  }

  function findItems(chosen: readonly string[]): (q: string) => PickOption[] {
    return (q) =>
      (index?.searchable ?? [])
        .filter(
          (it) => it.id !== selfKey && !chosen.includes(it.id) && matches(it, q, statLine, hay)
        )
        .map((it) => recordOption(it, lang, t));
  }

  const rungsOf = (line: string) =>
    index ? lineMembers(index, line).filter((r) => r.id !== selfKey) : [];

  const lineChosen = $derived(
    draft.line ? [lineOption(rungsOf(draft.line), draft.line, lang, t)] : []
  );

  function findLines(q: string): PickOption[] {
    const seen: string[] = [];
    const out: PickOption[] = [];
    for (const it of index?.allEquip ?? []) {
      const line = it.eq?.line;
      if (!line || it.eq?.t !== draft.t || it.id === selfKey || line === selfKey) continue;
      if (seen.includes(line) || line === draft.line || !matches(it, q, statLine, hay))
        continue;
      seen.push(line);
      out.push(lineOption(rungsOf(line), line, lang, t));
    }
    return out;
  }

  const ownRefs = $derived(store.cards.filter((c) => c.kind === 'ref'));
  const ownSets = $derived(store.cards.filter((c) => c.kind === 'set'));
  const sourceOf = (bookId: string | null): string => {
    const b = bookId === null ? undefined : store.book(bookId);
    return b ? t.hbTag.replace('%s', named(b.content)) : t.srcHomebrew;
  };

  const refsChosen = $derived(
    draft.refs.map((key): PickOption => {
      const own = ownRefs.find((c) => c.key === key);
      if (own) return cardOption(key, own.content, lang, sourceOf(own.book_id));
      const card = catalog?.refs[key];
      return card
        ? cardOption(key, card, lang, null)
        : { id: key, name: t.hbGoneCard, meta: '' };
    })
  );

  function findRefs(q: string): PickOption[] {
    const out: PickOption[] = [];
    for (const [key, card] of Object.entries(catalog?.refs ?? {})) {
      if (!draft.refs.includes(key) && cardMatches(card, q)) {
        out.push(cardOption(key, card, lang, null));
      }
    }
    for (const c of ownRefs) {
      if (!draft.refs.includes(c.key) && cardMatches(c.content, q)) {
        out.push(cardOption(c.key, c.content, lang, sourceOf(c.book_id)));
      }
    }
    return out;
  }

  const catalogSets = $derived(
    Object.entries(catalog?.sets ?? {})
      .map(([key, s]) => ({ key, name: named(s) }))
      .sort(byName)
  );
  const mySets = $derived(
    ownSets
      .map((c) => ({ key: c.key, name: t.hbTag.replace('%s', named(c.content)) }))
      .sort(byName)
  );
  const setUnknown = $derived(
    draft.set !== '' &&
      !catalogSets.some((s) => s.key === draft.set) &&
      !mySets.some((s) => s.key === draft.set)
  );

  const LINE_MODES = $derived([
    { value: 'unique' as const, label: t.hbLineUnique },
    { value: 'in' as const, label: t.hbLineIn },
    { value: 'new' as const, label: t.hbLineNew }
  ]);
  const fullText = (n: number): string => t.hbPickFull.replace('%n', String(n));

  async function focusId(id: string): Promise<void> {
    await tick();
    document.getElementById(id)?.focus();
  }
</script>

<div class="rel">
  {#if draft.kind === 'equip'}
    <FormField
      label={t.hbLine}
      error={errText('hb-line')}
      errorId={errId('hb-line')}
      help={{ id: 'hb-line-help', text: t.hbLineHelp, lang }}
    >
      <Seg
        id="hb-line"
        label={t.hbLine}
        options={LINE_MODES}
        value={draft.lineMode}
        describedby={errId('hb-line')}
        onchange={(v: ItemDraft['lineMode']) => {
          set('lineMode', v, 'hb-line');
        }}
      />
      {#if draft.lineMode === 'in'}
        <ItemPicker
          id="hb-line-pick"
          label={t.hbLinePick}
          chosen={lineChosen}
          max={1}
          find={findLines}
          placeholder={t.hbFindLine}
          invalid={!!errText('hb-line')}
          describedby={errId('hb-line')}
          {t}
          onpick={(id: string) => {
            set('line', id, 'hb-line');
          }}
          onremove={() => {
            set('line', '', 'hb-line');
          }}
        />
      {/if}
    </FormField>
  {/if}

  <FormField
    label={t.craftInto}
    for="hb-craft"
    error={errText('hb-craft')}
    errorId={errId('hb-craft')}
    help={{ id: 'hb-craft-help', text: t.hbCraftIntoHelp, lang }}
  >
    <ItemPicker
      id="hb-craft"
      label={t.craftInto}
      chosen={itemChosen(draft.craft)}
      max={CRAFT_MAX}
      find={findItems(draft.craft)}
      placeholder={t.hbFindItem}
      placeholderMore={t.hbFindMore}
      full={fullText(CRAFT_MAX)}
      invalid={!!errText('hb-craft')}
      describedby={errId('hb-craft')}
      {t}
      onpick={(id: string) => {
        set('craft', [...draft.craft, id], 'hb-craft');
      }}
      onremove={(id: string) => {
        set(
          'craft',
          draft.craft.filter((x) => x !== id),
          'hb-craft'
        );
      }}
    />
    <p class="hint">{t.hbUpTo8}</p>
  </FormField>

  <FormField
    label={t.craftFrom}
    for="hb-craft-from"
    error={errText('hb-craft-from')}
    errorId={errId('hb-craft-from')}
    help={{ id: 'hb-craft-from-help', text: t.hbCraftFromHelp, lang }}
  >
    <ItemPicker
      id="hb-craft-from"
      label={t.craftFrom}
      chosen={itemChosen(draft.craftFrom)}
      max={CRAFT_MAX}
      find={findItems(draft.craftFrom)}
      placeholder={t.hbFindItem}
      placeholderMore={t.hbFindMore}
      full={fullText(CRAFT_MAX)}
      invalid={!!errText('hb-craft-from')}
      describedby={errId('hb-craft-from')}
      {t}
      onpick={(id: string) => {
        set('craftFrom', [...draft.craftFrom, id], 'hb-craft-from');
      }}
      onremove={(id: string) => {
        set(
          'craftFrom',
          draft.craftFrom.filter((x) => x !== id),
          'hb-craft-from'
        );
      }}
    />
    <p class="hint">{t.hbUpTo8}</p>
  </FormField>

  <FormField
    label={t.setLabel}
    for={adding === 'set' ? undefined : 'hb-set'}
    error={errText('hb-set')}
    errorId={errId('hb-set')}
    help={{ id: 'hb-set-help', text: t.hbSetHelp, lang }}
  >
    {#if adding === 'set'}
      <CardForm
        {app}
        {store}
        id="hb-set-new"
        kind="set"
        card={null}
        bookId={newCardBook}
        hint={t.hbSetInlineHint}
        onsaved={(key: string) => {
          set('set', key, 'hb-set');
          adding = null;
          void focusId('hb-set');
        }}
        oncancel={() => {
          adding = null;
          set('set', draft.set, 'hb-set');
          void focusId('hb-set');
        }}
      />
    {:else}
      <select
        id="hb-set"
        value={draft.set}
        aria-invalid={errText('hb-set') ? true : undefined}
        aria-describedby={errId('hb-set')}
        onchange={(e) => {
          const v = e.currentTarget.value;
          if (v === '__new') {
            e.currentTarget.value = draft.set;
            adding = 'set';
          } else {
            set('set', v, 'hb-set');
          }
        }}
      >
        <option value="">{t.hbNone}</option>
        {#each catalogSets as s (s.key)}
          <option value={s.key}>{s.name}</option>
        {/each}
        {#each mySets as s (s.key)}
          <option value={s.key}>{s.name}</option>
        {/each}
        {#if setUnknown}
          <option value={draft.set}>?</option>
        {/if}
        <option value="__new">{t.hbSetNew}</option>
      </select>
    {/if}
  </FormField>

  <FormField
    label={t.hbRefs}
    for="hb-refs"
    error={errText('hb-refs')}
    errorId={errId('hb-refs')}
    help={{ id: 'hb-refs-help', text: t.hbRefsHelp, lang }}
  >
    <ItemPicker
      id="hb-refs"
      label={t.hbRefs}
      chosen={refsChosen}
      max={REFS_MAX}
      find={findRefs}
      placeholder={t.hbFindCard}
      full={fullText(REFS_MAX)}
      invalid={!!errText('hb-refs')}
      describedby={errId('hb-refs')}
      {t}
      onpick={(id: string) => {
        set('refs', [...draft.refs, id], 'hb-refs');
      }}
      onremove={(id: string) => {
        set(
          'refs',
          draft.refs.filter((x) => x !== id),
          'hb-refs'
        );
      }}
    />
    {#if adding === 'ref'}
      <CardForm
        {app}
        {store}
        id="hb-ref-new"
        kind="ref"
        card={null}
        bookId={newCardBook}
        hint={t.hbCardInlineHint}
        onsaved={(key: string) => {
          set('refs', [...draft.refs, key], 'hb-refs');
          adding = null;
        }}
        oncancel={() => {
          adding = null;
          set('refs', draft.refs, 'hb-refs');
        }}
      />
    {:else if draft.refs.length < REFS_MAX}
      <div>
        <Button
          size="sm"
          onclick={() => {
            adding = 'ref';
          }}><Icon name="plus" />{t.hbNewCard}</Button
        >
      </div>
    {/if}
    <p class="hint">{t.hbRefsHint}</p>
  </FormField>
</div>

<style>
  .rel {
    display: grid;
    gap: 16px;
  }

  .hint {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
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

  select:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  @media (max-width: 600px) {
    select {
      height: 44px;
    }
  }
</style>
