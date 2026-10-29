#!/usr/bin/env bash
# The collect, the guard and the old host's assembly of ci.yml's deploy and
# deploy-replay jobs: one copy, so a branch run proves the exact shell that
# deploy runs on main. Run it from the repository root after npm run build.
#
#   bash tools/collect-site.sh collect|guard|old-host
#
# docs/specs/META.md section 9; docs/decisions/, 2026-10-29, "A run outside
# main replays the deploy's steps before its first secret".
set -e

collect() {
  # An explicit list rather than "everything": the repository also holds the
  # sources and the specs, and none of that belongs on a public site. A new
  # top-level asset has to be added here on purpose.
  #
  # Note `dist/assets` and `dist/data.js` by name, and never `cp -r dist/.`:
  # the build makes dist/img, dist/og and dist/card as symlinks into the
  # repository root (vite.config.mts, the artwork() plugin), and a symlink is
  # not what should reach the artifact. Those three folders are copied from
  # the repository below, like the rest of the static assets.
  # `dist/manifest.webmanifest`, `dist/sw.js` and `dist/icons` are build
  # outputs too, copied verbatim from app/public/ (docs/specs/META.md
  # section 9). `dist/data.js` carries the record links' card versions
  # (window.LOOT_V), so it is never the source data.js.
  #
  # `data.json`, `catalog.csv`, `names.json` and `catalog-index.csv` are
  # not in the repository - the Build step above regenerates them (npm run
  # build -> npm run data -> tools/build.js) immediately before this step
  # copies them, so Collect must never be reordered ahead of Build.
  # `dist/i/` (with `dist/i/en/`) and `dist/en/` are the record and
  # English-root app documents the build writes (vite.config.mts,
  # appDocuments); the repository root's `i/` and `en/` are the redirect
  # pages, which only the old host's mirror publishes (CONTRACTS.md section 5).
  mkdir -p _site
  cp -r dist/index.html dist/assets dist/data.js dist/manifest.webmanifest \
        dist/sw.js dist/icons dist/i dist/en _site/
  cp -r data.json catalog.csv catalog-index.csv names.json llms.txt robots.txt LICENSE \
        404.html img og card schema _site/
  # Only the generated site pages, one copy per language: pages/src/
  # is their authored source, not site content (docs/specs/META.md
  # section 9).
  mkdir -p _site/pages && cp pages/*.html _site/pages/
  mkdir -p _site/pages/en && cp pages/en/*.html _site/pages/en/
}

guard() {
  # app.js and style.css do not exist in the repository any more (the
  # old app was deleted at R0c, issue 47, 23c00a6) - if either turns up
  # in _site anyway, some other step re-created it, and a stray root
  # file like that must never reach _site. The card families (h, s, p,
  # tables) belong to the worker, mcp is reserved for the ai-mcp task,
  # the Pages control files live in preview/public/ only, and old-host/
  # is the mirror's (docs/specs/CONTRACTS.md section 5). A file or a
  # folder named after a route that _redirects rewrites would shadow
  # the rewrite (roll search lists account homebrew print l).
  for f in package.json node_modules app tests tools docs .git app.js style.css \
           pages/src supabase preview old-host mcp h s p tables \
           _worker.js _routes.json _headers _redirects card-versions.json \
           roll search lists account homebrew print l; do
    if [ -e "_site/$f" ]; then echo "::error::$f must not be published"; exit 1; fi
  done
  # en/ holds only the English root document: anything else there would
  # shadow an /en/ rewrite of _redirects.
  if [ "$(ls -A _site/en)" != "index.html" ]; then
    echo "::error::_site/en holds more than index.html"; exit 1
  fi
  # The other half, and the deterministic detector for a dangling
  # symlink: [ -e ] is false for one, and [ -s ] / a non-empty listing
  # catches a link that resolved to nothing.
  for f in index.html data.js data.json catalog.csv catalog-index.csv names.json \
           llms.txt robots.txt LICENSE 404.html manifest.webmanifest \
           sw.js icons/icon-192.png pages/install.html pages/en/install.html \
           pages/privacy.html pages/en/privacy.html pages/terms.html \
           pages/en/terms.html schema/import-v1.json schema/import-v2.json \
           schema/import-v3.json schema/homebrew-v1.json schema/homebrew-v2.json; do
    if [ ! -s "_site/$f" ]; then echo "::error::$f is missing or empty"; exit 1; fi
  done
  # assets/ holds hashed names only, so it is checked as a folder.
  for d in assets img og i i/en en card pages pages/en; do
    if [ ! -d "_site/$d" ] || [ -z "$(ls -A "_site/$d")" ]; then
      echo "::error::$d is missing or empty"; exit 1
    fi
  done
  # One named file per symlinked or generated folder, not just "the
  # directory is non-empty" - the same by-name checks tools/check-site.mjs
  # makes against the live URL, made here first against the local copy.
  for f in og/_share.jpg og/_share_en.jpg img/_none.webp img/thumb/_none.webp \
           card/die-d12-bw.svg i/w1.html i/en/w1.html en/index.html \
           icons/maskable-512.png; do
    if [ ! -s "_site/$f" ]; then echo "::error::$f is missing or empty"; exit 1; fi
  done
  # `i/` and `i/en/` are built output (npm run build ->
  # tools/app-documents.js), one app document per data row per
  # language - "the directory is non-empty" above would pass just as
  # happily for one document as for all of them, so it cannot catch a
  # partial generation. catalog.csv has exactly one header row plus
  # one row per record (tests/derived.js proves catalog.csv's own row
  # count against data.js already), so it is the count already on
  # disk to compare against, with no extra source of truth to invent.
  # Only *.html counts: i/ also holds the en/ directory.
  csv_rows=$(($(wc -l < _site/catalog.csv) - 1))
  for d in i i/en; do
    stub_count=$(find "_site/$d" -maxdepth 1 -name '*.html' | wc -l)
    echo "$d document count: $stub_count, catalog.csv data rows: $csv_rows"
    if [ "$stub_count" -ne "$csv_rows" ]; then
      echo "::error::_site/$d has $stub_count app documents but catalog.csv has $csv_rows data rows - a partial generation would otherwise slip past the non-empty check above"
      exit 1
    fi
  done
  # The collect step above only copies - byte-for-byte, not "a file of
  # the same name showed up".
  if ! cmp -s dist/index.html _site/index.html; then
    echo "::error::_site/index.html does not match dist/index.html"; exit 1
  fi
  if ! diff -r dist/assets _site/assets; then
    echo "::error::_site/assets does not match dist/assets"; exit 1
  fi
  echo "published:"; ls -A _site
  # Cloudflare Pages takes 20,000 files per deployment on the free plan
  # (.claude/README.md, "Preview host").
  echo "published files: $(find _site -type f | wc -l)"
}

old_host() {
  # The old host's mirror: every frozen path, no app. The root forwards to
  # the site's host and sw.js unregisters itself; i/ and en/ are the
  # redirect pages of the repository root, not the app documents
  # (docs/specs/META.md section 9, "The old host").
  cp -r _site _old
  rm -r _old/assets _old/data.js _old/pages/install.html _old/pages/en/install.html
  rm -r _old/i _old/en
  cp -r i en _old/
  cp old-host/index.html old-host/sw.js _old/
  csv_rows=$(($(wc -l < _old/catalog.csv) - 1))
  for d in i i/en; do
    stub_count=$(find "_old/$d" -maxdepth 1 -name '*.html' | wc -l)
    echo "$d stub count: $stub_count, catalog.csv data rows: $csv_rows"
    if [ "$stub_count" -ne "$csv_rows" ]; then
      echo "::error::_old/$d has $stub_count stub pages but catalog.csv has $csv_rows data rows"
      exit 1
    fi
  done
}

case "${1:-}" in
  collect) collect ;;
  guard) guard ;;
  old-host) old_host ;;
  *)
    echo 'The mode is missing or unknown. Pass collect, guard or old-host.' >&2
    exit 2
    ;;
esac
