# 2026-11-12 - The account API runs the app's own calls under fixed caps and one migration

- Task: `ai-mcp` (owner, chat, 2026-11-12: full UI parity; planner defaults taken (owner AFK), 2026-11-12 and 2026-11-13).
- Decision: `/api/v1/me/` and `/mcp/me` do every action of the app's UI on the reader's own data through the RPCs and table writes that screen uses, and the price edits run `lib/money.ts` on the server (`docs/specs/CONTRACTS.md` section 6, "Account API").
  One migration (`20261113120000_api_client_guard`) holds the guard list of the whole account tier, and the B5 batches land together at the closeout squash.
- Decision: bulk calls take at most 100 ids (10 for a list delete), a multi-row delete needs `confirm` (the count), an import that rewrites needs `expect_overwrites`, and an import's ids are UUIDv5 names under `import_id`.
  An import file and an export page are at most 32768 B and the list read 65536 B (422 past it); each cap rises only after a production reading.
- Decision: a picture upload is REST only (two WebP files, the header read, never decoded, the body at most 413696 B); `/mcp/me` lists the public tools after the account tools; a request to the reader's own list is 409 `conflict`; no print file or PDF endpoint.
- Decision: the consent page is one card of the account page's panels with no client logo; «Подключённые приложения» comes after «Способы входа», is not drawn while the OAuth server is off, and «Отключить» asks the browser's confirm.
- Rejected: lists, entries and items only (Q9; replaced by the owner's parity rule); final price values sent by the client (an assistant rounds differently from the app); a migration per batch (three more `check:db` runs and plan reviews).
- Rejected: a cap by bytes only; a server-side "are you sure" token or import log (state the worker cannot keep); 65536 B export pages (no reading; landing 3 read 32 KB parses at 10-14 ms cold); a ZIP through the API.
- Rejected: base64 pictures in an MCP tool (past the 65536 B `/mcp` body cap); account tools only on `/mcp/me` (a one-connector client cannot add a record or read a shared list); sending a request to one's own list (the app hides that send).
- Rejected: a two-column consent page or the section in the right column; drawing `logo_uri` (a third-party image on an account page, a CSP and privacy change); an empty or a failure line while the server is off (it says "no apps" or fails on production until the switch); disconnect with no confirm.
- Rejected: developer tokens (a token table, a screen and a second guarded write path outside the OAuth scope); revisit when two or more readers ask for unattended access to their own account.
- Evidence: `docs/specs/CONTRACTS.md` section 6; `docs/specs/FEATURES.md`, "Connect an app" and "Account"; `preview/api/me*.test.mjs`.
