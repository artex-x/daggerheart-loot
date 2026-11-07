<script lang="ts" module>
  /* Each mode draws its own panel (App.svelte), so a press in the head's pills mounts the
     row again with the old control gone; the new row takes the focus back (DESIGN.md, "The
     Head Order Rule"). */
  let pressed = false;
</script>

<script lang="ts">
  /* The mode row of the twelve roll sections: the Core rules, the alternate tables and
     the supplements menu (docs/specs/FEATURES.md, "Chrome"); up to 760 px under the header,
     from 761 px the pills of the roll page's head. Its own controls, not
     `Chip`: `Chip`'s button form is a pressed toggle, and the menu button is a menu
     button. The styles compose Chip's tokens. Each control carries `data-section`, the
     canonical key the route contract reads (`tests/app/contracts.js`). */
  import Icon from './Icon.svelte';
  import Menu from './Menu.svelte';
  import { SECTION_LABEL } from '../lib/dict.js';
  import { sectionHash } from '../lib/hash.js';
  import { SUPPLEMENTS, isSupplement, modeOf } from '../lib/nav.js';
  import type { Section } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  /** `inhead`: the page head's pills from 761 px, not the row under the header. */
  const { app, inhead = false }: { app: AppState; inhead?: boolean } = $props();

  const t = $derived(app.t);
  const mode = $derived(modeOf(app.section));
  const supplement = $derived(isSupplement(mode) ? mode : null);

  const OWN: [Section, 'pageStd' | 'pageAlt'][] = [
    ['roll/std', 'pageStd'],
    ['roll/alt', 'pageAlt']
  ];

  let open = $state(false);
  let button = $state<HTMLButtonElement | undefined>(undefined);
  let row = $state<HTMLElement | undefined>(undefined);

  /** Notes a press that leaves the lit mode: only that one mounts the row again. */
  function press(to: Section): void {
    if (inhead && to !== mode) pressed = true;
  }

  $effect(() => {
    if (!inhead || !pressed || !row) return;
    pressed = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    (supplement ? button : row.querySelector<HTMLElement>('a[aria-current="page"]'))?.focus();
  });

  $effect(() => {
    void app.navigations;
    open = false;
  });

  function close(): void {
    open = false;
  }

  /* Rule 20: a pressed item returns the focus to its menu's button. */
  function pick(to: Section): void {
    press(to);
    close();
    button?.focus();
  }

  /* Focus that lands outside the button and its menu closes the menu, as the account
     menu's does (Shell.svelte); only a focus that lands somewhere counts. */
  function closeOnFocusOut(e: FocusEvent & { currentTarget: HTMLElement }): void {
    const to = e.relatedTarget;
    if (to instanceof Node && !e.currentTarget.contains(to)) open = false;
  }
</script>

