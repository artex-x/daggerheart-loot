<script lang="ts">
  /* «показать в таблице» under a record page's heading: the record's own row in the table
     it is printed in. Shared by `#/i/` and `#/h/`. */
  import Icon from './Icon.svelte';

  interface Props {
    href: string;
    label: string;
  }

  const { href, label }: Props = $props();
</script>

<a class="itemtable" {href}>{label}<Icon name="external" /></a>

<style>
  .itemtable {
    white-space: nowrap;
    font-size: 13px;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    color: var(--gold-soft);
  }

  .itemtable:hover {
    border-bottom-color: currentcolor;
  }

  .itemtable :global(svg) {
    width: 12px;
    height: 12px;
    fill: currentcolor;
    margin-left: 4px;
    vertical-align: -1px;
  }
</style>
