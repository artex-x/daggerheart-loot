# 2026-10-28 - Artwork, its thumbnails and rendered build inputs stay tracked in git

- Task: `repo-assets` (planner, 2026-10-28, owner AFK: the recommended option; the owner confirmed `img/` and `og/` the same day).
- Decision: `img/<id>.webp`, `img/thumb/`, `og/<id>.jpg`, `og/_share.jpg`,
  `og/_share_en.jpg`, `app/public/icons/*.png` and `card/*.svg` stay
  tracked, and the deploy builds none of them; `docs/DECISIONS.md` stays
  tracked. A file leaves git only when `node tools/build.js` makes it from
  tracked text with no image encoder.
- Rejected: `og/<id>.jpg` from `img/` at build (a second lossy pass on the
  card picture; an encoder change moves every record's card version, so
  every record link becomes a new URL; `sharp` in the deploy); `img/thumb/`
  at build (`sharp` and about 60 s in each job that serves the app and on
  each fresh checkout, for about 3 MB); the share cards and icons at build
  (fontconfig and `sharp` in the deploy for six hand-changed files); Git
  LFS or a bucket (a new storage piece; owner, 2026-10-28).
- Evidence: `docs/artwork.md`, "Risks": `img/` and `og/` come from one
  delivery outside the repository; `card/*.svg` are Figma exports.
