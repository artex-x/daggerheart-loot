<script lang="ts">
  /* One icon, drawn from the path data in lib/icons.ts.
     `flex:none` is inline because the live app puts it there, and the two apps
     are compared pixel for pixel. */
  import { ICONS, type IconName } from '../lib/icons.js';

  interface Props {
    name: IconName;
  }

  const { name }: Props = $props();
  const icon = $derived(ICONS[name]);
</script>

<svg
  viewBox="0 0 24 24"
  width={icon.size}
  height={icon.size}
  fill="currentColor"
  aria-hidden="true"
  style="flex:none{'opacity' in icon ? `;opacity:${String(icon.opacity)}` : ''}"
>
  <path d={icon.d} />
</svg>
