# 2026-10-21 - A weapon may take the trait any, in the catalog and in homebrew

- Task: `many-worlds-tavern` (owner: `any` 2026-10-18, homebrew too 2026-10-21).
- Decision: `tr: 'any'` («Любая» / "Any") is a weapon its wielder attacks with by any trait
  (mw47, which prints none). It answers all six trait chips and draws none, as `spellcast` does
  (`data.ts` `equipFacets`); no `f_trait-any`. Homebrew takes it in `eq.tr` and `eq.alt.tr`:
  `homebrew.ts` `TRAITS`, the four file schemas, `20261021120000_homebrew_trait_any.sql`.
- Rejected: picking a trait for mw47 (invents data); `any` as a catalog-only value with the
  editor's list filtered (a homebrew weapon could not carry a value a catalog weapon carries).
- Stale tab: the previous bundle draws its own `any` weapon with no trait word on the stat line
  and the print card (so does the preview Worker until redeployed); it drops a linked `any` item
  of another account from a list, a share and `#/h/` (`snapshotValid`), the rows kept; its lists
  export skips such an entry and counts it; it refuses a homebrew or lists file holding `any`,
  writing nothing. Recovery: reload; nothing stored is lost.
- Revert: `.claude/README.md`, "Undo a deploy that carried a migration".
