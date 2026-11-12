# 2026-11-10 - Game text rights follow a per-record SRD 2.0 audit

- Task: `ai-mcp` (owner, 2026-11-10: Q6 = C, Q7 = A).
- Decision: `docs/rights/records.json` marks a Core, Hope & Fear or campaign frame record `dpcgl`
  only where SRD 2.0 holds its English name and text (equipment: trait, range, damage, burden,
  feature; loot: roll number and effect), with the 1-based PDF page; every other record and every
  source row is `owner`, and so is every record while `reviewed` is null. Record v1 carries
  `rights.license` (`dpcgl` or `owner`) and an English `notice`. `dpcgl` covers the English text
  only: the Russian text is a translation, credited apart by the "Sources" table of `README.md`.
  Text is matched after lowercasing and removing punctuation, markup, whitespace and hyphens,
  expanding ligatures and folding accents, with a number sign kept. A value change is a data change, not a schema change. The API
  serves the Russian text on the same reading as the site, and the takedown promise covers the API.
- Rejected: a value per source (Q6 A: wrong for part of the frame records either way); frames
  `dpcgl` (Q6 B: DPCGL 1.5(c) and 1.9.3 keep campaign frame text out unless the SRD holds it);
  a written request to Darrington Press first (Q7 B: an unknown delay); English only for `dpcgl`
  records (Q7 C: breaks RU/EN parity).
