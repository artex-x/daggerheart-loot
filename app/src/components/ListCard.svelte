<script lang="ts">
  /* One card of the lists index - off `listCardHTML` (`git show 23c00a6^:app.js`).
     Extracted on its second use: the account group and the browser group
     draw the same card, the account one with its "edited N ago" line and its
     own actions. */
  import type { Snippet } from 'svelte';
  import Badge from './Badge.svelte';
  import { artSrc } from '../lib/desc.js';
  import type { StoredList } from '../lib/lists.js';
  import { plural } from '../lib/plural.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    list: StoredList;
    href: string;
    /** The entries the data still knows, in list order: what the badge counts. */
    items: Record_[];
    /** "edited N ago", for an account list. */
    edited?: string | undefined;
    actions: Snippet;
  }

  const { app, list, href, items, edited, actions }: Props = $props();

  const t = $derived(app.t);
  const label = $derived(
    [list.name || t.untitled, plural(items.length, t.itemsN, app.lang), edited]
      .filter(Boolean)
      .join(', ')
  );
</script>

<div class="listcard">
  <!-- Whitespace below is content, covering the whole link - see
     docs/specs/COVERAGE.md, "Whitespace text nodes are content". -->
  <!-- prettier-ignore -->
  <a
    class="listcard-main"
    {href}
    aria-label={label}
  ><div class="listcard-top"><b>{list.name}</b><Badge cls="num"
      >{items.length}</Badge
    ></div
  >{#if edited}<p class="listcard-edited">{edited}</p>{/if}{#if items.length}<div class="listcard-thumbs"
      >{#each items.slice(0, 6) as it (it.id)}<img
          src={artSrc(it.img, app.artBroken(it.id), 'thumb')}
          alt=""
          loading="lazy"
          decoding="async"
          onerror={() => {
            app.markArtBroken(it.id);
          }}
        />{/each}</div
    >{:else}<p class="listcard-empty">{t.listEmpty}</p>{/if}</a
>
  <div class="listcard-acts">
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
    {@render actions()}
  </div>
</div>

<style>
  /* off `.listgrid`..`.listcard-acts` in style.css. No `@media` override
     touches any of these. */
  .listcard {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: 0.16s;
  }

  .listcard:hover {
    border-color: var(--line2);
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
    font-size: var(--step-0);
    font-weight: 650;
    line-height: 1.3;
  }

  .listcard-main:hover .listcard-top b {
    color: var(--gold-soft);
  }

  /* An account list's last edit, under the name. */
  .listcard-edited {
    margin: -6px 0 10px;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .listcard-thumbs {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .listcard-thumbs img {
    width: 40px;
    height: 40px;
    border-radius: 7px;
    object-fit: cover;
    background: #0a0810;
  }

  .listcard-empty {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .listcard-acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 0 15px 14px;
  }
</style>
