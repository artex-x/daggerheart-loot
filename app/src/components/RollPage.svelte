<script lang="ts">
  /* The shell of the nine roll pages (DESIGN.md, "The Roll Page Rule"). Up to 760 px the `h1`
     is read, not drawn; the controls sit under the mode row and one line holds «Бросок N»,
     «Настроить» and «Ещё». From 761 px: the head, the control pane and the results. The DOM
     differs by band: both at once would draw every field and id twice. */
  import { tick, untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import HelpBox from './HelpBox.svelte';
  import HelpItem from './HelpItem.svelte';
  import Icon from './Icon.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import NoData from './NoData.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import PinItem from './PinItem.svelte';
  import RecordHost from './RecordHost.svelte';
  import StatusRegion from './StatusRegion.svelte';
  import type { Index } from '../lib/data.js';
  import type { Help } from '../lib/help.js';
  import { nameOf } from '../lib/i18n.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    index: Index | null;
    title: string;
    /** The line under the heading: drawn from 761 px, read below. */
    sub: string;
    help: Help | null;
    /** What came up, as «Бросок N» reads it. */
    rolled: string;
    /** The records of the roll: a hidden status names them, since a menu opens in the
     *  results and a live region there would read the whole card again. */
    said: readonly Record_[];
    /** The closed «Настроить» while a row is narrowed: the value, lit. */
    lit?: string;
    /** Copies every option, where the roll offers a choice. */
    copy?: (() => void) | undefined;
    /** Why the page has nothing to roll. */
    empty?: string | undefined;
    /** What stays on the first screen. */
    controls: Snippet;
    /** The manual entry and the rows that narrow the roll. */
    settings: Snippet;
    /** The results block; receives `openRecord`. */
    results: Snippet<[(r: Record_) => void]>;
  }

  const {
    app,
    index,
    title,
    sub,
    help,
    rolled,
    said,
    lit = '',
    copy,
    empty,
    controls,
    settings,
    results
  }: Props = $props();

  const t = $derived(app.t);
  const narrow = $derived(app.band === 'narrow');

  /* Page memory: neither is stored (docs/specs/STATE.md). */
  let cfgOpen = $state(false);
  let helpOpen = $state(false);
  let root = $state<HTMLDivElement | undefined>(undefined);

  /* A band change draws the other layout. The panels keep the values; only these two flags
     reset, and a focus lost with the old DOM goes to the results line. */
  let wasNarrow: boolean | null = null;
  $effect.pre(() => {
    const now = narrow;
    untrack(() => {
      const moved = wasNarrow !== null && wasNarrow !== now;
      wasNarrow = now;
      if (!moved) return;
      cfgOpen = false;
      helpOpen = false;
      const page = root;
      if (!page?.contains(document.activeElement)) return;
      void tick().then(() => {
        if (document.activeElement !== document.body) return;
        const first =
          page.querySelector<HTMLElement>('.reshead button') ??
          page.querySelector<HTMLElement>('button');
        first?.focus();
      });
    });
  });
</script>

