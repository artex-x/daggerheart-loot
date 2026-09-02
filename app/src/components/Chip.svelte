<script lang="ts">
  /* One choice in a row of them, off `.chip` in style.css.

     Extracted on the second use, not before: the Vault of Ages section picker
     and the community picker are both a row of these, and the source, kind and
     rarity rows of the other two roll modes will be the third and fourth. */

  interface Props {
    label: string;
    /** Whether this is the one currently chosen. */
    on: boolean;
    onclick: () => void;
  }

  const { label, on, onclick }: Props = $props();
</script>

<button type="button" class="chip" class:on aria-pressed={on} {onclick}>{label}</button>

<style>
  /* off `.chip` in style.css. `inline-block` and the missing underline are
     there because the live rule is shared with the table navigation, where a
     chip is a link; the values are copied rather than trimmed to what a button
     needs, so the two rows measure the same. */
  .chip {
    display: inline-block;
    text-decoration: none;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 540;
    transition: 0.15s;
  }

  .chip:hover {
    border-color: var(--gold);
    color: var(--txt);
  }

  .chip.on {
    background: var(--gold);
    border-color: var(--gold);
    color: #1a1206;
    font-weight: 650;
  }
</style>
