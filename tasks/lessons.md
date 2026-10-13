# Lessons

- **Install with the pinned Bun.** Local Bun 1.4 rewrites `bun.lock` to lockfileVersion 2, which CI's
  `bun@1.3.14` (package.json `packageManager`) can't parse. Use `bunx bun@1.3.14 install` whenever
  the lockfile changes, and check that `sed -n 2p bun.lock` reads 1 before committing.
- **`mirin check` failing on a branch proves nothing until the base passes too.** "Never published
  an inspector endpoint" hit an already-green branch the same way, so it was the machine.
- A branch forked before a package move is *ported*, not merged: modify/delete conflicts on the old
  paths hide real changes (new verbs, prompts) that must be re-applied at the new home.
