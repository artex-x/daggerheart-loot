<script lang="ts">
  /* The mode row of the nine roll sections: the Core rules, the alternate tables and
     the supplements menu (docs/specs/FEATURES.md, "Chrome"). Its own controls, not
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

  const { app }: { app: AppState } = $props();

  const t = $derived(app.t);
  const mode = $derived(modeOf(app.section));
  const supplement = $derived(isSupplement(mode) ? mode : null);

  const OWN: [Section, 'pageStd' | 'pageAlt'][] = [
    ['roll/std', 'pageStd'],
    ['roll/alt', 'pageAlt']
  ];

  let open = $state(false);
  let button = $state<HTMLButtonElement | undefined>(undefined);

  $effect(() => {
    void app.navigations;
    open = false;
  });

  function close(): void {
    open = false;
  }

  /* Focus that lands outside the button and its menu closes the menu, as the account
     menu's does (Shell.svelte); only a focus that lands somewhere counts. */
  function closeOnFocusOut(e: FocusEvent & { currentTarget: HTMLElement }): void {
    const to = e.relatedTarget;
    if (to instanceof Node && !e.currentTarget.contains(to)) open = false;
  }
</script>

<nav class="modes" aria-label={t.modesLabel}>
  <div class="modes-in">
    {#each OWN as [s, key] (s)}
      <a
        class="mode"
        class:on={s === mode}
        href={app.href(sectionHash(s))}
        data-section={sectionHash(s)}
        aria-current={s === mode ? 'page' : undefined}>{t[key]}</a
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
              onclick={close}
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
    line-height: 1.25;
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

  .sup {
    padding-right: 9px;
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
    .modes-in {
      gap: 5px;
      padding: 6px 0;
    }

    .mode {
      min-height: 40px;
      padding: 3px 4px;
      width: 100%;
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
