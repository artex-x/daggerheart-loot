<script lang="ts">
  /* The account's lists as rows: a search box from `LIST_SEARCH_AT`, one row each with its count
     in words, and «Новый список». The add-to-list menu and the add sheet draw them
     (docs/specs/FEATURES.md, "Lists"). A row toggles (a record's own menu), adds (the bars'
     menus) or chooses (the add sheet); the check, not a fill, marks a state (DESIGN.md, C61). */
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { knownItems } from '../lib/cloudLists.js';
  import { LIST_SEARCH_AT, matchLists, type StoredList } from '../lib/lists.js';
  import { plural } from '../lib/plural.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The lists, in the order to draw. */
    lists: readonly StoredList[];
    /** `toggle` rows carry `aria-pressed`, `add` rows no state, `choose` rows are the
     *  radios of one group. */
    mode: 'toggle' | 'add' | 'choose';
    /** Prefixes each row's id: two groups on a page never share one. */
    idBase: string;
    /** The check shows on these rows: the lists that hold the record, or the chosen list. */
    checked?: ((l: StoredList) => boolean) | undefined;
    /** The list whose entries a press waits for: its row draws busy. */
    busyId?: string | null;
    /** The search box's text. */
    query: string;
    onquery: (q: string) => void;
    onpick: (l: StoredList) => void;
    /** Draws the «Новый список» row, under a separator when rows show. */
    onnew?: (() => void) | undefined;
    /** Takes the place of the «Новый список» row while a new list is being made. */
    creating?: Snippet | undefined;
    /** Whether the rows draw: false where the reader holds no list. */
    showRows?: boolean;
    /** `aria-labelledby` of the radio group in `choose` mode. */
    labelledby?: string | undefined;
  }

  const {
    app,
    lists,
    mode,
    idBase,
    checked,
    busyId = null,
    query,
    onquery,
    onpick,
    onnew,
    creating,
    showRows = true,
    labelledby
  }: Props = $props();

  const t = $derived(app.t);
  const showSearch = $derived(lists.length >= LIST_SEARCH_AT);
  const shown = $derived(showSearch ? matchLists(lists, query) : lists);
</script>

{#if showSearch}
  <input
    type="search"
    class="pickq"
    value={query}
    placeholder={t.findList}
    aria-label={t.findList}
    oninput={(e) => {
      onquery(e.currentTarget.value);
    }}
  />
{/if}
<!-- Signed out the reader holds no list: the menu is the create slot alone. -->
{#if showRows}
  <div
    class="pickchips"
    role={mode === 'choose' && shown.length ? 'radiogroup' : undefined}
    aria-labelledby={mode === 'choose' && shown.length ? labelledby : undefined}
  >
    {#if shown.length}
      {#each shown as l (l.id)}
        {@const busy = busyId === l.id}
        {@const rid = 'lr-' + idBase + '-' + l.id}
        {@const on = checked?.(l) ?? false}
        <!-- A one-record menu toggles; a bar's only adds, so its rows carry no pressed state.
             The check, not a fill, says "holds it" or "chosen" (C61). The name is the
             list's; the count is its description. -->
        <button
          type="button"
          class="lrow"
          role={mode === 'choose' ? 'radio' : undefined}
          aria-labelledby={rid + '-n'}
          aria-describedby={rid + '-c'}
          aria-pressed={mode === 'toggle' ? on : undefined}
          aria-checked={mode === 'choose' ? on : undefined}
          aria-busy={busy ? 'true' : undefined}
          aria-disabled={busy ? 'true' : undefined}
          onclick={() => {
            if (!busy) onpick(l);
          }}
          >{#if on}<Icon name="check" />{:else}<span class="sp"></span>{/if}<span
            class="ln"
            id={rid + '-n'}>{l.name}</span
          ><span class="lc" id={rid + '-c'}
            >{plural(knownItems(l, app.index?.byId).length, t.itemsN, app.lang)}</span
          ></button
        >
      {/each}
    {:else}
      <span class="picker-none">{t.nothing}</span>
    {/if}
  </div>
{/if}
{#if creating}
  {@render creating()}
{:else if onnew}
  {#if showRows}<span class="lsep" aria-hidden="true"></span>{/if}
  <button type="button" class="lnew" onclick={onnew}><Icon name="plus" />{t.newList}</button>
{/if}

<style>
  /* A list row: the check (or its room), the name on one line, the count in words, never
     cut. 44 px tall up to 760 px, 36 px from 761 px. Neutral: no gold (C61). */
  .lrow,
  .lnew {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    /* A row target up to 600 px (DESIGN.md, "The Phone-First Rule"). */
    min-height: max(36px, var(--thumb) + 4px);
    padding: 0 8px;
    border: 0;
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--txt);
    font: inherit;
    font-size: var(--t-data);
    text-align: left;
    cursor: pointer;
  }

  .lrow:hover:not([aria-disabled='true']),
  .lnew:hover {
    background: var(--surface2);
  }

  .lrow[aria-disabled='true'] {
    opacity: 0.5;
    cursor: default;
  }

  .lrow :global(svg),
  .lnew :global(svg),
  .sp {
    flex: none;
    width: 14px;
    height: 14px;
    fill: currentcolor;
  }

  /* A list name wraps whole (DESIGN.md "Typography", "The Whole Message Rule"); the inset
     keeps a wrapped name off the row's edges. */
  .ln {
    flex: 1 1 auto;
    min-width: 0;
    padding-block: 6px;
    overflow-wrap: anywhere;
  }

  .lc {
    flex: none;
    color: var(--muted2);
    white-space: nowrap;
  }

  .lsep {
    height: 1px;
    margin: 2px 0;
    background: var(--line);
  }

  @media (max-width: 760px) {
    .lrow,
    .lnew {
      min-height: 44px;
    }
  }

  input.pickq {
    width: 100%;
    height: max(32px, var(--thumb));
    padding: 0 10px;
    margin-bottom: 8px;
    box-sizing: border-box;
    background: var(--bg2);
    border: 1px solid var(--line2);
    border-radius: 8px;
    color: var(--txt);
    font: inherit;
    font-size: var(--t-data);
  }

  input.pickq:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  /* The padding and the equal negative margin keep a row's 2px + 2px focus
     ring (tokens.css) inside the scroll box, which would clip it. */
  .pickchips {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    margin: -4px;
  }

  .picker-none {
    font-size: var(--t-data);
    color: var(--muted2);
    padding: 2px 0;
  }

  /* 16 px: a smaller field makes iOS zoom the page on focus (as `RollSelect.svelte`). */
  @media (max-width: 600px) {
    input.pickq {
      font-size: 16px;
    }
  }
</style>
