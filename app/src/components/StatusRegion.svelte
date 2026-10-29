<script lang="ts">
  /* The visually hidden live region a page says a change through (docs/specs/FEATURES.md,
     rule 19). Mount it with the page, not with the change: a region inserted with its
     text is not announced. A new `key` remounts the text, so the same words are said
     again. `live` marks a joined topic for the hosted E2E and draws nothing. */
  interface Props {
    text: string;
    key?: unknown;
    live?: boolean | undefined;
  }

  const { text, key, live }: Props = $props();
</script>

<div class="said vh" role="status" data-live={live ? 'live' : undefined}>
  {#key key}{#if text}<span>{text}</span>{/if}{/key}
</div>
