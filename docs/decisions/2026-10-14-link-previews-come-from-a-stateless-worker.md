# 2026-10-14 - Link previews come from a stateless worker

- Superseded in part by "The site moves to Cloudflare Pages and the old host mirrors its files" (2026-10-28): the rejection of moving the app to Cloudflare Pages, and catalog records keeping `i/<id>.html`.
- Task: `link-previews` (owner, chat, 2026-10-14).
- Decision: the Supabase backend is the only server that stores data; one stateless preview Worker, the Pages project `daggerheart-loot` at
  `https://daggerheart-loot.pages.dev/`, draws link cards with the stubs' renderer `tools/share-card.mjs` and stores nothing; it reads as `anon`
  `get_item_preview`, `get_shared_list_preview` and the site's generated `names.json`. `/h/<uuid>`: every item the read returns, no opt-in, with the
  stub's craft and set lines folded, catalog names from `names.json`; catalog records keep `i/<id>.html`. `/s/`: the list name (or «Без названия»; a GM
  link adds «Ссылка для мастера»), the count that the link's audience sees and the start of the players' note, never a GM note. `/p/`: a generic card,
  no read; «Ссылка на набор» hands it out, and it opens in the browser, maybe signed out. `/tables/`: a named catalog table. Every control that copies
  or sends a link hands out a Worker link with its own card, or its exclusion is stated. Reach from Russian networks is not a goal.
- Rejected: a Supabase Edge Function (a GET `text/html` answer is rewritten to `text/plain` without a paid custom domain); HTML in Storage (served as plain text);
  a bake onto GitHub Pages (the public repository's Pages artefact lists every baked item); moving the app to Cloudflare Pages now (a new origin loses sessions,
  browser lists and installed apps); a name map bundled into the Worker (a deploy per data change); `data.json` as the name source (896 KB against a 10 ms CPU
  limit); a homebrew card without craft and set lines (the owner wants the stub's lines).
- Accepted trade-off: the item id, the share token of either audience (a GM token reads GM notes), the print set id and a filter segment that can hold an own `hb_` key
  move from the fragment into a URL path that Cloudflare, crawlers and link scanners receive; a deliberate quota burn of 100,000 requests makes every preview link fail until 00:00 UTC, while `<site>#/h/`, `#/s/`, `#/p/` and `#/tables/` keep working.
