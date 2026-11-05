<script lang="ts">
  /* One card of the lists index - off `listCardHTML` (`git show 23c00a6^:app.js`). The
     count is a meta line in words, «9 позиций», with "edited N ago" after it; the waiting
     line is a neutral chip inside the link; the actions are the page's «Ещё», and in the
     selection mode a pick box takes their place (docs/specs/FEATURES.md, "Lists"). */
  import type { Snippet } from 'svelte';
  import ArtWell from './ArtWell.svelte';
  import { artSrc } from '../lib/desc.js';
  import { kindGlyph } from '../lib/label.js';
  import type { StoredList } from '../lib/lists.js';
  import { plural } from '../lib/plural.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    list: StoredList;
    href: string;
    /** The entries the data still knows, in list order: what the meta line counts. */
    items: Record_[];
    /** "edited N ago". */
    edited?: string | undefined;
    /** «Новое в списке (N)», for a list with pending requests or unread notices. */
    inbox?: string | undefined;
    /** Whether the pick box is ticked. */
    picked?: boolean;
    /** Draws the pick box, in the selection mode only; called with its new state. */
    onpick?: ((on: boolean) => void) | undefined;
    /** The card's «Ещё», outside the selection mode. */
    actions?: Snippet | undefined;
  }

  const {
    app,
    list,
    href,
    items,
    edited,
    inbox,
    picked = false,
    onpick,
    actions
  }: Props = $props();

  const t = $derived(app.t);
  const meta = $derived(
    [plural(items.length, t.itemsN, app.lang), edited].filter(Boolean).join(' · ')
  );
  const label = $derived(
    [list.name || t.untitled, plural(items.length, t.itemsN, app.lang), edited, inbox]
      .filter(Boolean)
      .join(', ')
  );
</script>

<div class="listcard" class:pickable={!!onpick} class:picked>
  {#if onpick}
    <label class="listcard-pick"
      ><input
        type="checkbox"
        checked={picked}
        aria-label={t.pickList.replace('%s', list.name || t.untitled)}
        onchange={(e) => {
          onpick(e.currentTarget.checked);
        }}
      /></label
    >
  {/if}
  <!-- Whitespace below is content, covering the whole link - see
     docs/specs/COVERAGE.md, "Whitespace text nodes are content". -->
  <!-- prettier-ignore -->
  <a
    class="listcard-main"
    {href}
    aria-label={label}
  ><div class="listcard-top"><b>{list.name}</b></div
  ><p class="listcard-meta">{meta}</p>{#if items.length}<div class="listcard-thumbs"
      >{#each items.slice(0, 6) as it (it.id)}<span class="thumb"
          ><ArtWell glyph={kindGlyph(it.kind, it.eq?.t)}
            >{#if it.img && !app.artBroken(it.id)}<img
                src={artSrc(it.img, false, 'thumb')}
                alt=""
                loading="lazy"
                decoding="async"
                onerror={() => {
                  app.markArtBroken(it.id);
                }}
              />{/if}</ArtWell
          ></span
        >{/each}</div
    >{:else}<p class="listcard-empty">{t.listEmpty}</p>{/if}{#if inbox}<span class="listcard-new">{inbox}</span>{/if}</a
>
  {#if actions}
    <div class="listcard-acts">
      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
      {@render actions()}
    </div>
  {/if}
</div>

<style>
  /* off `.listgrid`..`.listcard-acts` in style.css. No `overflow` clip: the card's «Ещё»
     menu opens past its bottom edge. */
  .listcard {
    position: relative;
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    display: flex;
    flex-direction: column;
    transition: 0.16s;
  }

  .listcard:hover {
    border-color: var(--line2);
  }

  /* The neutral selection (DESIGN.md, "The Seal Rule"): a lit border and the check. */
  .listcard.picked {
    border-color: var(--muted2);
    background: var(--surface2);
  }

  /* A 32 px box in the top right corner; its target is 44 px. */
  .listcard-pick {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
  }

  .listcard-pick::after {
    content: '';
    position: absolute;
    inset: -6px;
  }

  .listcard-pick:hover {
    background: var(--surface2);
  }

  .listcard-pick input {
    width: 17px;
    height: 17px;
    margin: 0;
    accent-color: var(--txt);
  }

  .listcard.pickable .listcard-top {
    padding-right: 34px;
  }

  .listcard-main {
    display: block;
    padding: 14px 15px 12px;
    text-decoration: none;
    color: inherit;
    flex: 1;
  }

  .listcard-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }

  .listcard-top b {
    font-size: var(--t-body);
    font-weight: 650;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .listcard-main:hover .listcard-top b {
    color: var(--gold-soft);
  }

  /* The count, and an account list's last edit, under the name. */
  .listcard-meta {
    margin: -6px 0 10px;
    font-size: var(--t-data);
    color: var(--muted2);
  }

  .listcard-thumbs {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .listcard-thumbs .thumb {
    width: 40px;
    height: 40px;
    border-radius: 7px;
    overflow: hidden;
  }

  .listcard-empty {
    margin: 0;
    font-size: var(--t-data);
    color: var(--muted2);
  }

  /* The pending requests and unread notices: neutral, no gold (DESIGN.md, "The Seal Rule"). */
  .listcard-new {
    display: inline-block;
    margin-top: 10px;
    padding: 3px 8px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface2);
    color: var(--txt);
    font-size: var(--t-label);
    font-weight: 650;
    line-height: 1.3;
  }

  .listcard-acts {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding: 0 10px 10px;
  }
</style>