<nav class="modes" class:inhead aria-label={t.modesLabel} bind:this={row}>
  <div class="modes-in">
    {#each OWN as [s, key] (s)}
      <a
        class="mode"
        class:on={s === mode}
        href={app.href(sectionHash(s))}
        data-section={sectionHash(s)}
        onclick={() => {
          press(s);
        }}
        aria-current={s === mode ? 'page' : undefined}
        ><span class="pl" data-label={t[key]}>{t[key]}</span></a
      >
    {/each}
    <div class="supwrap" onfocusout={closeOnFocusOut}>
      <button
        type="button"
        class="mode sup"
        class:on={supplement !== null}
        bind:this={button}
        data-section={supplement ? sectionHash(supplement) : undefined}
        aria-current={supplement ? 'page' : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? 'supplements-menu' : undefined}
        onclick={() => {
          open = !open;
        }}
        ><span>{supplement ? t[SECTION_LABEL[supplement]] : t.grpSupplements}</span><Icon
          name="chevron"
        /></button
      >
      {#if open && button}
        <Menu
          control={button}
          label={t.grpSupplements}
          id="supplements-menu"
          onclose={close}
          cls="supmenu"
        >
          <div class="cap" aria-hidden="true">{t.grpSupplements}</div>
          {#each SUPPLEMENTS as s (s)}
            <a
              class="item"
              role="menuitem"
              tabindex="-1"
              href={app.href(sectionHash(s))}
              aria-current={s === supplement ? 'page' : undefined}
              onclick={() => {
                pick(s);
              }}
              ><span class="mark"
                >{#if s === supplement}<Icon name="check" />{/if}</span
              >{t[SECTION_LABEL[s]]}</a
            >
          {/each}
        </Menu>
      {/if}
    </div>
  </div>
</nav>

<style>
  /* Under the sticky header; it scrolls with the page. */
  .modes {
    border-bottom: 1px solid var(--line);
  }

  .modes-in {
    display: flex;
    align-items: center;
    gap: 8px;
    width: var(--wrap);
    margin-inline: auto;
    padding: 10px 0;
  }

  /* In the page head the row is the pills' box (DESIGN.md, "The Head Order Rule"). */
  .modes.inhead {
    border-bottom: 0;
  }

  .inhead .modes-in {
    width: auto;
    margin: 0;
    padding: 0;
    flex-wrap: wrap;
  }

  .supwrap {
    position: relative;
    display: flex;
  }

  .mode {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-decoration: none;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    padding: 7px 12px;
    border-radius: 999px;
    font: inherit;
    font-size: var(--t-data);
    font-weight: 540;
    text-align: center;
    transition: 0.15s;
    cursor: pointer;
  }

  .mode:hover {
    border-color: var(--gold);
    color: var(--txt);
  }

  /* The current place: the gold of a chosen chip. */
  .mode.on {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--ink-on-gold);
    font-weight: 650;
  }

  /* The label keeps the width of its lit weight, so a lit pill does not move its neighbors
     (DESIGN.md, "Sibling pills"). */
  .pl {
    display: inline-grid;
  }

  .pl::after {
    content: attr(data-label) / '';
    height: 0;
    overflow: hidden;
    visibility: hidden;
    font-weight: 650;
  }

  .sup {
    padding-right: 9px;
  }

  /* Ten 44 px items are 498 px: at 360x640 the menu starts at 177 px, so it scrolls inside
     the window rather than past it (measured 2026-11-07). */
  .supwrap :global(.menu.supmenu) {
    max-height: calc(100dvh - 186px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .cap {
    padding: 8px 12px 4px;
    color: var(--muted2);
    font-size: var(--t-label);
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .item {
    min-height: 44px;
  }

  .item[aria-current='page'] {
    color: var(--gold-soft);
  }

  .mark {
    display: inline-flex;
    width: 16px;
    flex: none;
  }

  /* At 600 px and below (the touch step) the three controls share the row, 40 px tall,
     so the longest names hold two lines in RU and EN at 360 px with a classic scrollbar
     (301 px of controls; mock 2 drew 0.8 / 1.25 / 1 on 328 px, measured 2026-10-30). */
  @media (max-width: 600px) {
    /* 4px: the results line's thumb targets take the rest back (DESIGN.md, "The
       First-Screen Rule"). */
    .modes-in {
      gap: 5px;
      padding: 4px 0;
    }

    /* Two lines of a long name hold 40 px here; from 601 px the pills take the body line
       height of the group chips (DESIGN.md, "Sibling pills"). */
    .mode {
      min-height: 40px;
      padding: 3px 4px;
      width: 100%;
      line-height: 1.25;
    }

    .modes-in > .mode:first-child {
      flex: 0.72 1 0;
    }

    .modes-in > .mode:nth-child(2) {
      flex: 1.18 1 0;
    }

    .supwrap {
      flex: 1.1 1 0;
      min-width: 0;
    }

    .sup {
      gap: 1px;
      padding-right: 2px;
    }

    .sup :global(svg) {
      width: 14px;
      height: 14px;
    }
  }

  @media print {
    .modes {
      display: none !important;
    }
  }
</style>
