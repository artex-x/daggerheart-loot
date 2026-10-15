# 2026-10-15 - AI assistants read a compact index and the record pages

- Task: `ai-integration` (owner, interactive, 2026-10-15).
- Decision: an assistant reads `catalog-index.csv` (`catalog.csv` without `url`, `text_ru`, `text_en`, under 200 KB, `CONTRACTS.md` section 4)
  in one fetch, then a record's page `i/en/<id>.html` or `i/<id>.html`, and `catalog.csv` or `data.json` whole only with a tool that reads a large
  file in full (`llms.txt`, "Read this first"). Both robots files carry `Content-Signal: search=no, ai-input=yes, ai-train=no` (`META.md` section 2).
  A remote MCP endpoint follows as the task `ai-mcp`, after `cloudflare-pages`. It reads the catalog, the tables, file checks, shared links and
  homebrew signed out, and the reader's own account through Supabase OAuth, read and write. It is the route `/mcp` of the Pages project
  `daggerheart-loot`; the product-law sentence changes in `ai-mcp`. `cloudflare-pages` owes three duties: it publishes `catalog-index.csv` on the
  new host and keeps it on the old host (`CONTRACTS.md` section 5), it reserves `/mcp`, and it keeps a record page's full text readable with no
  script or changes the `llms.txt` route in the same commit.
- Rejected: a root robots file for `artex-x.github.io` (one more repository outside this one's tests); per-record Markdown pages (the stubs hold the
  text; 2700 more frozen paths); per-source CSV shards (more frozen paths); a split `llms.txt` (every section check moves; 48 KB fits one fetch); an
  MCP endpoint now (it waits for the final host); no MCP (no file check and no roll for an assistant); a local MCP package (desktop and coding
  clients only); a second Cloudflare account (a second account, token and secret set to keep).
- Accepted trade-off: `ai-input=yes` allows AI search answers built from a crawled copy too, not only a fetch a person asked for; the old host's
  frozen text files stay readable to the named training crawlers, because only a root file for `artex-x.github.io` fixes it (`DEBT.md` D104).
