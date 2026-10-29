---
name: backlog
description: Work an issue backlog kept in a Washi workspace — pick an open issue, fix it in this repository, open the pull request, and record it on the issue's row. Use when asked to "take the next issue", "work the Washi backlog", or to fix a named Washi issue.
argument-hint: "[issue title or id — optional]"
---

# Work the Washi backlog

Washi holds the backlog; you do the work in this repository. Every write to Washi lands as the person
whose token or sign-in you use, with its history — so touch only the issue you took.

## 1. Find the backlog

1. `db_list_tables` — find the issues table (often `issues`, `tasks` or `bugs`). Read its columns:
   the title, the `status` column and its groups (`todo` · `doing` · `done`), and any priority,
   assignee (`person`) or link columns. If more than one table could be it, ask which.
2. `people_list` — find your person's id if you will assign the row.

## 2. Take one issue

1. If the user named one, find it with `db_query` (`where` on the title, `contains`). Otherwise query
   the open rows — `status` not in the `done` group — ordered by priority, then oldest first, and
   take the first that is not assigned to someone else.
2. Read what it says: the row, its page (`comment_list` with its `recordId`) and any page it links.
3. Tell the user which issue you took and why, in one line, before you start.
4. Mark it taken: `db_mutate` an `update` setting its status to the `doing` group's first value
   (and the assignee to your person, if there is one), then `comment_add` on the row:
   "Picking this up from Claude Code — <one-line plan>."

## 3. Fix it here

Work as this repository asks (its CLAUDE.md, its conventions, its tests). Branch, make the smallest
change that fixes the issue, run the relevant checks, commit, push and open the pull request only as
this repository and the user allow. Never mark an issue done because the code looks right — the
checks have to pass.

## 4. Close the loop in Washi

1. `comment_add` on the row: the pull request URL and one line on what changed and what you checked.
2. Move the status: to a "review" value if the status column has one, or leave it in `doing` until
   the pull request merges. Set the `done` group only once it has merged, if you were asked to merge.
3. If the fix is blocked, say why in a comment, put the row back in `todo`, and tell the user.

## Rules

- One issue at a time. Never change rows you did not take, nor delete any.
- Ask instead of guessing when the table, the status values or the issue are unclear.
- Pages are WSX: edit one only with `sheet_get` → `sheet_check` → `sheet_replace` passing the
  version as `baseVersion`, so a teammate's typing is merged, not overwritten.
