<script lang="ts">
  /* «показать в таблице» under a record page's heading: the record's own row in the table
     it is printed in, in the same tab. Shared by `#/i/` and `#/h/`. */
  interface Props {
    href: string;
    label: string;
  }

  const { href, label }: Props = $props();
</script>

<a class="itemtable" {href}>{label}</a>

<style>
  /* The thumb target up to 600 px and 24 px from 601 px by a padded box, the growth given
     back; positioned so the lines after it do not paint over the box (DESIGN.md, "The
     Phone-First Rule"). */
  .itemtable {
    position: relative;
    display: inline-block;
    padding-block: max(0px, calc((max(24px, var(--thumb)) - 1lh) / 2));
    margin-block: min(0px, calc((1lh - max(24px, var(--thumb))) / 2));
    white-space: nowrap;
    font-size: var(--t-data);
    text-decoration: none;
    text-underline-offset: 3px;
    color: var(--gold-soft);
  }

  .itemtable:hover {
    text-decoration: underline;
  }
</style>
