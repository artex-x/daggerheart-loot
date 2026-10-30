<script lang="ts">
  /* The three jobs of the header (docs/specs/ROUTES.md, "Sections"). «Бросок» opens the
   * last roll section of this tab (`AppState.rollHash`); the roll sections' own row is
   * `ModeRow.svelte`. The class stays `tabs`: the browser suites read `nav.tabs`.
   *
   * Real links, not buttons: middle-click, copy-link and open-in-new-tab all
   * work for free, and the address is the state. */
  import Icon from './Icon.svelte';
  import { jobOf, type Job } from '../lib/nav.js';
  import type { Dict } from '../lib/dict.js';
  import type { IconName } from '../lib/icons.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const lit = $derived(jobOf(app.section));

  const jobs = $derived<[Job, IconName, keyof Dict, string][]>([
    ['roll', 'die', 'jobRoll', app.rollHash],
    ['tables', 'table', 'tables', '#/tables'],
    ['search', 'search', 'search', '#/search']
  ]);
</script>

<nav class="tabs" aria-label={app.t.sectionsLabel}>
  {#each jobs as [job, icon, key, hash] (job)}
    <a
      href={app.href(hash)}
      data-job={job}
      class:on={job === lit}
      aria-current={job === lit ? 'page' : undefined}><Icon name={icon} />{app.t[key]}</a
    >
  {/each}
</nav>

<style>
  /* off `.tabs` in style.css. Three jobs hold one row at 360 in both languages. */
  .tabs {
    display: flex;
    gap: 4px;
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

  /* This component's share of the `@media print` block of `git show 23c00a6^:style.css`, which
     names `.tabs` alongside `.topbar`. The header is already `display: none` under print;
     a nav that ever moves out of it would otherwise print across the first sheet. */
  @media print {
    .tabs {
      display: none !important;
    }
  }
</style>
