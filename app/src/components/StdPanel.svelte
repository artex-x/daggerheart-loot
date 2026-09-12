<script lang="ts">
  /* Core rules: one roll over the core book and Hope & Fear at once.

     The table is 1-60 whatever rarity you want, and the number of d12 only
     decides the band - so the dice counts are the buttons and the rarity is
     the caption. A roll returns up to four records, one from each chosen
     source's item and consumable table, and the player takes one of them:
     that is why they are laid out as alternatives rather than as a list. */
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import DiceBar from './DiceBar.svelte';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  import NumberField from './NumberField.svelte';
  import OrGrid from './OrGrid.svelte';
  import PageHead from './PageHead.svelte';
  import Panel from './Panel.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordModal from './RecordModal.svelte';
  import Button from './Button.svelte';
  import { helpFor } from '../lib/help.js';
  import { rarityKey } from '../lib/label.js';
  import { CORE_MAX, coreRoll } from '../lib/roll.js';
  import { shareRoll } from '../lib/share.js';
  import { LOOT_KINDS, NDICE, SOURCES, isLastOn, poolFor } from '../lib/std.js';
  import type { LootKind, Source } from '../lib/std.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Dict } from '../lib/dict.js';
  import type { Index } from '../lib/data.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);

  let n = $state(1);
  let open = $state<Record_ | null>(null);

  /** Says what the last action did - the toast, off `app.say`. */
  const say = (msg: string, error?: boolean): void => {
    app.say(msg, { error });
  };

  const pool = $derived(index ? poolFor(index, n, app.source, app.kinds) : []);

  const SOURCE_LABEL: Record<Source, keyof Dict> = { core: 'srcCore', hnf: 'srcHnf' };
  const KIND_LABEL: Record<LootKind, keyof Dict> = { item: 'fItems', consumable: 'fCons' };

  const rarityName = (key: string): string => t[rarityKey(key)];

  const help = $derived(helpFor('std', app.lang));

  /* The roll and the index together, and only where there is an actual choice
     to hand over: one card is a result rather than a set of options, and the
     live app leaves the button out. Pairing them is what lets the copy run
     without a guard against an index it cannot be reached without. */
  const choice = $derived(index && pool.length > 1 ? { index, pool } : null);

  async function copyRoll(one: { index: Index; pool: Record_[] }): Promise<void> {
    const { text, html } = shareRoll(one.pool, one.index, app.lang, t.or);
    const ok = await app.env.clipboard.writeRich({ html, plain: text });
    say(ok ? t.textCopied : t.copyFailed, !ok);
  }

  function setN(v: number): void {
    n = v;
  }

  function roll(dice: number): void {
    n = coreRoll(dice, app.env.random);
  }

  /** Refuses to turn the last one off, and says why rather than doing nothing. */
  function toggleSource(src: Source): void {
    if (isLastOn(app.source, SOURCES, src)) {
      say(t.keepOneSource, true);
      return;
    }
    app.source = { ...app.source, [src]: !app.source[src] };
  }
</script>

<PageHead {app} title={t.pageStd} sub={t.subStd} {help} {say} />

<Panel>
  <Field label="{t.rollResult} (1–{CORE_MAX})">
    <div class="numrow">
      <NumberField
        value={n}
        min={1}
        max={CORE_MAX}
        label={t.rollResult}
        stepDownLabel={t.stepDown}
        stepUpLabel={t.stepUp}
        onchange={setN}
      />
      <DiceBar dice={NDICE} {rarityName} rollWord={t.roll} onroll={roll} />
    </div>
  </Field>

  <Field label={t.source}>
    <ChipRow>
      {#each SOURCES as src (src)}
        <Chip
          label={t[SOURCE_LABEL[src]]}
          on={app.source[src]}
          value={src}
          title={isLastOn(app.source, SOURCES, src) ? t.keepOneSource : undefined}
          onclick={() => {
            toggleSource(src);
          }}
        />
      {/each}
    </ChipRow>
  </Field>

  <Field label={t.filter}>
    <ChipRow>
      {#each LOOT_KINDS as kind (kind)}
        <Chip
          label={t[KIND_LABEL[kind]]}
          on={app.kinds[kind]}
          title={isLastOn(app.kinds, LOOT_KINDS, kind) ? t.keepOneKind : undefined}
          onclick={() => {
            app.toggleKind(kind, LOOT_KINDS);
          }}
        />
      {/each}
    </ChipRow>
  </Field>
</Panel>

{#if choice}
  <!-- The whole roll as one message, with the OR spelled out: the GM pastes
       the options together rather than sending them one at a time. -->
  <div class="resbar">
    <Button size="sm" label={t.copyRoll} onclick={() => void copyRoll(choice)}>
      <Icon name="copy" />{t.copyRoll}
    </Button>
  </div>
{/if}

{#if index && pool.length}
  <div class="results">
    <OrGrid or={t.or} items={pool} card={cardOf} />
  </div>
{/if}

{#snippet cardOf(it: Record_)}
  {#if index}
    <RecordCard
      variant="compact"
      {it}
      {index}
      lang={app.lang}
      artBroken={app.artBroken(it.id)}
      onartfail={(bad: string) => {
        app.markArtBroken(bad);
      }}
      onopen={(r: Record_) => {
        open = r;
      }}
    >
      {#snippet nameActions()}
        <RecordActions {app} {index} {it} row="name" {say} />
      {/snippet}
      {#snippet actions()}
        <RecordActions {app} {index} {it} row="card" {say} />
      {/snippet}
    </RecordCard>
  {/if}
{/snippet}

{#if open && index}
  <RecordModal
    {app}
    {index}
    it={open}
    onclose={() => {
      open = null;
    }}
    onopen={(r: Record_) => {
      open = r;
    }}
  />
{/if}

<style>
  /* off `.numrow` and `.results` in style.css - `.panel` moved to
     `Panel.svelte` (B10) */
  .numrow {
    display: flex;
    gap: 10px;
    align-items: stretch;
    flex-wrap: wrap;
  }

  .results {
    margin-top: 26px;
  }

  /* off `.resbar` in style.css: the roll-copy button sits above the cards, and
     tightens the gap under itself so it reads as belonging to them. */
  .resbar {
    display: flex;
    justify-content: flex-end;
    margin: 22px 0 0;
  }

  .resbar + .results {
    margin-top: 10px;
  }
</style>
