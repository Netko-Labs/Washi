# Lessons

- **Never `git stash` while `bun run dev:studio` runs.** The router plugin rewrites
  `routeTree.gen.ts` the moment the route files vanish, and the pop then refuses to overwrite it.
  Compare against a baseline with `git worktree add` instead; if it happens, `git checkout` the
  generated file and pop again.

- **One Bun everywhere.** `packageManager`, CI and images must agree: Bun 1.4 writes lockfile v2,
  which 1.3 can't read. The repo is on `bun@1.4.0`; bump all three together.
- **`mirin check` failing on a branch proves nothing until the base passes too.** "Never published
  an inspector endpoint" hit an already-green branch the same way, so it was the machine.
- A branch forked before a package move is *ported*, not merged: modify/delete conflicts on the old
  paths hide real changes (new verbs, prompts) that must be re-applied at the new home.

## Overnight loop (2026-10-14)

- One source of truth for "what is open": `activeTab` (the URL) and `sheets.activeId` disagreed under
  strict-mode double effects, and a dead link rendered a different page. Derive, don't mirror.
- Resets belong in the route loader, not effect cleanups: child effects run before the layout's, and a
  cleanup runs *after* the next workspace's loader — both wipe state the new route just set.
- `workspaces.list` is public and returns `[]` signed out — check the session before treating "not in the
  list" as "not a member", or a shared link loses its redirect.
- CI failing in `bun install` with "Fail extracting tarball" is the registry, not the code: rerun the job
  once; if it repeats, look at the lockfile.
- Shell-built HTML/JS crawls break on zsh globbing and huge variables; a 15-line Bun script is faster.

## Notion parity (2026-10-14)

- **Stacked PRs: retarget the child to `main` before merging the parent with `--delete-branch`.**
  Deleting a base branch closes every PR on it, and a closed PR whose head was force-pushed
  cannot be reopened — the way back is pushing both heads to their pre-close commits, reopen,
  retarget, then push the rebase again.

## 2026-10-21 — a checkout emptied Juan's review notes
`tasks/design-review.jsonl` was committed empty in #58 before its ignore landed. `git rm --cached` on a
branch, then `git checkout main`, restored the tracked empty file over 18 live rows. Rule: a file that
holds local state must be untracked on **every** branch before switching; before any checkout or pull
that touches it, copy it outside the repo. Restored from the transcript; two timestamps are approximate.

## 2026-10-22 — a stacked PR closed itself, again

Opened #65 against `docs/pages-covers`, then squash-merged #64 with `--delete-branch`: GitHub
closed #65 the moment its base vanished, and a closed PR cannot be retargeted. Same failure as
#21. Rule: **retarget every stacked PR to main (`gh pr edit N --base main`) before merging the
PR under it** — or do not delete the base branch until the stack is flat.


## `git commit -am` leaves new files behind (2026-10-28)
A review fix moved a type into a new `types.ts` and committed with `-am`; the file stayed untracked, the
local typecheck passed against the working tree, and CI failed on #130. After any fix that creates a file,
`git status --short` before committing, or `git add -A`.
