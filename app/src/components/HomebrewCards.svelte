<script lang="ts">
  /* The fold «Карты» on `#/homebrew` (m21 and m02's fold in the homebrew mocks), closed on
     each visit with the set and rule card counts: «Комплекты» and «Карты правил», each with
     its create button under the heading, then its cards by name with «Изменить» and
     «Удалить». One card form is open at a time; «Изменить» opens it in place of the row.
     A delete asks with the count of own items that name the card, which keep its key
     (docs/specs/FEATURES.md, "Homebrew", "Cards"). */
  import Button from './Button.svelte';
  import CardForm from './CardForm.svelte';
  import Field from './Field.svelte';
  import PanelFold from './PanelFold.svelte';
  import { cardUses, type CardKind, type CardRow } from '../lib/homebrew.js';
  import { plural } from '../lib/plural.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Homebrew } from '../state/homebrew.svelte.js';

  interface Props {
    app: AppState;
    store: Homebrew;
  }

  const { app, store }: Props = $props();

  const t = $derived(app.t);
  const lang = $derived(app.lang);

  /* The open form: `new:set`, `new:ref`, a card's id, or none. */
  let editing = $state<string | null>(null);

  const named = (v: { en?: string; ru?: string }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  const sorted = (kind: CardKind): CardRow[] =>
    store.cards
      .filter((c) => c.kind === kind)
      .sort((a, b) => named(a.content).localeCompare(named(b.content), lang));
  const sets = $derived(sorted('set'));
  const refs = $derived(sorted('ref'));
  const count = $derived(
    [
      sets.length ? plural(sets.length, t.hbSetsN, lang) : '',
      refs.length ? plural(refs.length, t.hbRefsN, lang) : ''
    ]
      .filter(Boolean)
      .join(', ') || undefined
  );
  const usesOf = (c: CardRow): number => cardUses(store.items, c.kind, c.key);
  const sourceOf = (c: CardRow): string => {
    const b = c.book_id === null ? undefined : store.book(c.book_id);
    return b ? named(b.content) : '';
  };

  async function remove(c: CardRow): Promise<void> {
    const name = named(c.content);
    const uses = usesOf(c);
    const set = c.kind === 'set';
    const ask = uses
      ? (set ? t.hbDeleteSetUsed : t.hbDeleteRefUsed)
          .replace('%s', name)
          .replace('%r', plural(uses, t.hbItemsIn, lang))
      : (set ? t.hbDeleteSet : t.hbDeleteRef).replace('%s', name);
    if (!app.env.dialog.confirm(ask)) return;
    const r = await store.removeCard(c);
    if (r.ok) app.say((t) => (set ? t.hbSetDeleted : t.hbCardDeleted).replace('%s', name));
    else app.say((t) => t.hbDeleteFailed, { error: true });
  }

  const close = (): void => {
    editing = null;
  };
</script>

{#snippet group(kind: CardKind, label: string, add: string, none: string, cards: CardRow[])}
  <Field {label} heading>
    <div class="group">
      {#if editing === 'new:' + kind}
        <CardForm
          {app}
          {store}
          id={'hb-card-new-' + kind}
          {kind}
          card={null}
          bookId={null}
          withBook
          onsaved={close}
          oncancel={close}
        />
      {:else}
        <div>
          <Button
            size="sm"
            onclick={() => {
              editing = 'new:' + kind;
            }}>{add}</Button
          >
        </div>
      {/if}
      {#if cards.length}
        <ul class="cards">
          {#each cards as c (c.id)}
            {@const uses = usesOf(c)}
            {@const source = sourceOf(c)}
            <li>
              {#if editing === c.id}
                <CardForm
                  {app}
                  {store}
                  id={'hb-card-' + c.id}
                  kind={c.kind}
                  card={c}
                  bookId={c.book_id}
                  withBook
                  hint={uses > 0 ? plural(uses, t.hbCardEditN, lang) : undefined}
                  onsaved={close}
                  oncancel={close}
                />
              {:else}
                <div class="head">
                  <span class="name">{named(c.content)}</span>
                  <span class="count"
                    >{plural(uses, t.hbItemsN, lang)}{#if source}{' · ' + source}{/if}</span
                  >
                  <span class="acts">
                    <Button
                      size="sm"
                      onclick={() => {
                        editing = c.id;
                      }}>{t.edit}</Button
                    >
                    <Button size="sm" variant="danger" onclick={() => void remove(c)}
                      >{t.del}</Button
                    >
                  </span>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="note">{none}</p>
      {/if}
    </div>
  </Field>
{/snippet}

<!-- eslint-disable @typescript-eslint/no-confusing-void-expression -- a `{@render}` tag
     reads as a void expression to this rule. -->
<PanelFold label={t.hbCards} {count}>
  {@render group('set', t.hbSets, t.hbAddSet, t.hbNoSets, sets)}
  {@render group('ref', t.hbRefs, t.hbCardNew, t.hbNoRefs, refs)}
</PanelFold>

<style>
  .group {
    display: grid;
    gap: var(--gap-sm);
  }

  .cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }

  .cards li {
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }

  .cards li:first-child {
    border-top: 0;
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }

  .name {
    font-weight: 600;
  }

  .count,
  .note {
    font-size: 13px;
    color: var(--muted2);
  }

  .note {
    margin: 0;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
    margin-left: auto;
  }
</style>
