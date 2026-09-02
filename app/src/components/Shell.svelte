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

<header class="topbar">
  <div class="topbar-in">
    <a class="brand" href="#/roll/std">
      <svg class="brand-ico" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l2.6 5.6L20 9.2l-4 4.2.9 5.9L12 16.7 7.1 19.3 8 13.4l-4-4.2 5.4-1.6z" />
      </svg>
      <!-- The wordmark, not a translated string. It is written into
           index.html once in the live app and stays "Лут Daggerheart" in
           English too, the way a logo does; the rewrite had it in the
           dictionary and was quietly turning it into "Loot Daggerheart" on
           every English page. -->
      <span class="brand-txt"><b>Лут</b><i>Daggerheart</i></span>
    </a>
    <div class="topbar-right">
      <LangSwitch
        lang={app.lang}
        label={app.t.langLabel}
        onchange={(l: Lang) => {
          app.setLang(l);
        }}
      />
    </div>
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

<!-- The licence notice is on every page on purpose: the terms ask for it, and
     a page that can be linked to directly has to carry it. -->
<footer class="foot">
  <p>
    {app.t.footBefore}<a href="https://www.daggerheart.com" target="_blank" rel="noopener"
      >{app.t.footLink}</a
    >{app.t.footAfter}
  </p>
</footer>

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

  /* off `.topbar` in style.css. Sticky and translucent: the tabs stay reachable
     while a long table scrolls under them. */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgb(14 12 21 / 86%);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--line);
  }

  .topbar-in {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 11px 0;
    width: var(--wrap);
    margin-inline: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--txt);
  }

  .brand-ico {
    width: 26px;
    height: 26px;
    fill: var(--gold);
    flex: none;
    filter: drop-shadow(0 0 10px rgb(216 171 94 / 35%));
  }

  .brand-txt {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .brand-txt b {
    font-size: 16px;
    letter-spacing: 0.2px;
  }

  .brand-txt i {
    font-style: normal;
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .warn {
    margin: 0;
    padding: var(--gap-sm) var(--gap-lg);
    width: var(--wrap);
    margin-inline: auto;
    background: rgb(224 104 95 / 12%);
    color: var(--txt);
    font-size: var(--step--1);
  }

  /* off `.foot` in style.css */
  .foot {
    width: var(--wrap);
    margin-inline: auto;
    margin-top: 20px;
    padding: 22px 0 40px;
    color: var(--muted2);
    font-size: 12.5px;
    border-top: 1px solid var(--line);
  }

  .foot p {
    margin: 0;
  }

  main {
    /* off `main` in style.css */
    width: var(--wrap);
    margin-inline: auto;
    padding: 26px 0 48px;
    min-height: 60vh;
  }

  /* The skip link lands here, and a focused region with no ring of its own
     would leave a keyboard user with no idea where they arrived. */
  main:focus-visible {
    outline-offset: -2px;
  }
</style>
