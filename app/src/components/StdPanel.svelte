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
  import NumberField from './NumberField.svelte';
  import OrGrid from './OrGrid.svelte';
  import RollPage from './RollPage.svelte';
  import RollResult from './RollResult.svelte';
  import { helpFor } from '../lib/help.js';
  import { rarityKey } from '../lib/label.js';
  import { CORE_MAX, coreRoll } from '../lib/roll.js';
  import { shareRoll } from '../lib/share.js';
  import { LOOT_KINDS, NDICE, SOURCES, isLastOn, narrowedLabel, poolFor } from '../lib/std.js';
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

  const pool = $derived(index ? poolFor(index, n, app.source, app.kinds) : []);

  const SOURCE_LABEL: Record<Source, keyof Dict> = { core: 'srcCore', hnf: 'srcHnf' };
  const KIND_LABEL: Record<LootKind, keyof Dict> = { item: 'fItems', consumable: 'fCons' };

  const rarityName = (key: string): string => t[rarityKey(key)];

  const help = $derived(helpFor('std', app.lang));

  /* Every chip of a row on is the neutral default; a row narrowed is what lights gold. */
  const allSources = $derived(SOURCES.every((src) => app.source[src]));
  const allKinds = $derived(LOOT_KINDS.every((kind) => app.kinds[kind]));
  const lit = $derived(
    narrowedLabel(
      [
        {
          left: SOURCES.filter((src) => app.source[src]).map((src) => t[SOURCE_LABEL[src]]),
          of: SOURCES.length
        },
        {
          left: LOOT_KINDS.filter((kind) => app.kinds[kind]).map((k) => t[KIND_LABEL[k]]),
          of: LOOT_KINDS.length
        }
      ],
      t.setUp
    )
  );

  /* The roll and the index together, and only where there is an actual choice
     to hand over: one card is a result rather than a set of options, and the
     live app leaves the button out. Pairing them is what lets the copy run
     without a guard against an index it cannot be reached without. */
  const choice = $derived(index && pool.length > 1 ? { index, pool } : null);

  async function copyRoll(one: { index: Index; pool: Record_[] }): Promise<void> {
    /* Its own toast, distinct from a plain text copy. */
    const { text, html } = shareRoll(one.pool, one.index, app.lang, t.or);
    await app.copied(
      () => app.env.clipboard.writeRich({ html, plain: text }),
      (t) => t.rollCopied
    );
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
      app.say((t) => t.keepOneSource, { error: true });
      return;
    }
    app.source = { ...app.source, [src]: !app.source[src] };
  }
</script>

<RollPage
  {app}
  {index}
  sub={t.subStd}
  {help}
  rolled={String(n)}
  said={pool}
  {lit}
  copy={choice ? () => void copyRoll(choice) : undefined}
>
  {#snippet controls()}
    <DiceBar dice={NDICE} {rarityName} rollWord={t.roll} onroll={roll} />
  {/snippet}

  {#snippet settings()}
    <Field label="{t.rollResult} (1-{CORE_MAX})">
      <NumberField
        value={n}
        min={1}
        max={CORE_MAX}
        label={t.rollResult}
        stepDownLabel={t.stepDown}
        stepUpLabel={t.stepUp}
        onchange={setN}
      />
    </Field>

    <Field label={t.source}>
      <ChipRow>
        {#each SOURCES as src (src)}
          <Chip
            label={t[SOURCE_LABEL[src]]}
            on={app.source[src]}
            neutral={allSources}
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
            neutral={allKinds}
            title={isLastOn(app.kinds, LOOT_KINDS, kind) ? t.keepOneKind : undefined}
            onclick={() => {
              app.toggleKind(kind, LOOT_KINDS);
            }}
          />
        {/each}
      </ChipRow>
    </Field>
  {/snippet}

  {#snippet results(openRecord)}
    {#if index && pool.length}
      <div class="results" data-primary>
        <OrGrid or={t.or} items={pool} card={cardOf} />
      </div>
    {/if}

    {#snippet cardOf(it: Record_)}
      {#if index}
        <RollResult {app} {index} {it} onopen={openRecord} />
      {/if}
    {/snippet}
  {/snippet}
</RollPage>
