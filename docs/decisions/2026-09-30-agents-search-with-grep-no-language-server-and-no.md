# 2026-09-30 - Agents search with grep; no language server and no ast-grep

- Task: none, a configuration change (the owner, 2026-09-30).
- Decision: the owner removed the `svelte-lsp` and `typescript-lsp` plugins
  and ast-grep from this host. Agents search with `rtk grep` and `git grep`,
  and type errors come from `npm run check` (`.claude/README.md`, "Code
  navigation").
- Rejected: a hook that stops a language server past about 1 GB private
  memory (it treats the symptom, and every session runs it); keeping
  ast-grep (no real search in 665 transcripts, and it adds two skills to
  every session's context).
- Evidence: at 0.1 GB free host memory, svelte-language-server held 779 MB
  after 1.5 h and typescript-language-server with two tsserver children
  about 800 MB after 3 h. Across 665 transcripts agents made 18 LSP calls
  and no ast-grep search.
- Accepted trade-off: a rename is sized by a text search, not by
  `findReferences`, so a reader checks imports and re-exports by hand.
