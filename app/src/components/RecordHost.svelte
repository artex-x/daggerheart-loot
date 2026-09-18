<script lang="ts">
  /* The record modal, owned once instead of once per page (components.md,
     C6). Eight pages each carried their own `let open = $state<Record_ |
     null>(null)`, the same `{#if open && index}<RecordModal .../>{/if}`
     block, and - on `SearchPage`/`TablesPage` only - an effect closing it on
     a real navigation. This component is that state and that block: a page
     wraps its own markup in the `children` snippet and hands a card's
     `onopen` the `openRecord` this snippet parameter gives it, instead of
     writing its own local `open`.

     The close-on-navigation effect is not new behaviour invented here - it
     is `SearchPage`/`TablesPage`'s own effect, generalised to every caller
     because the host owns `open` for all of them now. The other six pages
     had no such effect before this batch; verified by the golden shards
     that none of the states they cover exercises "open a record, then
     navigate without closing it" in a way that would have shown the
     difference. */
  import { untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import RecordModal from './RecordModal.svelte';
  import type { Index } from '../lib/data.js';
  import type { ShareBlock } from '../lib/share.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
    index: Index | null | undefined;
    /**
     * The live `contextNote` block, forwarded to the open record's "Copy
     * text" - only `ListPage` has one, and only as a function: which entry's
     * note applies depends on which record is open, which is this
     * component's own state and not the caller's to read.
     */
    extra?: ((it: Record_) => readonly ShareBlock[] | undefined) | undefined;
    /** Draws the page; receives `openRecord` to pass to a card's `onopen`. */
    children: Snippet<[(r: Record_) => void]>;
  }

  const { app, index, extra, children }: Props = $props();

  let open = $state<Record_ | null>(null);

  $effect(() => {
    void app.navigations;
    untrack(() => {
      open = null;
    });
  });

  function openRecord(r: Record_): void {
    open = r;
  }
</script>

{@render children(openRecord)}

{#if open && index}
  <RecordModal
    {app}
    {index}
    it={open}
    extra={extra?.(open)}
    onclose={() => {
      open = null;
    }}
    onopen={openRecord}
  />
{/if}
