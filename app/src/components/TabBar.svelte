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
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
    align-items: center;
  }

  a {
    padding: 6px 11px;
    border-radius: var(--r-sm);
    color: var(--muted);
    font: 600 var(--step--1) / 1.2 var(--ui);
    text-decoration: none;
    white-space: nowrap;
  }

  a.on {
    background: var(--surface2);
    color: var(--txt);
  }

  /* Rolling on one side, browsing on the other */
  a.sep {
    margin-left: auto;
  }

  @media (hover: hover) {
    a:hover {
      color: var(--txt);
    }
  }

  @media (max-width: 700px) {
    a.sep {
      margin-left: 0;
    }
  }
</style>
