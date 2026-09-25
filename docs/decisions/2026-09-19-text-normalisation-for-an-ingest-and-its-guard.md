# 2026-09-19 - Text normalisation for an ingest, and its guard

- Task: `dragons-vault`.
- Decision: in `en`/`ende`/`ru`/`rud`, U+2018/U+2019 become `'`;
  U+201C/U+201D become `"` in English and `«»` in Russian; U+2014, U+2212
  and `«»` stay as the catalogue already carries them (33, 57 and 18
  records). `tests/dataint.js`'s apostrophe guard widens to the four
  quotation marks. Dropped fields are not normalised.
- Rejected: normalising to U+2019 (the other way DEBT D41 offered; the
  catalogue is already ASCII, so D41 was stale and is deleted); ASCII for
  the dash, the minus and the Russian quotes (search folds U+2212 and the
  shipped data carries all three).
