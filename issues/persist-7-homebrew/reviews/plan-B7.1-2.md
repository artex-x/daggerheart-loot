# Review - plan before B7.1, second look (persist-7-homebrew)

Verdict: approve
Reviewed: 7005abeb7ec6621a65f42e590e10599fc93257ad
Scope: plan before B7.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

## Scope of this look

The changed text only, against `reviews/plan-B7.1.md`: `plan.md` 4.1, 4.2,
4.8, 4.9, section 13 item 6, section 14 ("Files", "Constraints", steps 2b,
2e, 2f, 2g, 2h, 3, 4, 5, 7, 8, 9, 12-16, 18, contract case M, the
acceptance criteria); D4, D8 and the 2026-09-25 mirror line; `reviews.md`;
`handoff.md`. No gate, stack or hosted project was run.
`validate(readAll())` over `tools/decisions.js` reports no problem, and
`docs/DECISIONS.md` equals `render(readAll())`.

Each finding of the first look, checked:

| Finding | Where it landed | Result |
|---|---|---|
| Blocker 1, the copy turns frozen entries into references | 4.8; step 2h (the `exists (... s.snapshot is null)` form, deciding from the source row by the projection's entry `id`); step 12 (the fake reads its held entry); steps 13 and 15 (the case "the owner copies its own share holding a frozen entry"); acceptance; D4 | fixed |
| Blocker 2, `search_path` on two definer functions and no pin | "Constraints" (every new or re-created function states `search_path` and `language`); steps 2e, 2f, 2g, 2h; step 15's pin of `prosecdef`, `proconfig` and EXECUTE per role, in the pattern of `list-shares`, `purchase-requests`, `delete-account`, `legacy-move`; acceptance | fixed |
| R1, C0 controls pass the 32768 bound | 4.1 (the byte argument, `\r` refused, R7d normalizes line ends); "Constraints"; step 2b (`'[\x01-\x08\x0b-\x1f]'` in `homebrew_names_ok` and `homebrew_text_ok`, so snapshots are covered too); step 4 (invalid and valid fixtures); step 5 (the same range, rule `pattern`); step 15; acceptance; an inherited line for R7d (7.4) | fixed |
| R2, a repeated update reads as `conflict` | 4.9; step 5 (`canonJson`); step 8 (the no-row read of `revision,content,book_id`); steps 9, 12, 13; case M step 5 (the same update again answers revision 2, a different one `conflict`); acceptance | fixed |
| R3, the reversal destroys data | step 3; step 18 (the paragraph for "Undo a deploy that carried a migration") | fixed |
| Nits 1-10 | step 7 cites D1; step 18 and "Files" add `CONTRACTS.md`; step 14 and "Files" add `tests/e2e/contract.mjs`; 4.2, step 4 and D8 split key and name uniqueness; the mirror line no longer names the bound; step 2b states the section fallback; case M step 10 reads "then remove the list"; step 12 aligns the fake with `ignoreDuplicates`; 4.9, steps 8, 9, 12 degrade a failed `my_limit` to `null`; the handoff's status, `Review:` line and file count | fixed |
| Nit 11 | `B7c.1`'s tool list (7.3) | placed |

The fixes change no batch boundary, gate, public contract or owner answer.
Step 16 also folds in the first look's open check on
`restore-prod.test.mjs`.

## Blockers

None.

## Risks

None new. The R2 answer also returns `ok` when another tab saved the same
content; the content is then the same, so no banner is needed.

## Nits

1. `local` - Step 5's client range `/[\u0001-\u0008\u000b-\u001f]/`
   admits U+0000, which `jsonb` refuses at input (`22P05`), so the fake
   would accept a text the database refuses. Start the range at `\u0000`;
   a fixture cannot carry it through layer 3, so pin it in
   `homebrew.test.ts` alone.
2. `local` - Step 15 says "the seven validators and the formula"; step 2b
   defines six validators (`homebrew_key_ok`, `homebrew_names_ok`,
   `homebrew_text_ok`, `homebrew_content_valid`, `homebrew_book_valid`,
   `homebrew_snapshot_valid`) and the formula `homebrew_snapshot_of`.
3. `local` - Step 15's pin names the roles but not the expected
   `service_role` value. `limits.test.mjs` pins `service: false` for
   `effective_limit()` under the same revoke list, so the expected value is
   "none" for every new function except any the plan grants. Say so, so the
   pin states a rule and does not copy what it observes.
4. `local` - `handoff.md`, "Durable items written to their homes", still
   says "the four mirror lines"; "Files changed" and `plan.md` section 10
   say five.

The implementer can take all four inside `B7.1`. None changes a step's
design.

## Deviations

- None new. The handoff's recorded deviation (m09 and m17 changed with m02
  and m22) stands as accepted in the first look.

## Suggested next action

Dispatch the `B7.1` implementer after `limits-follow-overrides` commits,
with nits 1-4 as local lines of the batch. After the batch, a batch review
(`reviews/B7.1.md`: a migration with SECURITY DEFINER functions and a new
write path).

## Checks still needed

- In `B7.1`: step 1's facts (R2's column check name, the migration stamp
  after `20260930120000`); `npm run check`; `npm run check:db` with the
  reversibility gate; after the batch review's approve, `npm run db:push --
  --project test` and `npm run e2e` (cases A-M and the anon checks).
