# 2026-10-08 - Every print is a stored set; long print links are retired

- Task: `print-snapshots` (the owner's answers of 2026-10-08; the sign-in to open a received link confirmed by the owner the same day).
- Decision: every print control stores the sheet as a print set in the reader's account and opens `#/p/<id>`, 12 base64url
  characters (72 bits) that the database makes; the app writes and reads no long print address. All printing
  needs sign-in, catalog prints included: a signed-out visitor gets the sign-in prompt on every print control, and a
  received `#/p/` link needs sign-in too, so `get_print_set` is for `authenticated` only. A build with no sign-in
  configured draws no print control, and `#/p/` draws the not-found page there.
- Breaking change (owner, 2026-10-08): `#/print/<ids>`, a frozen public route until this release, stops opening; every
  address under `#/print/` draws the retired print page, an old link's holder included. R9 shipped without its two planned print routes.
- Rejected: old long links "still open" or "open with a notice" (the owner); the long address beside the sets for
  signed-out catalog prints (the owner chose one path); `#/print/p/<id>` (longer, and the retired space would read a
  sub-path again); 8 characters (48 bits, thin for an id any reader can try); a client-made id (the database cannot
  promise its randomness); `#/p/` open to `anon` (the browser prints the page, and a fifth `anon` function that writes).
- Supersedes "The print address carries a list's count as `*<n>` per id" (2026-09-22).
- Amends "The compact sheet is an independent size switch for both print layouts, kept in session memory" (2026-09-23): `#/print/<ids>` is retired.
