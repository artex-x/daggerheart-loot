<script lang="ts">
  /* The frame every route sits in: the brand, the three jobs, the language and the
     account control, then the mode row on the roll sections. */
  import AccountMenu from './AccountMenu.svelte';
  import Icon from './Icon.svelte';
  import ModeRow from './ModeRow.svelte';
  import Seg from './Seg.svelte';
  import SelBar from './SelBar.svelte';
  import TabBar from './TabBar.svelte';
  import Toast from './Toast.svelte';
  import { sectionLabel } from '../lib/dict.js';
  import { ACCOUNT_HASH } from '../lib/hash.js';
  import { nameOf } from '../lib/i18n.js';
  import { modeOf } from '../lib/nav.js';
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

  /* The account control waits until the session is known, so a signed-in
     reader never sees «Войти» flash; a build with no sign-in draws none. */
  const accountShown = $derived(app.env.cloud !== null && app.user !== undefined);
  const onAccount = $derived(app.route.kind === 'account');
  /* The account pages light the control's ring: the account, the lists and «Мои
     предметы» with its editor (docs/specs/FEATURES.md, "Chrome"). */
  const acctPage = $derived.by(() => {
    const k = app.route.kind;
    return (
      k === 'account' ||
      k === 'storedList' ||
      k === 'homebrew' ||
      k === 'homebrewItem' ||
      (k === 'section' && app.section === 'lists')
    );
  });
  const userId = $derived(app.user?.userId ?? null);

  /* The account menu forgets itself on a navigation and on a user change. */
  let menuOpen = $state(false);
  let acctButton = $state<HTMLButtonElement | undefined>(undefined);
  let signInLink = $state<HTMLAnchorElement | undefined>(undefined);

  /* Rule 20: «Выйти» removed itself with the menu, so focus goes to «Войти», which now
     holds the account control's place; a refused sign-out keeps the account button. */
  function afterSignOut(): void {
    if (signInLink?.isConnected) signInLink.focus();
    else if (acctButton?.isConnected) acctButton.focus();
    else document.getElementById('main')?.focus();
  }
  $effect(() => {
    void app.navigations;
    void userId;
    menuOpen = false;
  });

  /* Focus that lands outside the control and its menu closes the menu. Only a
     focus that lands somewhere counts: Safari does not focus a pressed button,
     so a click on «Выйти» would read as focus leaving to nothing. */
  function closeOnFocusOut(e: FocusEvent & { currentTarget: HTMLElement }): void {
    const to = e.relatedTarget;
    if (to instanceof Node && !e.currentTarget.contains(to)) menuOpen = false;
  }
  /* On an account list's page, once the account is read, the open list's entries decide. */
  const openListState = $derived.by(() => {
    const r = app.route;
    const cloud = app.cloudLists;
    if (r.kind !== 'storedList' || cloud?.status !== 'ready' || !cloud.get(r.listId)) {
      return cloud?.status;
    }
    const d = cloud.detailOf(r.listId);
    return d === 'ready' || d === 'error' ? d : 'loading';
  });
  const listsState = $derived(
    !app.env.cloud
      ? undefined
      : app.user === undefined
        ? 'pending'
        : app.user
          ? openListState
          : undefined
  );

  /**
   * A record, a section or an owned list titles the tab
   * with its own name ahead of the app's - `<name> - <docTitle>` - and every
   * other route keeps the plain title. Built and reverted once because it
   * moved goldens a batch was not allowed to re-record; landed with the
   * re-record.
   *
   * An account list is read from the store, so a rename retitles the tab. A
   * build with no sign-in keeps the plain title on `#/lists`, its not-found page.
   */
  $effect(() => {
    document.documentElement.lang = app.lang;
    const route = app.route;
    const named =
      route.kind === 'record'
        ? app.index?.byId.get(route.id)
        : route.kind === 'item' && app.itemView?.status === 'ready'
          ? (app.itemView.record ?? undefined)
          : undefined;
    const name = named
      ? nameOf(named, app.lang)
      : route.kind === 'storedList' && app.cloudLists?.get(route.listId)
        ? app.cloudLists.get(route.listId)?.name
        : app.section && (app.section !== 'lists' || app.cloudLists)
          ? sectionLabel(app.section, app.t)
          : !app.env.cloud
            ? undefined
            : route.kind === 'account'
              ? app.t.account
              : route.kind === 'homebrew'
                ? app.t.myItems
                : route.kind === 'homebrewItem'
                  ? homebrewTitle(route.key)
                  : undefined;
    /* The owner's unread purchase requests count before the page's name (docs/specs/FEATURES.md,
       "Purchase requests: the owner"). */
    const unread = app.ownerRequests?.unreadCount(app.now) ?? 0;
    const title = name ? `${name} - ${app.t.docTitle}` : app.t.docTitle;
    document.title = unread > 0 ? `(${String(unread)}) ${title}` : title;
  });

  /* The editor's tab: the item's stored name, or «Новый предмет». */
  function homebrewTitle(key: string | null): string {
    const row = key === null ? undefined : app.homebrew?.item(key);
    const it = row ? app.index?.byId.get(row.key) : undefined;
    return it ? nameOf(it, app.lang) : app.t.hbNewItem;
  }

  /** The skip link's own activation, off `#skip` in the live stylesheet's
   *  overlay shape - `href="#main"` stays for a client with no script, but a
   *  browser fragment jump would add `#main` to the address and a history
   *  entry. Handled here instead: move focus to `#main` directly and never let
   *  the browser touch the address bar at all; the router passes a click
   *  already prevented. */
  function skip(e: MouseEvent): void {
    e.preventDefault();
    document.getElementById('main')?.focus();
  }
