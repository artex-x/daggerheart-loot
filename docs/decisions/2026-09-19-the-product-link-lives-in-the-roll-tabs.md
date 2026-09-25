# 2026-09-19 - The product link lives in the roll tab's help box

- Task: `dragons-vault`.
- Decision: `https://www.drivethrurpg.com/en/product/581246/the-dragon-s-vault`
  is a link in `help.ts`'s Dragon's Vault box, the surface every shipped
  source uses, and a row in both README source tables.
- Rejected: a hover tooltip on the source badge (`Badge` takes a `title`,
  but a `title` cannot hold a link and never shows on touch; a link the
  reader cannot follow is a citation, not a source - `help.test.ts`).
