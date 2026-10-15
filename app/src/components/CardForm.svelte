<script lang="ts">
  /* One set or rule card form (m21, m04 and m05's inline forms in the homebrew mocks): the
     editor's «+ Новый комплект...» and «Новая карта правил», and the create and edit of
     the Sets and Rules tabs. «Язык текста» shows the fields in either language; a save writes
     both, a language the author did not change as the row holds it now. It checks on its own
     button, draws each field's problem under it and keeps the typed text. A new card keeps
     one id pair until an `ok`, so a press after a lost answer makes no second card
     (docs/specs/FEATURES.md, "Homebrew", "Cards"). A group, never a `<form>`: the editor's
     form holds it. */
  import { tick, untrack } from 'svelte';
  import Button from './Button.svelte';
  import FormField from './FormField.svelte';
  import MarkupField from './MarkupField.svelte';
  import Seg from './Seg.svelte';
  import TextInput from './TextInput.svelte';
  import { limitText } from '../lib/cloudLists.js';
  import {
    CARD_NAME_MAX,
    CARD_SUB_MAX,
    CARD_TEXT_MAX,
    CARD_URL_MAX,
    counterFrom,
    editLang,
    type CardKind,
    type CardRow,
    type Problem
  } from '../lib/homebrew.js';
  import {
    cardContentOf,
    cardDraftOf,
    cardFieldOf,
    cardFormProblems,
    cardProblemText,
    langOptions,
    problemLang,
    type CardDraft,
    type CardFieldId
  } from '../lib/homebrewForm.js';
  import type { MarkupTool } from '../lib/markupEdit.js';
  import type { Lang } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
    /** The fields' id prefix: `<id>-name`, `-sub`, `-text`, `-url`, `-book`. */
    id: string;
    kind: CardKind;
    /** The card an edit changes; null makes a new one. */
    card: CardRow | null;
    /** A new card's source; null is the default source. */
    bookId: string | null;
    /** Draws «Источник». */
    withBook?: boolean;
    /** The line under the buttons. */
    hint?: string | undefined;
    /** Asks before a navigation, a reload or a closed tab drops a changed draft. The
     *  editor's inline forms leave it off: the editor's own checks hold. */
    guard?: boolean;
    onsaved: (key: string) => void;
    oncancel: () => void;
  }

  const {
    app,
    store,
    id,
    kind,
    card,
    bookId,
    withBook = false,
    hint,
    guard = false,
    onsaved,
    oncancel
  }: Props = $props();

  const t = $derived(app.t);
  const lang = $derived(app.lang);
  /* The shown language opens on the card's own; a new card's ids stay as they were when the
     form opened. */
  let editIn = $state<Lang>(untrack(() => editLang(card?.content ?? null, app.lang)));
  const ids = untrack(() => store.newIds());
  let draft = $state<CardDraft>(untrack(() => cardDraftOf(card, bookId)));
  const opened = JSON.stringify(untrack(() => draft));
  let previewing = $state(false);

  $effect(() => {
    if (!guard) return;
    const check = (): boolean => JSON.stringify(draft) !== opened;
    const offLeave = app.guardLeave(check);
    const offUnload = app.env.page.guardUnload(check);
    return () => {
      offLeave();
      offUnload();
    };
  });
  let problems = $state.raw<Problem[]>([]);
  let refused = $state<string | null>(null);
  let busy = $state(false);
  let nameEl = $state<HTMLInputElement | undefined>(undefined);

  $effect(() => {
    nameEl?.focus();
  });

  const ORDER: readonly CardFieldId[] = ['name', 'sub', 'text', 'url'];
  /* A field's line draws the problem of the shown language, or of no language. */
  const inView = (p: Problem): boolean => {
    const of = problemLang(p);
    return of === null || of === editIn;
  };
  const problemOf = (field: CardFieldId): Problem | undefined =>
    problems.find((p) => cardFieldOf(p) === field && inView(p));
  const errId = (field: CardFieldId): string | undefined =>
    problemOf(field) ? `${id}-${field}-err` : undefined;
  const errText = (field: CardFieldId): string | undefined => {
    const p = problemOf(field);
    return p && cardProblemText(kind, p, t, draft[problemLang(p) ?? editIn]);
  };
  const clear = (field: CardFieldId): void => {
    if (problemOf(field)) {
      problems = problems.filter((p) => cardFieldOf(p) !== field || !inView(p));
    }
  };
  const subKey = $derived(editIn === 'ru' ? 'rusub' : 'ensub');
  const textKey = $derived(editIn === 'ru' ? 'rud' : 'ende');
  const TOOLS = $derived<readonly MarkupTool[]>(
    kind === 'set' ? ['bold', 'italic', 'ul'] : ['bold', 'italic', 'ul', 'ol', 'table']
  );

  const named = (v: { en?: string; ru?: string }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  const books = $derived(
    [...store.books].sort((a, b) => a.created_at.localeCompare(b.created_at))
  );
  const label = $derived(
    card ? named(card.content) : kind === 'set' ? t.hbNewSet : t.hbNewCard
  );
  const submit = $derived(card ? t.save : kind === 'set' ? t.hbCreateSet : t.hbCreateCard);
  /* Code points, as the validator counts. */
  const textLength = $derived(Array.from(draft[textKey]).length);

  async function send(): Promise<void> {
    if (busy) return;
    refused = null;
    const others = store.cards.filter((c) => c.kind === kind && c.id !== card?.id);
    /* The untouched language comes from the row as it is now: a conflict reads it again,
       and a retry must keep what another device wrote there. */
    const origin = card ? { base: card.content, draft: JSON.parse(opened) as CardDraft } : null;
    const found = cardFormProblems(kind, draft, origin, others);
    if (found.length) {
      problems = found;
      /* With no problem in view, the form switches to the language of the first one. */
      const of = found.some(inView) ? null : problemLang(found[0] as Problem);
      if (of) editIn = of;
      const first = ORDER.find((f) => problemOf(f)) ?? 'name';
      if (first === 'text') previewing = false;
      await tick();
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    problems = [];
    const content = cardContentOf(kind, draft, origin);
    const ru = draft.ru.trim();
    const en = draft.en.trim();
    const name = lang === 'ru' ? ru || en : en || ru;
    busy = true;
    try {
      if (card) {
        const r = await store.updateCard(
          card,
          { content, book_id: draft.bookId },
          card.revision
        );
        if (r.ok) {
          app.say((t) => t.hbSaved.replace('%s', name));
          onsaved(card.key);
          return;
        }
        /* The read again drops the row, and its form with it: only a toast outlives it. */
        if (r.error === 'gone') {
          app.say((t) => t.hbCardGone, { error: true });
          return;
        }
        refused =
          r.error === 'limit'
            ? limitText(r.key, r.value, t)
            : r.error === 'conflict'
              ? t.hbCardChanged
              : t.hbWriteFailed;
        return;
      }
      const r = await store.createCard(ids, kind, draft.bookId, content);
      if (r.ok) {
        app.say((t) => (kind === 'set' ? t.hbSetCreated : t.hbCardCreated).replace('%s', name));
        onsaved(ids.key);
        return;
      }
      refused = r.error === 'limit' ? limitText(r.key, r.value, t) : t.hbCreateFailed;
    } finally {
      busy = false;
    }
  }

  function onkeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      void send();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      oncancel();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="cardform" role="group" aria-label={label} {onkeydown}>
  <FormField label={t.hbTextLang}>
    <Seg
      label={t.hbTextLang}
      options={langOptions(kind, draft, t)}
      value={editIn}
      onchange={(v: Lang) => {
        editIn = v;
      }}
    />
  </FormField>
  <FormField
    label={kind === 'set' ? t.hbSetName : t.hbCardName}
    for={id + '-name'}
    required
    error={errText('name')}
    errorId={errId('name')}
  >
    <TextInput
      id={id + '-name'}
      bind:value={draft[editIn]}
      lang={editIn}
      bind:el={nameEl}
      maxlength={CARD_NAME_MAX}
      required
      invalid={!!problemOf('name')}
      describedby={errId('name')}
      autocomplete="off"
      oninput={() => {
        clear('name');
      }}
    />
  </FormField>
  {#if kind === 'ref'}
    <FormField
      label={t.hbCardSub}
      for={id + '-sub'}
      error={errText('sub')}
      errorId={errId('sub')}
    >
      <TextInput
        id={id + '-sub'}
        bind:value={draft[subKey]}
        lang={editIn}
        maxlength={CARD_SUB_MAX}
        invalid={!!problemOf('sub')}
        describedby={errId('sub') ?? id + '-sub-hint'}
        autocomplete="off"
        oninput={() => {
          clear('sub');
        }}
      />
      <p class="hint" id={id + '-sub-hint'}>{t.hbCardSubHint}</p>
    </FormField>
  {/if}
  <FormField
    label={kind === 'set' ? t.hbSetBonus : t.hbCardText}
    for={id + '-text'}
    required
    error={errText('text')}
    errorId={errId('text')}
    help={{ id: id + '-text-help', text: t.mdHelp.replace('%n', String(CARD_TEXT_MAX)), lang }}
  >
    <MarkupField
      id={id + '-text'}
      rows={kind === 'set' ? 4 : 5}
      bind:value={draft[textKey]}
      maxlength={CARD_TEXT_MAX}
      invalid={!!problemOf('text')}
      describedby={errId('text')}
      oninput={() => {
        clear('text');
      }}
      label={kind === 'set' ? t.hbSetBonus : t.hbCardText}
      tools={TOOLS}
      preview
      bind:previewing
      {t}
      textLang={editIn}
    />
    {#if textLength > counterFrom(CARD_TEXT_MAX)}
      <span class="counter">{textLength} / {CARD_TEXT_MAX}</span>
    {/if}
  </FormField>
  {#if kind === 'ref'}
    <FormField
      label={t.hbCardUrl}
      for={id + '-url'}
      error={errText('url')}
      errorId={errId('url')}
    >
      <TextInput
        id={id + '-url'}
        bind:value={draft.url}
        maxlength={CARD_URL_MAX}
        placeholder="https://..."
        invalid={!!problemOf('url')}
        describedby={errId('url') ?? id + '-url-hint'}
        autocomplete="off"
        oninput={() => {
          clear('url');
        }}
      />
      <p class="hint" id={id + '-url-hint'}>{t.hbCardUrlHint}</p>
    </FormField>
  {/if}
  {#if withBook}
    <FormField label={t.hbSource} for={id + '-book'}>
      <select
        id={id + '-book'}
        value={draft.bookId ?? ''}
        onchange={(e) => {
          draft.bookId = e.currentTarget.value || null;
        }}
      >
        <option value="">{t.srcHomebrew}</option>
        {#each books as b (b.id)}
          <option value={b.id}>{named(b.content)}</option>
        {/each}
        {#if draft.bookId !== null && !store.book(draft.bookId)}
          <option value={draft.bookId}>?</option>
        {/if}
      </select>
    </FormField>
  {/if}
  <div class="buttons">
    <Button variant="primary" size="sm" disabled={busy} onclick={() => void send()}
      >{submit}</Button
    >
    <Button variant="ghost" size="sm" onclick={oncancel}>{t.cancel}</Button>
  </div>
  {#if refused}
    <p class="refused" role="alert">{refused}</p>
  {/if}
  {#if hint}
    <p class="hint">{hint}</p>
  {/if}
</div>

<style>
  .cardform {
    display: grid;
    gap: 14px;
    padding: 14px;
    border-radius: var(--r-sm);
    background: var(--surface);
    border: 1px solid var(--line2);
  }

  .cardform :global(input) {
    height: 38px;
  }

  /* The language switch keeps its own width, as on the item form. */
  .cardform :global(.seg) {
    width: fit-content;
    max-width: 100%;
  }

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

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
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
    .cardform :global(input),
    select {
      height: 44px;
    }
  }
</style>
