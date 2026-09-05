TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: everything after `TASK:` and before the first `-` (or the whole id if there is no `-`)
* `TASK_DIR`: `issues/<TASK_ID>`

You are reviewing a completed batch. Read-only unless the orchestrator explicitly requested a fix-pass.

This prompt is agent-agnostic (Claude Code, Codex, or similar).
Always read and follow `CLAUDE.md` first.
Do not select models.

Before reviewing:

1. Read `CLAUDE.md`
2. Read `<TASK_DIR>/plan.md` and `<TASK_DIR>/handoff.md`
3. Read any mocks under `<TASK_DIR>/mocks/` if referenced
4. Inspect `git status` and `git diff` (and last commit if handoff points at one)
5. Read relevant `docs/specs/` for touched behaviour (CONTRACTS, FEATURES, ROUTES, I18N, COVERAGE as needed)
6. Scope = batch described in handoff as completed, or the explicit scope from the orchestrator

If plan/handoff is missing, stop and say review cannot proceed.

## What to verify

### A. Batch fidelity
- Did the change match the batch objective, in/out scope, and acceptance criteria?
- Any silent scope expansion or skipped acceptance criteria?
- Were approved mocks / visual constraints followed?

### B. Public contracts (high severity if broken)
- Record ids stable (no renumbering of shipped ids)?
- Routes / hash grammar / filter keys unchanged unless plan allowed it?
- List-link behaviour and generated artefacts (`data.json`, `catalog.csv`, `i/*.html`) consistent?
- If contracts changed: were fixtures, CONTRACTS.md, tests, and llms.txt updated in the same change?

### C. Data integrity (if data touched)
- `data.js` is source of truth; derived files rebuilt via `node tools/build.js`?
- `craft` links correct; not confused with equipment upgrade lines?
- `refs` added/reused correctly (no duplicate cards, bilingual as existing pattern)?
- Image paths: `img/<id>.webp`, `og/<id>.jpg` present when required?
- Counts in README / llms.txt / tests not left stale?

### D. Product / UI
- New roll/table/filter behaviour matches plan?
- i18n: both languages considered where the app requires it?
- Visual parity rules respected (refactor not redesign) unless plan explicitly changed look?
- No unrelated chrome redesign?

### E. Tests and gates
- Commands claimed in handoff вЂ” were the right ones run?
- `npm run check` when code/app surface changed?
- `npm run check:built` when screen output / dist assets may change?
- Missing tests for new behaviour?

### F. Handoff quality
- plan.md status updated honestly?
- handoff lists next batch in implement-ready form (or says done)?
- Deviations documented with rationale?
- Blockers clear?

## Output format
1. **Verdict:** approve | fix-then-continue | replan
2. **Blockers** (must fix before continuing)
3. **Risks** (non-blocking)
4. **Nits**
5. **Suggested next action**
6. **Checks you would still run** (if any were skipped)

Do not implement fixes unless explicitly asked.
Do not write model routing into markdown files.