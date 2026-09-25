# 2026-09-25 - Commit author and attribution are set in `.claude/settings.json`

- Task: `persist-1-auth` (the human's request of this date).
- Decision: `.claude/settings.json` sets `attribution` empty (no trailer,
  no pull request footer) and `env` with the git author and committer
  `artex-x <artex-x@users.noreply.github.com>`; `CLAUDE.md` keeps only
  "Use Conventional Commits". The `bash-guard.mjs` rule that denies an AI
  attribution trailer stays, as the backstop for a session or host that
  does not load these settings. Settings apply from the next session start.
- Rejected: the author sentence in `CLAUDE.md` (a rule each agent had to
  remember while the harness asked for a trailer, which cost blocked commit
  attempts); retiring the trailer rule (nothing else would catch a trailer
  from a host that ignores the settings); a `git config` step in the cloud
  setup script (one host only, and outside the repository's review).
