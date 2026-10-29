<script lang="ts">
  /* Five tabs: `#/lists` is reached from the account menu (docs/specs/ROUTES.md,
   * "Sections"). The six supplement roll sections
   * share one tab, which lights on each of them and links to the first; their
   * page draws a chip panel for the rest (`SupplementNav.svelte`).
   *
   * Real links, not buttons: middle-click, copy-link and open-in-new-tab all
   * work for free, and the address is the state. The separator before Tables
   * is where rolling ends and browsing begins. */
  import { pathOf } from '../lib/address.js';
  import { sectionHash } from '../lib/hash.js';
  import { tabOf } from '../lib/nav.js';
  import type { Dict } from '../lib/dict.js';
  import type { Lang, Section } from '../lib/types.js';

  interface Props {
    t: Dict;
    current: Section | null;
    label: string;
    lang: Lang;
  }

  const { t, current, label, lang }: Props = $props();

  const TABS: [Section, keyof Dict][] = [
    ['roll/std', 'std'],
    ['roll/alt', 'alt'],
    ['roll/wondrous', 'grpSupplements'],
    ['tables', 'tables'],
    ['search', 'search']
  ];

  const lit = $derived(tabOf(current));

  let nav = $state<HTMLElement | undefined>(undefined);

  /**
   * Keeps the lit tab in view inside the narrow-viewport horizontal scroller
   * (`@media (max-width: 640px)`, above) - P11. `scrollIntoView` was rejected
   * in planning: it can carry an ancestor along with it too, and its own
   * `block`/`inline` options answer "is it visible at all", not "is it
   * centred", which is what a bar with a tab list either side of the middle
   * one wants. Plain `offsetLeft` arithmetic against the nav's own width
   * answers that directly, and needs nothing from the browser a test cannot
   * hand it by hand.
   */
  $effect(() => {
    void lit;
    const el = nav;
    const tab = el?.querySelector<HTMLElement>('a.on');
    if (!el || !tab) return;
    const target = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
    el.scrollLeft = Math.max(0, target);
  });
</script>

<nav class="tabs" aria-label={label} bind:this={nav}>
  {#each TABS as [section, key] (section)}
    <a
      href={pathOf(sectionHash(section), lang)}
      class:on={section === lit}
      class:sep={section === 'tables'}
      aria-current={section === lit ? 'page' : undefined}>{t[key]}</a
    >
  {/each}
</nav>

<style>
  /* off `.tabs` in style.css. The nav is the page container too, so it carries
     the same width as the bar above it. */
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    scrollbar-width: none;
    padding-bottom: 2px;
    width: var(--wrap);
    margin-inline: auto;
  }

  /* Narrow scrolls, wide wraps. Five tabs hold one row from 640 px in both
     languages; the wrap is a guard, not a layout. */
  @media (max-width: 640px) {
    .tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
    }
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  a {
    flex: none;
    text-decoration: none;
    color: var(--muted);
    padding: 9px 13px 10px;
    border-bottom: 2px solid transparent;
    font-size: var(--t-small);
    font-weight: 560;
    white-space: nowrap;
    transition: 0.15s;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  a:hover {
    color: var(--txt);
  }

  a.on {
    color: var(--gold-soft);
    border-bottom-color: var(--gold);
  }

  /* Rolling on one side, browsing on the other */
  a.sep {
    margin-left: auto;
  }

  /* This component's share of the `@media print` block of `git show 23c00a6^:style.css`, which
     names `.tabs` alongside `.topbar`. Redundant while the nav sits inside
     `Shell.svelte`'s header - measured under print media, the header is
     already `display: none` and the nav has no client rect - but the live
     rule is per-element, and a nav that ever moves out of the header would
     otherwise start printing across the top of the first sheet. */
  @media print {
    .tabs {
      display: none !important;
    }
  }
</style>
