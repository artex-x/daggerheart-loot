# 2026-10-02 - E2E case L passes the 5 MB import on success or a whole tooSlow refusal

- Amends "The list_entries touch and limit triggers run once per statement" (2026-09-30): the notes-heavy import may answer `tooSlow`.
- Task: `persist-7d-homebrew-files` (the planner, 2026-10-02; the owner: retry first, then plan a fix).
- Decision: case L of `app/src/ports/cloud.contract.ts` passes the notes-heavy import (about 5.5 MB of rows) when it
  answers `ok`, or `refused` with `reason: 'tooSlow'` and no list written, and logs which with the time; any other
  answer fails. The import of 50 lists of 100 entries keeps its 6000 ms bound. The product does not change: a timeout
  already answers «Файл слишком большой для одного импорта: разделите его на несколько.» and writes nothing.
- Rejected: a retry in the case (each try costs 8 s of a swapping host, and a pass proves no more than the first
  answer); a smaller notes-heavy import (it hides the 5 MiB file that the app accepts); a contract that continues past
  a failure (the later cases run on an unknown state); a compute add-on or a longer `authenticated` timeout (cost, and
  the owner's call); an import split into calls by the client (a new write protocol that is not all or nothing).
- Evidence: the test project, 2026-10-02, HEAD `d82e3e1`: three `npm run e2e` runs, the notes-heavy import 10699-12325
  ms, each `57014`; later, rolled back on a direct connection, the same 5551590 bytes 175-207 ms plus 53-71 ms
  deferred, the same with the frozen-copy trigger off; through PostgREST as a throwaway user 2279-2761 ms, HTTP 200.
  The host had 426 MB of RAM and about 600 MB of swap in use.
- Accepted trade-off: the e2e no longer proves that a 5 MiB file imports on the test host; a production minute that swaps can refuse it too.