{#if narrow}
  <h1 class="vh">{title}</h1>
  {#if sub}<p class="vh">{sub}</p>{/if}
{:else}
  <PageHead {app} {title} {sub} {help} />
{/if}

{#if empty}
  <NoData>{empty}</NoData>
{:else}
  <RecordHost {app} {index}>
    {#snippet children(openRecord: (r: Record_) => void)}
      <div class="rp" class:two={!narrow} bind:this={root}>
        {#if narrow}
          <div class="rp-ctrl">{@render controls()}</div>
        {:else}
          <Panel>
            <div class="rp-ctrl">{@render controls()}</div>
            <div class="rp-set">{@render settings()}</div>
          </Panel>
        {/if}
        <div class="rp-res">
          <div class="reshead">
            <h2>{t.rollHead.replace('%s', rolled)}</h2>
            {#if narrow}
              <Button
                size="sm"
                variant={lit ? 'toggle' : 'plain'}
                expanded={cfgOpen}
                controls={cfgOpen ? 'rp-set' : undefined}
                caret
                onclick={() => {
                  cfgOpen = !cfgOpen;
                }}><Icon name="tune" />{lit || t.setUp}</Button
              >
              <MoreMenu {app} id="rp-more" size="sm">
                {#snippet children(close: () => void)}
                  {#if copy}
                    {@const copyAll = copy}
                    <button
                      type="button"
                      role="menuitem"
                      tabindex="-1"
                      onclick={() => {
                        close();
                        copyAll();
                      }}><Icon name="copy" />{t.copyRoll}</button
                    >
                  {/if}
                  <PinItem {app} onpicked={close} />
                  {#if help}
                    <HelpItem
                      {help}
                      open={helpOpen}
                      onpicked={close}
                      ontoggle={() => {
                        helpOpen = !helpOpen;
                      }}
                    />
                  {/if}
                {/snippet}
              </MoreMenu>
            {:else if copy}
              <Button size="sm" onclick={copy}><Icon name="copy" />{t.copyRoll}</Button>
            {/if}
          </div>
          {#if narrow && help && helpOpen}
            <!-- «Закрыть» returns the focus to «Ещё», which held the item (rule 20). -->
            <HelpBox
              {help}
              close={{
                label: t.close,
                onclose: () => {
                  helpOpen = false;
                  root?.querySelector<HTMLElement>('.reshead .morewrap > .btn')?.focus();
                }
              }}
            />
          {/if}
          {#if narrow && cfgOpen}
            <div id="rp-set" class="rp-open"><Panel>{@render settings()}</Panel></div>
          {/if}
          <StatusRegion text={said.map((it) => nameOf(it, app.lang)).join(', ')} key={said} />
          {@render results(openRecord)}
        </div>
      </div>
    {/snippet}
  </RecordHost>
{/if}

<style>
  /* The mode row sits right above: the spacing keeps the first result on the first screen
     (DESIGN.md, "The First-Screen Rule"). */
  :global(#main:has(> .rp:not(.two))) {
    padding-top: 6px;
  }

  .rp.two {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 22px;
    align-items: start;
  }

  .rp-ctrl {
    display: flex;
    gap: 8px;
    min-width: 0;
  }

  /* From 761 px the roll button takes its own line when the picker's value and it do not fit
     one. Up to 760 px the row stays one line and a long value is cut: a second line moves the
     first result past the first screen, and the select shows every name whole (DESIGN.md,
     "The Whole Message Rule" and "The First-Screen Rule"). */
  .rp.two .rp-ctrl {
    flex-wrap: wrap;
  }

  /* Up to 760 px the results line takes the thumb size up to 600 px and gives its growth
     back from these margins (DESIGN.md, "The First-Screen Rule"). */
  .rp:not(.two) .rp-ctrl {
    margin-top: 0;
  }

  .rp-ctrl :global(.btn.primary) {
    flex: none;
    height: 40px;
  }

  .rp-ctrl > :global(.btn.primary:only-child) {
    flex: 1 1 auto;
    justify-content: center;
  }

  .rp-set {
    margin-top: 16px;
  }

  .rp-res {
    min-width: 0;
  }

  .reshead {
    position: relative;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-height: max(28px, var(--thumb));
    /* Up to 760 px 4 px part the line's 40 px buttons from the first card, so the two do
       not read as one block; the first screen holds it (DESIGN.md, "The First-Screen Rule"). */
    margin: 0 0 4px;
  }

  .reshead h2 {
    margin: 0 auto 0 0;
    font-size: var(--t-control);
    font-weight: 700;
    line-height: 1.2;
  }

  .reshead > :global(.btn),
  .reshead :global(.morewrap > .btn) {
    height: max(28px, var(--thumb));
  }

  .rp.two .reshead {
    min-height: 32px;
    margin: 0 0 12px;
  }

  .rp.two .reshead h2 {
    font-size: var(--t-title);
  }

  .rp.two .reshead > :global(.btn) {
    height: 32px;
  }

  .rp-open {
    margin-bottom: 10px;
  }
</style>
