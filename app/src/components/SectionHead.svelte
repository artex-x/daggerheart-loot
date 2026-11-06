<script lang="ts">
  /* A `.tsection`'s own heading: an `h2` and «Ссылка на раздел», a labeled button that
     copies a direct link to it. Off `sectionHead()` in app.js, used identically by every
     sectioned body (tier, frame, community, and each alternate-table rarity). The
     homebrew table hands out no link, so it passes no `oncopy` and draws no button
     (docs/specs/FEATURES.md, rule 17). */
  import Icon from './Icon.svelte';

  interface Props {
    label: string;
    /** The link button's visible label and name. */
    title?: string | undefined;
    oncopy?: (() => void) | undefined;
  }

  const { label, title, oncopy }: Props = $props();
</script>

<div class="tsec-head">
  <h2 class="lbl">{label}</h2>
  {#if oncopy}
    <button type="button" class="tsec-link" onclick={oncopy}>
      <Icon name="link" /><span>{title}</span>
    </button>
  {/if}
</div>

<style>
  /* off `.tsec-head` and `.tsec-link` in `git show 23c00a6^:style.css` */
  .tsec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .lbl {
    margin: 0;
    font-size: var(--t-body);
    font-weight: 650;
    color: var(--txt);
  }

  .tsec-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: max(28px, var(--thumb));
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 0 6px;
    border-radius: 6px;
    font-size: var(--t-data);
    font-weight: 600;
    transition: 0.15s;
  }

  .tsec-link:hover {
    color: var(--txt);
    background: var(--surface);
  }

  .tsec-link :global(svg) {
    width: 14px;
    height: 14px;
  }
</style>
