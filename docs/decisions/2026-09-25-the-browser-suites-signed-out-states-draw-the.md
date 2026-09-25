# 2026-09-25 - The browser suites' signed-out states draw the sign-in prompt, and the goldens capture it

- Task: `persist-2-lists` (planner refresh of the account lists; resolves
  a conflict between two 2026-09-24 entries).
- Decision: "Only a signed-in user creates a list" said the prompt states
  are "never by a golden", because the browser suites were to drive an
  unconfigured build; "The browser suites drive a test build with a
  deterministic fake cloud" later rejected that build as the golden subject.
  The test build has a cloud, so signed out it draws the prompt, and the
  goldens capture it. The creation states move to `as gm2` (a seeded user
  with one list). A build with no sign-in configured keeps local creation,
  with no suite of its own beyond the component tests.
- Rejected: an unconfigured second test build for the old signed-out states
  (a second build and a second golden set for a build nobody deploys);
  keeping the creation states signed out (they would stop creating).
- Amends "Only a signed-in user creates a list, from the lists release on" (2026-09-24).