</script>

<a class="skip" href="#main" onclick={skip}>{app.t.skipToContent}</a>

<header class="topbar">
  <div class="topbar-in">
    <a class="brand" href={app.href('#/roll/std')}>
      <!-- The vault die (docs/artwork.md, "Icons"): the same drawing as
           app/public/icons/icon.svg and favicon.svg and tools/artwork/lib.mjs `MARK`
           (tools/artwork/lib.test.mjs holds the four copies to one drawing). -->
      <svg class="brand-ico" viewBox="0 0 512 512" aria-hidden="true">
        <defs>
          <mask
            id="brand-mark-cut"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="512"
            height="512"
          >
            <rect width="512" height="512" fill="#fff" />
            <g fill="none" stroke="#000" stroke-width="18" stroke-linejoin="round">
              <path d="M256 134 L372 218.3 L327.7 354.7 L184.3 354.7 L140 218.3 Z" />
              <path
                d="M256 134 V40 M372 218.3 L462 189 M327.7 354.7 L383 431 M184.3 354.7 L129 431 M140 218.3 L50 189"
              />
            </g>
            <circle cx="256" cy="232" r="27" fill="#000" />
            <path d="M242 244 L232 302 H280 L270 244 Z" fill="#000" />
          </mask>
        </defs>
        <g mask="url(#brand-mark-cut)">
          <path
            fill="#d8ab5e"
            d="M256 58 L372.4 95.8 L444.3 194.8 L444.3 317.2 L372.4 416.2 L256 454 L139.6 416.2 L67.7 317.2 L67.7 194.8 L139.6 95.8 Z"
          />
          <path fill="#f0d091" d="M256 134 L372 218.3 L327.7 354.7 L184.3 354.7 L140 218.3 Z" />
        </g>
      </svg>
      <span class="brand-txt"><b>{app.t.brandWord}</b><i>Daggerheart</i></span>
    </a>
    <div class="topbar-right">
      <Seg
        neutral
        options={LANG_OPTIONS}
        value={app.lang}
        label={app.t.langLabel}
        onchange={(l: Lang) => {
          app.setLang(l);
        }}
      />
      {#if accountShown}
        {#if app.user}
          <div class="acctwrap" onfocusout={closeOnFocusOut}>
            <button
              type="button"
              class="acct in"
              class:on={acctPage}
              bind:this={acctButton}
              aria-label={`${app.t.account}: ${app.user.email}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? 'account-menu' : undefined}
              aria-current={onAccount ? 'page' : undefined}
              onclick={() => {
                menuOpen = !menuOpen;
              }}
              ><span class="ini"
                >{#if app.user.email}{app.user.email.charAt(0)}{:else}<Icon
                    name="user"
                  />{/if}</span
              ><Icon name="chevron" /></button
            >
            {#if menuOpen && acctButton}
              <AccountMenu
                {app}
                control={acctButton}
                onclose={() => {
                  menuOpen = false;
                }}
                onsignedout={afterSignOut}
              />
            {/if}
          </div>
        {:else}
          <a
            class="acct"
            class:on={acctPage}
            bind:this={signInLink}
            href={app.href(ACCOUNT_HASH)}
            aria-current={onAccount ? 'page' : undefined}
            ><Icon name="user" /><span>{app.t.signIn}</span></a
          >
        {/if}
      {/if}
    </div>
    <TabBar {app} />
  </div>
</header>

{#if modeOf(app.section)}
  <ModeRow {app} />
{/if}

<!-- `data-lists`, `data-homebrew` and `data-requests` are what the browser suites wait on
     before a capture (docs/specs/COVERAGE.md, "Test layers"): `pending` while the session
     is unknown, the account lists' status once signed in (on an account list's page the
     read of that list's entries), none signed out or with no sign-in; the homebrew
     store's status signed in; the owner's requests read status signed in. -->
<main
  id="main"
  tabindex="-1"
  data-lists={listsState}
  data-homebrew={app.user ? app.homebrew?.status : undefined}
  data-requests={app.user ? app.ownerRequests?.status : undefined}
>
  {@render children()}
</main>

<!-- The selection bar comes before the footer now, not after - it is
     `position: sticky`, not fixed, and z-index (SelBar.svelte's own
     `.selbarwrap`, 45) is what paints it over the footer whenever it is
     open, so a keyboard user tabbing forward used to reach the footer's
     license link before the bar's own buttons, the reverse of what is on
     top of what on screen. A sticky box also has a flow position, unlike a
     fixed one: with a selection open the footer is pushed down by exactly
     the bar's own height (measured at 1180: 5885px page height with no
     selection, 5938px with one - the 53px difference is `.selbarwrap`'s own
     height there), and at maximum scroll the bar rests above the footer
     with a ~20px gap rather than overlapping it (measured at both 1180 and
     375). -->
<SelBar {app} />

<!-- The license notice is on every page on purpose: the terms ask for it, and
     a page that can be linked to directly has to carry it. It sits folded in
     a native <details> under a one-line summary: DPCGL clause 4.1 asks for
     the notice in the shared material and names no visibility rule
     (FEATURES.md, "Chrome"). -->
<footer class="foot">
  <!-- The home of the site's static pages. The install guide is left out
       inside the installed app (FEATURES.md, "Chrome"). -->
  <nav class="foot-nav" aria-label={app.t.footNavLabel}>
    {#if app.showInstall}
      <a href={app.pagesDir + 'install.html'}>{app.t.installLink}</a>
    {/if}
    <a href={app.pagesDir + 'privacy.html'}>{app.t.privacyLink}</a>
    <a href={app.pagesDir + 'terms.html'}>{app.t.termsLink}</a>
  </nav>
  <details class="foot-licence">
    <summary>{app.t.footSummary}</summary>
    <p>
      {app.t.footBefore}<a href="https://www.daggerheart.com" target="_blank" rel="noopener"
        >{app.t.footLink}</a
      >{app.t.footAfter}
    </p>
  </details>
</footer>

<Toast {app} />

<style>
  /* off `.skip`/`.skip:focus` in style.css - a focused skip
     link is a gold plate pinned over the page's top-left corner, out of
     flow, the same as the live app - not a gray chip that pushes the header
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

  /* From 761 px one row: the brand, the jobs, then the language and the account
     control. The jobs come last in the source, so `order` keeps the narrow tab order. */
  .topbar-in {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 62px;
    width: var(--wrap);
    margin-inline: auto;
  }

  .topbar-in > :global(.tabs) {
    order: 1;
    align-self: stretch;
    margin-right: auto;
  }

  /* Up to 760 px the jobs take their own row under the brand (DESIGN.md, "The Two
     Breakpoints Rule"). */
  @media (max-width: 760px) {
    .topbar-in {
      flex-wrap: wrap;
      row-gap: 11px;
      min-height: 0;
      padding-top: 11px;
    }

    .topbar-in > :global(.tabs) {
      order: 3;
      flex-basis: 100%;
      margin-right: 0;
    }
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
    font-size: var(--t-body);
    letter-spacing: 0.2px;
  }

  .brand-txt i {
    font-style: normal;
    font-size: var(--t-badge);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  /* The group after the brand: the language switch, then the account
     control 8px after it. */
  .topbar-right {
    order: 2;
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* The account control: `Seg`'s track and its button type. */
  .acct {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    height: 38px;
    min-width: 38px;
    padding: 0 14px 0 11px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--line);
    color: var(--muted);
    font-size: var(--t-data);
    font-weight: 650;
    letter-spacing: 0.05em;
    font-family: inherit;
    text-decoration: none;
    white-space: nowrap;
    transition: 0.15s;
    cursor: pointer;
  }

  .acctwrap {
    position: relative;
  }

  .acct:hover {
    color: var(--txt);
    border-color: var(--gold);
  }

  /* Signed in: the email's first letter in a circle, then the chevron of a menu. */
  .acct.in {
    gap: 4px;
    padding: 0 8px 0 5px;
    letter-spacing: 0;
  }

  .ini {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--surface2);
    border: 1px solid rgb(216 171 94 / 45%);
    color: var(--gold-soft);
    font-size: var(--t-label);
    text-transform: uppercase;
  }

  /* On the account pages, and while the menu is open: the gold ring instead of a
     lit job. */
  .acct.on,
  .acct[aria-expanded='true'] {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  @media (max-width: 600px) {
    .acct {
      height: 44px;
      min-width: 44px;
    }

    /* The brand row holds the brand, the language switch and «Войти» / "Sign in" on
       one line at 360 px with a classic scrollbar (313 px of row), measured 2026-10-30:
       the gaps, the switch's side padding and the brand line's tracking give way. */
    .topbar-in {
      column-gap: 8px;
    }

    .topbar-right {
      gap: 6px;
    }

    .brand {
      gap: 6px;
    }

    .brand-txt i {
      letter-spacing: 0.08em;
    }

    .topbar .topbar-right :global(.seg button) {
      padding-inline: 9px;
    }

    .acct {
      gap: 5px;
      padding: 0 9px 0 8px;
    }
  }

  /* off `.foot` in style.css */
  .foot {
    width: var(--wrap);
    margin-inline: auto;
    margin-top: 20px;
    padding: 22px 0 40px;
    color: var(--muted2);
    font-size: var(--t-data);
    border-top: 1px solid var(--line);
  }

  .foot p {
    margin: var(--gap-sm) 0 0;
  }

  .foot-licence summary {
    cursor: pointer;
    width: fit-content;
  }

  /* Footer links are muted and underlined: they are not the page's action
     (DESIGN.md, "The Seal Rule"). */
  .foot a {
    color: var(--muted);
    text-decoration: underline;
  }

  /* The gap is `.topbar-in`'s, the bottom margin `.brand`'s gap. */
  .foot-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin: 0 0 10px;
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

  /* off the `@media print` block in `git show 23c00a6^:style.css` - this component's
     own share: the chrome it owns and `main`'s frame. `.tabs` (`TabBar`),
     `.printbar`, `.psheet`, `.pcard` and the two `.noprint` siblings
     (`SelBar`, `Toast`) each carry their own share of the same block; the page
     colors are in `styles/tokens.css`, which owns `html`/`body` and, being
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
     off center and the third column onto a second page. */
  @page {
    size: A4 portrait;
    margin: 0;
  }
</style>
