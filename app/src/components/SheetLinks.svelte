<script lang="ts">
  /* The link list of a picker's sheet: one 44 px row per page, the current one gold. */
  interface Link {
    href: string;
    label: string;
    count?: number;
    current: boolean;
  }

  interface Props {
    links: readonly Link[];
    /** A small heading over the group; hidden from assistive technology, which reads it as
     *  the group's name. */
    caption?: string | undefined;
    onpick: (href: string) => void;
  }

  const { links, caption, onpick }: Props = $props();
</script>

{#if caption}<div class="cap" aria-hidden="true">{caption}</div>{/if}
<div class="sheetlinks" role={caption ? 'group' : undefined} aria-label={caption}>
  {#each links as l (l.href)}
    <a
      class="tab"
      href={l.href}
      aria-current={l.current ? 'page' : undefined}
      onclick={() => {
        onpick(l.href);
      }}
    >
      <span>{l.label}</span>
      {#if l.count !== undefined}<span class="n">{l.count}</span>{/if}
    </a>
  {/each}
</div>

<style>
  .sheetlinks {
    display: grid;
    gap: 2px;
  }

  .cap {
    padding: 8px 0 4px;
    color: var(--muted2);
    font-size: var(--t-label);
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-height: 44px;
    max-width: 100%;
    padding: 0 2px;
    color: var(--muted);
    font-size: var(--t-control);
    font-weight: 600;
    text-decoration: none;
  }

  .tab:hover {
    color: var(--txt);
  }

  .tab[aria-current='page'] {
    color: var(--gold);
  }

  .tab .n {
    font-size: var(--t-data);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--muted2);
  }
</style>
