<script lang="ts">
  /* The source select of the homebrew import's «Куда» rows and of the bulk move (m15, m24):
     the default source first, then the named sources by creation, then the caller's own
     options; with `section`, a second select of the chosen named source's sections, «Без
     раздела» first. Each select has its visible label (docs/specs/FEATURES.md,
     "Consistency rules", rule 15). Extracted on its second use; static, so the move panel
     draws at once. */
  import type { Snippet } from 'svelte';
  import type { BookRow } from '../lib/homebrew.js';
  import type { Lang } from '../lib/types.js';

  interface Props {
    id: string;
    /** The source select's visible label. */
    label: Snippet;
    books: readonly BookRow[];
    lang: Lang;
    /** The chosen option: `''` the default source, a source id, or an `extra` value. */
    value: string;
    /** The default source's option. */
    home: string;
    /** A named source's option from its name; the name itself when absent. */
    held?: ((name: string) => string) | undefined;
    /** Options after the named sources, in order. */
    extra?: readonly { value: string; label: string }[];
    onchange: (value: string) => void;
    /** The section select, drawn while a named source is chosen. */
    section?:
      | {
          label: string;
          /** `''` for no section. */
          value: string;
          none: string;
          onchange: (key: string) => void;
        }
      | undefined;
    /** The id of a line under the selects that describes them. */
    describedby?: string | undefined;
    /** The label beside the select, as the import's «Куда» rows draw it. */
    inline?: boolean;
  }

  const {
    id,
    label,
    books,
    lang,
    value,
    home,
    held,
    extra = [],
    onchange,
    section,
    describedby,
    inline = false
  }: Props = $props();

  const named = (v: { en?: string; ru?: string }): string =>
    (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';
  const sorted = $derived(
    [...books].sort(
      (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
    )
  );
  const chosen = $derived(sorted.find((b) => b.id === value));
</script>

<div class="pick" class:inline>
  <span class="col">
    <label class="lbl" for={id}>{@render label()}</label>
    <select
      {id}
      {value}
      aria-describedby={describedby}
      onchange={(e) => {
        onchange(e.currentTarget.value);
      }}
    >
      <option value="">{home}</option>
      {#each sorted as b (b.id)}
        <option value={b.id}>{held ? held(named(b.content)) : named(b.content)}</option>
      {/each}
      {#each extra as o (o.value)}
        <option value={o.value}>{o.label}</option>
      {/each}
    </select>
  </span>
  {#if section && chosen}
    <span class="col">
      <label class="lbl" for={id + '-section'}>{section.label}</label>
      <select
        id={id + '-section'}
        value={section.value}
        aria-describedby={describedby}
        onchange={(e) => {
          section.onchange(e.currentTarget.value);
        }}
      >
        <option value="">{section.none}</option>
        {#each chosen.content.sections ?? [] as s (s.key)}
          <option value={s.key}>{named(s)}</option>
        {/each}
      </select>
    </span>
  {/if}
</div>

<style>
  .pick {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px 14px;
  }

  .col {
    display: grid;
    gap: 6px;
    min-width: 0;
    flex: 1 1 220px;
  }

  .lbl {
    font-size: 13px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  /* off the editor's select (`HomebrewEditor.svelte`) */
  select {
    height: 38px;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 0 10px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
  }

  select:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  /* m15's `.srcrow`: the row's name, then its select, wrapping under it on a phone. */
  .pick.inline .col {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    flex: 1 1 100%;
  }

  .pick.inline .lbl {
    flex: 1 1 200px;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--txt);
  }

  /* A long option text never widens the select past its row. */
  .pick.inline select {
    flex: 1 1 220px;
    width: auto;
    min-width: 0;
  }

  @media (max-width: 600px) {
    select {
      height: 44px;
    }
  }
</style>
