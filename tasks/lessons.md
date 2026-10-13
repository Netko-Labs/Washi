# Lessons

- **One Bun everywhere.** `packageManager`, CI and images must agree: Bun 1.4 writes lockfile v2,
  which 1.3 can't read. The repo is on `bun@1.4.0`; bump all three together.
- **`mirin check` failing on a branch proves nothing until the base passes too.** "Never published
  an inspector endpoint" hit an already-green branch the same way, so it was the machine.
- A branch forked before a package move is *ported*, not merged: modify/delete conflicts on the old
  paths hide real changes (new verbs, prompts) that must be re-applied at the new home.
