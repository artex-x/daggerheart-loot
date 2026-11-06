<script lang="ts">
  /* The way back and the page's heading on one row: the item editor and the print page,
     which draw no `PageHead` (docs/specs/FEATURES.md, "Homebrew" and "Print"). */
  import Icon from './Icon.svelte';

  interface Props {
    href: string;
    label: string;
    title: string;
    /** Takes the press before the link does (the print page steps back in history). */
    onback?: ((e: MouseEvent) => void) | undefined;
  }

  const { href, label, title, onback }: Props = $props();
</script>

<div class="crumb">
  <a class="back" {href} onclick={onback}><Icon name="back" />{label}</a>
  <h1 class="ttl" {title}>{title}</h1>
</div>

<style>
  /* The way back and the heading on one row (`.page-h`, `.page-sub`). */
  .crumb {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    margin-bottom: 4px;
  }

  .back {
    display: inline-flex;
    align-items: center;
    flex: none;
    gap: 4px;
    min-height: 24px;
    color: var(--muted);
    font-size: var(--t-small);
    text-decoration: none;
  }

  .back:hover {
    color: var(--txt);
  }

  @media screen and (max-width: 600px) {
    .back {
      min-height: var(--thumb);
      margin-block: min(0px, calc((24px - var(--thumb)) / 2));
    }
  }

  .ttl {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: var(--t-page);
    font-weight: var(--h-page-weight);
    letter-spacing: var(--h-page-spacing);
    line-height: 1.25;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  @media (min-width: 761px) {
    .ttl {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      overflow-wrap: anywhere;
      white-space: normal;
    }
  }
</style>
