<script lang="ts">
  /* The ten sections.
   *
   * Real links, not buttons: middle-click, copy-link and open-in-new-tab all
   * work for free, and the address is the state. The separator before Tables
   * is where rolling ends and browsing begins. */
  import { sectionHash } from '../lib/hash.js';
  import type { Dict } from '../lib/dict.js';
  import type { Section } from '../lib/types.js';

  interface Props {
    t: Dict;
    current: Section | null;
    label: string;
  }

  const { t, current, label }: Props = $props();

  const TABS: [Section, keyof Dict][] = [
    ['roll/std', 'std'],
    ['roll/alt', 'alt'],
    ['roll/wondrous', 'wondrous'],
    ['roll/dread', 'dread'],
    ['roll/voa', 'voa'],
    ['roll/dv', 'dv'],
    ['roll/community', 'community'],
    ['tables', 'tables'],
    ['lists', 'lists'],
    ['search', 'search']
  ];

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
    void current;
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
      href={sectionHash(section)}
      class:on={section === current}
      class:sep={section === 'tables'}
      aria-current={section === current ? 'page' : undefined}>{t[key]}</a
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

  /* Eight tabs stopped fitting on one line on a middle-sized screen and the
     rest went off the right edge - sections simply vanished. Narrow scrolls,
     wide wraps. */
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
    font-size: 13.5px;
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

  /* This component's share of style.css's `@media print` block (1403), which
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
