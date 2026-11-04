<script lang="ts">
  /* One roll result: the card face and its row. The row sits under the plate, because the
     plate is `overflow: clip` and a popover inside it would be cut (DESIGN.md, "Cards"). */
  import AddToList from './AddToList.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import { nameOf } from '../lib/i18n.js';
  import type { AltCol, Index } from '../lib/data.js';
  import type { Record_ } from '../lib/types.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    index: Index;
    it: Record_;
    /** Which duality column found it, on the alternate tables. */
    col?: AltCol | undefined;
    /** The die face that found it, where it is not the record's own row number. */
    rollLabel?: number | undefined;
    onopen: (r: Record_) => void;
  }

  const { app, index, it, col, rollLabel, onopen }: Props = $props();
</script>

<div class="dealt">
  <RecordCard
    variant="face"
    {it}
    {index}
    lang={app.lang}
    {col}
    {rollLabel}
    artBroken={app.artBroken(it.id)}
    onartfail={(bad: string) => {
      app.markArtBroken(bad);
    }}
    {onopen}
  />
  <div class="resacts" role="group" aria-label={nameOf(it, app.lang)}>
    <AddToList {app} key={it.id} ids={[it.id]} size="sm" />
    <RecordActions {app} {index} {it} row="share" size="sm" />
    <!-- The same record can come up in both columns of the alternate tables. -->
    <MoreMenu {app} id="roll-more-{it.id}-{col ?? 0}" size="sm">
      {#snippet children(close: () => void)}
        <RecordActions {app} {index} {it} row="menu" onpicked={close} />
      {/snippet}
    </MoreMenu>
  </div>
</div>

<style>
  .dealt {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    min-width: 0;
  }

  .dealt > :global(.card) {
    flex: 1 1 auto;
  }

  .resacts {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .resacts :global(.seldrop) {
    flex: 1 1 auto;
  }

  .resacts :global(.seldrop > .btn) {
    width: 100%;
    justify-content: center;
  }

  /* `.cardpick`'s sides (RecordCard.svelte): down by default, up where the window has no
     room below. The margin takes in the entrance's 10 px, which `scrollIntoView` measures, so
     a long list stops clear of the header. */
  .resacts :global(.dropmenu) {
    scroll-margin-block: 16px;
    bottom: auto;
    top: calc(100% + 8px);
    left: 0;
    right: auto;
  }

  .resacts :global(.dropmenu.up) {
    top: auto;
    bottom: calc(100% + 8px);
  }

  /* The row anchors the menu on a phone, so it takes the row's width. */
  @media (max-width: 600px) {
    .resacts :global(.seldrop) {
      position: static;
    }

    .resacts :global(.dropmenu) {
      right: 0;
    }
  }
</style>
