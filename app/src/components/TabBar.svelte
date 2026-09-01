<script lang="ts">
  /* The nine sections.
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
    ['roll/community', 'community'],
    ['tables', 'tables'],
    ['lists', 'lists'],
    ['search', 'search']
  ];
</script>

<nav class="tabs" aria-label={label}>
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
</style>
