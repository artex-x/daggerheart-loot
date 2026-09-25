# 2026-09-18 - Retire scope: audit every shipped directory, then delete - never a blind delete

- Task: `workflow-hygiene` (human decision).
- Decision: every task directory whose work has shipped is read in full,
  its durable content moved to a permanent home, every tracked citation into
  it repaired, and only then is the directory deleted.
- Rejected: a blind delete of old task directories - it is exactly what
  produced orphaned citations for issue 65's retired `plan.md`; the audit
  is the fix.
