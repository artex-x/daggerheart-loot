<script lang="ts">
  /* The frame every route sits in: brand, tabs and language. The storage
     notice moved to the lists index, where the live app draws it. */
  import Seg from './Seg.svelte';
  import SelBar from './SelBar.svelte';
  import TabBar from './TabBar.svelte';
  import Toast from './Toast.svelte';
  import { SECTION_LABEL } from '../lib/dict.js';
  import { nameOf } from '../lib/i18n.js';
  import type { Snippet } from 'svelte';
  import type { AppState } from '../state/app.svelte.js';
  import type { Lang } from '../lib/types.js';

  interface Props {
    app: AppState;
    children: Snippet;
  }

  const { app, children }: Props = $props();

  const LANG_OPTIONS: readonly { value: Lang; label: string }[] = [
    { value: 'ru', label: 'RU' },
    { value: 'en', label: 'EN' }
  ];

  /**
   * A record, a section or an owned list titles the tab
   * with its own name ahead of the app's - `<name> — <docTitle>` - and every
   * other route keeps the plain title. Built and reverted once because it
   * moved goldens a batch was not allowed to re-record; landed with the
   * re-record.
   *
   * Keyed off `app.openList` rather than `route.kind === 'storedList'`:
   * `ListPage`'s own mount effect rewrites a `#/lists/<id>` address to the
   * players' payload (`#/l/<payload>`) before anything downstream, this
   * effect included, can see the original `storedList` kind - `openList`
   * is what survives that rewrite.
   */
  $effect(() => {
    document.documentElement.lang = app.lang;
    const route = app.route;
    const own = app.openList ? app.lists.get(app.openList) : undefined;
    const named = route.kind === 'record' ? app.index?.byId.get(route.id) : undefined;
    const name = named
      ? nameOf(named, app.lang)
      : own
        ? own.name
        : app.section
          ? app.t[SECTION_LABEL[app.section]]
          : undefined;
    document.title = name ? `${name} — ${app.t.docTitle}` : app.t.docTitle;
  });

  /** The skip link's own activation, off `#skip` in the live stylesheet's
   *  overlay shape - `href="#main"` stays for a client with no script,
   *  but the SPA's own hash means a browser fragment jump would also route
   *  the app itself: `parseHash('#main')` reads as `unknown` and the app
   *  would replace it with the home section, clearing whatever the person
   *  had selected. Handled here instead: move focus to `#main` directly
   *  and never let the browser touch the address bar at all. */
  function skip(e: MouseEvent): void {
    e.preventDefault();
    document.getElementById('main')?.focus();
  }
</script>

<a class="skip" href="#main" onclick={skip}>{app.t.skipToContent}</a>

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
      <Seg
        options={LANG_OPTIONS}
        value={app.lang}
        label={app.t.langLabel}
        onchange={(l: Lang) => {
          app.setLang(l);
        }}
      />
    </div>
  </div>
  <TabBar t={app.t} current={app.section} label={app.t.sectionsLabel} />
</header>

<main id="main" tabindex="-1">
  {@render children()}
</main>

<!-- The selection bar comes before the footer now, not after - it is
     `position: sticky`, not fixed, and z-index (SelBar.svelte's own
     `.selbarwrap`, 45) is what paints it over the footer whenever it is
     open, so a keyboard user tabbing forward used to reach the footer's
     licence link before the bar's own buttons, the reverse of what is on
     top of what on screen. A sticky box also has a flow position, unlike a
     fixed one: with a selection open the footer is pushed down by exactly
     the bar's own height (measured at 1180: 5885px page height with no
     selection, 5938px with one - the 53px difference is `.selbarwrap`'s own
     height there), and at maximum scroll the bar rests above the footer
     with a ~20px gap rather than overlapping it (measured at both 1180 and
     375). -->
<SelBar {app} />

<!-- The licence notice is on every page on purpose: the terms ask for it, and
     a page that can be linked to directly has to carry it. -->
<footer class="foot">
  <p>
    {app.t.footBefore}<a href="https://www.daggerheart.com" target="_blank" rel="noopener"
      >{app.t.footLink}</a
    >{app.t.footAfter}
  </p>
</footer>

<Toast {app} />

<style>
  /* off `.skip`/`.skip:focus` in style.css - a focused skip
     link is a gold plate pinned over the page's top-left corner, out of
     flow, the same as the live app - not a grey chip that pushes the header
     down while it is focused. */
  .skip {
    position: absolute;
    left: -9999px;
  }

  .skip:focus {
    left: 0;
    top: 0;
    z-index: 300;
    background: var(--gold);
    color: var(--ink-on-gold);
    font-weight: 700;
    padding: 10px 16px;
    border-radius: 0 0 10px 0;
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

  /* off the `@media print` block in style.css (1397-1414) - this component's
     own share: the chrome it owns and `main`'s frame. `.tabs` (`TabBar`),
     `.printbar`, `.psheet`, `.pcard` and the two `.noprint` siblings
     (`SelBar`, `Toast`) each carry their own share of the same block; the page
     colours are in `styles/tokens.css`, which owns `html`/`body` and, being
     emitted after the components, is the only place the override wins. */
  @media print {
    .skip,
    .topbar,
    .foot {
      display: none !important;
    }

    /* `#view` in the live app is `main` here - the same 210mm-plus-padding
       overflow, undone the same way. */
    main {
      max-width: none;
      width: auto;
      padding: 0;
      margin: 0;
    }
  }

  /* The sheet owns its own margins (`.psheet`'s padding is the live layout's
     own measurement); a browser page margin on top of that pushes the grid
     off centre and the third column onto a second page. */
  @page {
    size: A4 portrait;
    margin: 0;
  }
</style>
