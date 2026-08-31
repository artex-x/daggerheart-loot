<script lang="ts">
  /* One record, in full: the picture, the stat line, the description, where it
     sits in an upgrade chain, and the rulebook cards its text names.
     Nothing here injects HTML. The description arrives parsed - see
     lib/desc.ts - so a label is an <i> element and a list is a real <ul>,
     which is both safer and what a screen reader needs to hear. */
  import { artSrc, descParts } from '../lib/desc.js';
  import { dict } from '../lib/dict.js';
  import { recordHash } from '../lib/hash.js';
  import { eqLine, nameOf } from '../lib/i18n.js';
  import type { Index } from '../lib/data.js';
  import type { Lang, Record_ } from '../lib/types.js';
  import type { Snippet } from 'svelte';

  interface Props {
    it: Record_;
    index: Index;
    lang: Lang;
    /** Whether the picture failed to load earlier in this session. */
    artBroken: boolean;
    onartfail: (id: string) => void;
    /** Rendered under the card: copy, share, print. Supplied by the route. */
    actions?: Snippet;
  }

  const { it, index, lang, artBroken, onartfail, actions }: Props = $props();

  const t = $derived(dict(lang));
  const name = $derived(nameOf(it, lang));
  const stats = $derived(
    eqLine(it, lang, { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore })
  );
  const parts = $derived(descParts(it, lang));

  const art = $derived(artSrc(it.img, artBroken));

  const upgrade = $derived(it.craft ? index.byId.get(it.craft) : undefined);
  const madeFrom = $derived.by(() => {
    const from = index.craftedFrom.get(it.id);
    return from ? index.byId.get(from) : undefined;
  });
  const refs = $derived(
    (it.refs ?? []).map((k) => index.refs[k]).filter((r) => r !== undefined)
  );
</script>

<article class="card">
  <img
    class="art"
    src={art}
    alt=""
    width="640"
    height="640"
    onerror={() => {
      onartfail(it.id);
    }}
  />

  <div class="body">
    <h1>{name}</h1>

    <p class="kind">
      <span class="badge">{it.kind === 'consumable' ? t.cons : t.item}</span>
      {#if stats}
        <span class="stats">{stats}</span>
      {/if}
    </p>

    <div class="desc">
      {#each parts as part, i (i)}
        {#if part.kind === 'list'}
          <ul>
            {#each part.items as line, j (j)}
              <li>
                {#if line.label}<i>{line.label}:</i>{/if}{line.body}
              </li>
            {/each}
          </ul>
        {:else}
          <p>
            {#if part.label}<i>{part.label}:</i>{/if}{part.body}
          </p>
        {/if}
      {/each}
    </div>

    {#if upgrade || madeFrom}
      <!-- Both directions on the card: where a thing goes, and where it came
           from. Only the forward one travels into a copied message. -->
      <ul class="craft">
        {#if upgrade}
          <li>
            {t.craftInto}: <a href={recordHash(upgrade.id)}>{nameOf(upgrade, lang)}</a>
          </li>
        {/if}
        {#if madeFrom}
          <li>
            {t.craftFrom}: <a href={recordHash(madeFrom.id)}>{nameOf(madeFrom, lang)}</a>
          </li>
        {/if}
      </ul>
    {/if}

    {#if refs.length}
      <!-- Collapsed: the card the text names is worth having to hand, and worth
           not burying the record's own description under. -->
      <div class="refs">
        {#each refs as r, i (i)}
          <details>
            <summary>
              <span class="ref-n">{lang === 'ru' ? r.ru : r.en}</span>
              <span class="ref-s">{lang === 'ru' ? r.rusub : r.ensub}</span>
            </summary>
            <p>{lang === 'ru' ? r.rud : r.ende}</p>
          </details>
        {/each}
      </div>
    {/if}

    {#if actions}
      <div class="actions">{@render actions()}</div>
    {/if}
  </div>
</article>

<style>
  .card {
    display: flex;
    flex-direction: column;
    max-width: 46rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r);
    overflow: hidden;
  }

  .art {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    object-fit: cover;
    background: var(--surface2);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    padding: var(--gap-lg);
  }

  h1 {
    margin: 0;
    font: var(--h-page-weight) var(--h-page-size) / 1.6 var(--ui);
    letter-spacing: var(--h-page-spacing);
  }

  .kind {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--gap-sm);
    margin: 0;
  }

  .badge {
    padding: 2px 8px;
    background: var(--surface2);
    border-radius: var(--r-sm);
    font-size: var(--step--1);
  }

  .stats {
    color: var(--muted);
    font-size: var(--step--1);
  }

  .desc {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
  }

  .desc :global(p),
  .craft,
  .refs p {
    margin: 0;
  }

  .desc ul,
  .craft {
    margin: 0;
    padding-left: 1.2em;
  }

  .craft {
    color: var(--muted);
    font-size: var(--step--1);
  }

  .refs {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
  }

  summary {
    cursor: pointer;
  }

  .ref-s {
    color: var(--muted2);
    font-size: var(--step--1);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }
</style>
