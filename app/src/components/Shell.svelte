<script lang="ts">
  /* The frame every route sits in: brand, tabs, language, and the one warning
     that has to be visible before anything else is. */
  import { untrack } from 'svelte';
  import LangSwitch from './LangSwitch.svelte';
  import TabBar from './TabBar.svelte';
  import type { Snippet } from 'svelte';
  import type { AppState } from '../state/app.svelte.js';
  import type { Lang } from '../lib/types.js';

  interface Props {
    app: AppState;
    children: Snippet;
  }

  const { app, children }: Props = $props();

  /* Read once: whether storage works does not change while the page is open,
     and asking on every render costs a write and a delete each time. */
  const storageWorks = untrack(() => app.env.storage.works());

  /* Screen readers and hyphenation both read this, and it has to follow the
     switch rather than the page it was loaded with. */
  $effect(() => {
    document.documentElement.lang = app.lang;
    document.title = app.t.docTitle;
  });
</script>

<a class="skip" href="#main">{app.t.skipToContent}</a>

<header>
  <div class="bar">
    <a class="brand" href="#/roll/std">
      {app.t.brand}<span>{app.t.brandSub}</span>
    </a>
    <LangSwitch
      lang={app.lang}
      label={app.t.langLabel}
      onchange={(l: Lang) => {
        app.setLang(l);
      }}
    />
  </div>
  <TabBar t={app.t} current={app.section} label={app.t.sectionsLabel} />
</header>

{#if !storageWorks}
  <!-- Said plainly and up front: a person about to spend ten minutes building
       a list deserves to know it will not survive a reload. -->
  <p class="warn" role="status">{app.t.storageOff}</p>
{/if}

<main id="main" tabindex="-1">
  {@render children()}
</main>

<style>
  .skip {
    position: absolute;
    left: -9999px;
  }

  .skip:focus {
    position: static;
    display: inline-block;
    margin: var(--gap-sm);
    padding: 8px 12px;
    background: var(--surface2);
    color: var(--txt);
    border-radius: var(--r-sm);
  }

  header {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    padding: var(--gap) var(--gap-lg);
    border-bottom: 1px solid var(--line);
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap);
  }

  .brand {
    color: var(--gold);
    font: 800 var(--step-1) / 1.1 var(--ui);
    text-decoration: none;
  }

  .brand span {
    display: block;
    color: var(--muted2);
    font: 600 var(--step--2) / 1.2 var(--ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .warn {
    margin: 0;
    padding: var(--gap-sm) var(--gap-lg);
    background: rgb(224 104 95 / 12%);
    color: var(--txt);
    font-size: var(--step--1);
  }

  main {
    padding: var(--gap-lg);
  }

  /* The skip link lands here, and a focused region with no ring of its own
     would leave a keyboard user with no idea where they arrived. */
  main:focus-visible {
    outline-offset: -2px;
  }
</style>
