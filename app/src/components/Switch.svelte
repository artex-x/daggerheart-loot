<script lang="ts">
  /* A labelled on/off switch: a native checkbox with `role="switch"` inside its label, so
     Space, the checked state and the name come with the control. The input is visually
     hidden; the track and knob after it draw the state
     (docs/decisions/2026-10-08-the-own-items-filter-is-a-labelled-switch.md). */

  interface Props {
    label: string;
    on: boolean;
    onchange: (on: boolean) => void;
  }

  const { label, on, onchange }: Props = $props();
</script>

<label class="switch" class:on>
  <input
    type="checkbox"
    role="switch"
    checked={on}
    onchange={(e) => {
      onchange(e.currentTarget.checked);
    }}
  /><span class="track" aria-hidden="true"><span class="knob"></span></span><span class="lbl"
    >{label}</span
  >
</label>

<style>
  .switch {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-sm);
    min-height: 32px;
    font-size: 13.5px;
    color: var(--muted);
    cursor: pointer;
    overflow-wrap: anywhere;
  }

  .switch.on {
    color: var(--txt);
  }

  /* The clip pattern of `TablesPage.svelte`'s `.btn-lbl`. */
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .track {
    position: relative;
    flex: none;
    width: 34px;
    height: 20px;
    border: 1px solid var(--line2);
    border-radius: 999px;
    background: var(--surface);
    transition: 0.15s;
  }

  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: var(--muted);
    transition: 0.15s;
  }

  input:checked + .track {
    border-color: var(--gold);
    background: var(--gold);
  }

  input:checked + .track .knob {
    left: 16px;
    background: var(--ink-on-gold);
  }

  input:focus-visible + .track {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
</style>
