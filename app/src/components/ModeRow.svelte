<script lang="ts" module>
  /* Each mode draws its own panel (App.svelte), so a pick that leaves the lit mode mounts
     the row again with the old control gone; the new row takes the focus back (DESIGN.md,
     "The Head Order Rule"). */
  let pressed = false;
</script>

<script lang="ts">
  /* The modes of the twelve roll sections: the Core rules, the alternate tables and the ten
     supplements (docs/specs/FEATURES.md, "Chrome"). Up to 760 px one picker that names the
     lit mode, in the picker row of the roll page; from 761 px the three pills of the page
     head, the third one «Дополнения» opening the same sheet. Its own controls, not `Chip`:
     `Chip`'s button form is a pressed toggle. The styles compose Chip's tokens. Each control
     carries `data-section`, the canonical key the route contract reads
     (`tests/app/contracts.js`). */
  import { tick } from 'svelte';
  import Icon from './Icon.svelte';
  import PickerButton from './PickerButton.svelte';
  import Sheet from './Sheet.svelte';
  import SheetLinks from './SheetLinks.svelte';
  import { SECTION_LABEL } from '../lib/dict.js';
  import { sectionHash } from '../lib/hash.js';
  import { SUPPLEMENTS, isSupplement, modeOf } from '../lib/nav.js';
  import type { Section } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  const { app }: { app: AppState } = $props();

  const t = $derived(app.t);
  const narrow = $derived(app.band === 'narrow');
  const mode = $derived<Section>(modeOf(app.section) ?? 'roll/std');
  const supplement = $derived(isSupplement(mode) ? mode : null);
  const current = $derived(t[SECTION_LABEL[mode]]);
  const pickLabel = $derived(t.rollPick.replace('%s', current));

  const OWN: [Section, 'pageStd' | 'pageAlt'][] = [
    ['roll/std', 'pageStd'],
    ['roll/alt', 'pageAlt']
  ];

  const links = (list: readonly Section[]) =>
    list.map((s) => ({
      href: app.href(sectionHash(s)),
      label: t[SECTION_LABEL[s]],
      current: s === mode
    }));

  let picking = $state(false);
  /* The control that opens the sheet: the picker, or from 761 px the supplements button. */
  let picker = $state<HTMLButtonElement | undefined>(undefined);
  let button = $state<HTMLButtonElement | undefined>(undefined);
  let row = $state<HTMLElement | undefined>(undefined);

  $effect(() => {
    if (!pressed || !row) return;
    const target = narrow
      ? picker
      : supplement
        ? button
        : row.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!target) return;
    pressed = false;
    const active = document.activeElement;
    if (!active || active === document.body) target.focus();
  });

  /* The sheet scrolls at a short window: the open mode may start below the fold. */
  $effect(() => {
    if (!picking) return;
    document
      .querySelector<HTMLElement>('dialog.sheet [aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest' });
  });

  /* Rule 20: both ways out of the sheet end at the control that opened it. A pick closes the
     sheet with no `close` event; a pick into another mode mounts the row again, and the new
     row takes the focus (`pressed`). */
  function close(): void {
    picking = false;
    void tick().then(() => {
      (narrow ? picker : button)?.focus();
    });
  }

  function pick(href: string): void {
    if (href !== app.href(sectionHash(mode))) pressed = true;
    close();
  }

  /* A press on a pill that leaves the lit mode: only that one mounts the row again. */
  function press(to: Section): void {
    if (to !== mode) pressed = true;
  }
</script>

<nav class="modes" class:narrow aria-label={t.modesLabel} bind:this={row}>
  {#if narrow}
    <PickerButton
      bind:el={picker}
      label={pickLabel}
      name={current}
      section={sectionHash(mode)}
      onclick={() => {
        picking = true;
      }}
    />
  {:else}
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
      <button
        type="button"
        class="mode sup"
        class:on={supplement !== null}
        bind:this={button}
        data-section={supplement ? sectionHash(supplement) : undefined}
        aria-current={supplement ? 'page' : undefined}
        aria-haspopup="dialog"
        onclick={() => {
          picking = true;
        }}><span>{supplement ? current : t.grpSupplements}</span><Icon name="chevron" /></button
      >
    </div>
  {/if}
  {#if picking}
    <Sheet {app} label={pickLabel} title={t.jobRoll} onclose={close}>
      <SheetLinks links={links(['roll/std', 'roll/alt'])} onpick={pick} />
      <SheetLinks caption={t.grpSupplements} links={links(SUPPLEMENTS)} onpick={pick} />
    </Sheet>
  {/if}
</nav>

<style>
  /* Up to 760 px the picker takes the free width of the picker row. */
  .narrow {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1 1 auto;
  }

  /* The pills' box in the page head (DESIGN.md, "The Head Order Rule"). */
  .modes-in {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
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

  @media print {
    .modes {
      display: none !important;
    }
  }
</style>
