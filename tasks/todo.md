# Washi, defined → prod (2026-10-14) — one PR per row, code-whiskers until clean, then merge

Juan's calls: `docs/washi.html` Q1–Q7 — Q5 "do as Notion does", the rest as recommended. "Go, I
want this on prod." Every merge to main ships to washi.netko.dev.

- [x] 0 · docs: the definition, the team's week, Q1–Q7 called
- [x] 1 · the desk lets go: page + table writes land (marked, undoable); fetch/action still ask
- [x] 2 · databases: `status` `multi_select` `person` `url` `relation` properties, date with an end
- [x] 3 · rows are pages: every row has a body page; full open, comments (drawer peek: later)
- [x] 4 · database page: table view with editable cells + add row/property, board view, views as tabs
- [x] 5 · history: append-only row change log, ink `history` query, `Chart` over time
- [x] 6 · linked views: `/view` in the editor inserts a bound view of any table
- [x] 7 · roadmap: `Timeline` binds a table (start/end bars, drag to reschedule)
- [x] 8 · team space starter: backlog, roadmap, wiki, ideas canvas, weekly review routine
- [x] 9 · canvas: `Canvas` `Node` `Edge` (React Flow), node = label + tone + page link
- [x] 10 · live together: writes merge on Loro (`baseVersion`), changes push over `/trpc-ws`,
      presence + Washi presence; raw-binary `/sync` keystroke streaming is still to come
- [x] 11 · find: search across pages, backlinks

Log (one line per merged PR):

- #27 `c94dc2c` the definition + build order. Bot: no findings; CI caught biome linting the new spec
  → excluded like its siblings.
- #28 `6111113` desk lets go, `sheet_revisions` undo stack. Bot: 1 low (undo rejection unhandled) →
  says so inline.

- #29 `fa134ab` Notion properties. Bot: no findings.
- #30 `2cb74df` rows are pages. Bot: 2 low (openRow swallowed errors, stale properties between
  pages) → a shared `Notice` both hosts mount; medium (blanket catch) → says why; low (inline type).
- #31 `75c12b9` `Database`. Bot: 2 low (stuck on Loading, inline prop types). Found on the way:
  hanko's dispatch silently ignored a new verb → exhaustive `never` switch.
- #32 `d984e8a` history. Bot: **high** — the backfill stamped current data at creation → replays
  the oplog instead.
- #33 `e9d3bf4` `/` live data. Bot: medium (failed insert vanished) → Notice.
- #34 `11dbcc4` `Roadmap`. Bot: 4 rounds on drag state — snap-back, one-frame double shift,
  mid-drag remote update, `pointercancel` → a shift belongs to its dates; held follows the pointer.
- #35 `9854811` `Canvas`. Bot: medium (second edit over the first) → one writer per loaded page;
  `swap` keeps identity for untouched elements (the editor's `swapNode` too).
- #36 `c3f08f8` team space + `people_list` + new pitch. Bot: no findings.
- #37 `b927a03` find. Bot: no findings.

Later, still open: drawer peek for rows; saving view filters from the UI; resizing roadmap bars;
an Undo for table writes (the change log can replay it); keystroke-level `/sync`; desktop presence.

# Notion parity, web (2026-10-14) — one PR per row, code-whiskers until clean, then merge

Juan's call: Notion-style nesting (a "folder" is a page with children), all four parity areas,
studio only. Mobbin: Notion sidebar + cover/icon header, AirOps trash, Dropbox Dash comments.

- [x] 1 · data: `parent_id` + `position` (fractional keys), move with cycle guard, delete
      cascades to the subtree, Trash (list · restore · purge · empty), agent files by parent;
      switcher drops "All workspaces"
- [x] 2 · sidebar tree (expand, + sub-page, drag to reorder/nest), breadcrumbs, `/trash`
- [x] 3 · page chrome: icon picker, cover, inline title, full width, ⋯ menu (duplicate · move
      to · copy link · delete)
- [x] 4 · type into pages: block editor over WSX — text-like primitives editable, the rest
      stay agent-made
- [x] 5 · comments + @mentions, mentions land in Inbox

Log (one line per merged PR; every round fixed, merged only on a clean round):

- #20 `d7307cb` nesting + Trash data. Bot: 1 low (subtree trash not atomic) → one transaction each
  for delete/restore/purge, rollback test.
- #21 `b9a2589` sidebar tree, drag, breadcrumbs, `/trash`. Bot: 2 low (unhandled failed move,
  stale drop line) → fixed. Closed itself when #20's branch was deleted — see lessons.
- #22 `71a5713` icon, cover, full width, ⋯ menu. Bot: no findings.
- #23 `ced6225` block editor over WSX; `serialize` escapes typed text. Bot: 2 low (multi-run text
  spacing → locked; labels → values).
- #24 `79de3be` comments + @mentions in the Inbox. Bot: medium (Enter mid-IME sends — also split
  editor blocks) + 2 low (double send, unread count capped at 50) → fixed.

Follow-ups worth doing (not started):

- Push mentions/comments over `/trpc-ws` instead of the 30s poll; notify thread participants.
- Inline marks in the editor (bold, `@page` links via `Ref`); comments anchored to blocks.
- Duplicate with sub-pages; Trash auto-purge after N days; custom cover images (needs storage).
- `sheet_move` agent tool (CHANGE_TOOL) so Washi can file existing pages.


# Workspace switcher (2026-10-14) — switch organizations without leaving the page

- [x] sidebar header is a switcher (Mobbin: v0 · hilos · Replit): every workspace with its own
      mascot tile, ✓ on the current one, inline "New workspace", "All workspaces"; Search is a row
- [x] switching keeps each workspace's tab strip — the outgoing shell no longer writes the
      incoming tabs under its own key or pushes its own URLs while the next loader runs
- [x] returning to a visited workspace resets the stores again (`gcTime: 0` on `/w/$workspaceId`)
- [x] dashboard → dashboard switch selects the tab (shell keyed by workspace id)
- Verified locally in a browser: A↔B↔new workspace, page → other workspace, Back, Escape,
  outside click, mobile drawer. Desktop untouched — embedded mode has one workspace.

# Overnight UX loop (2026-10-14) — PR per item, code-whiskers until clean, then merge

Juan asleep; autopilot (push → PR → bot review → fix every finding → squash-merge → verify deploy).
Inspiration: Mobbin web references — Notion, Fibery, Obvious, Copilot, Grok (docked AI was declined:
the agent stays a floating popover).

- [x] 1 · safety: two-step page delete (both sidebars) · invalid WSX → 400 not 500 · sessions left
      `running` by a killed process → `error` at boot
- [x] 2 · sidebar: Recent + Favorites (per person, browser storage — no backend), star in header
- [x] 3 · page polish: loading state, real "page not found" for dead links, "edited X ago"
- [x] 4 · dashboard: an empty workspace gets starter prompts, not zeros
- [x] 5 · verify washi.netko.dev serves the last merge; log what shipped

Log (one line per merged PR):

- #17 `f3c67b4` dashboard starters for an empty workspace. Bot: approved, no findings. Live 440s
  after merge; all 14 prod chunks crawled — every feature string from #11–#17 present.
- #16 `ac72e04` page states (loading · missing · failed · reload-on-edit), edited-ago in header; the open page is the active tab only (fixed a dead link rendering the wrong page). Bot: approved, no findings.
- #15 `a575397` favorites + recent-first sidebar, ★ in header. Bot round 1: 1 low (inline store type) → fixed; round 2 clean. CI flaked once on an npm tarball download → rerun green.
- #14 `9371afb` safety pass — two-step delete, WSX 400, interrupted sessions → error. Bot: approved, no findings.

Shipped overnight (all auto-deployed by Coolify, 4–8 min per merge; prod verified at the end):

| PR | What a person notices |
|---|---|
| #14 | Trash needs a second click ("Delete?"); bad page code is a clear 400; a chat cut off by a redeploy stops claiming to run |
| #15 | ★ in the header pins a page to **Favorites**; pages list most recently edited first |
| #16 | Loading shows placeholders, dead links say "This page isn't here", the open page reloads when Washi edits it, "edited X ago" in the header |
| #17 | A new workspace opens on four plain-language page ideas instead of zeros |

Follow-ups worth doing (not started):
- remove `sheets.activeId` — nothing renders from it since #16; `select` is its last reader
- favorites follow a person across devices (server-side, per member) if people ask
- a real agent turn on prod with auto-approve on (needs a key in the workspace)
- the 500→400 middleware only covers `SheetValidationError`; table validation errors could follow

# Studio rev 2 — one UI package, the web catches up (2026-10-14)

Why: the studio is a design generation behind the desktop — no mascot (WSX `<Mascot>` renders
blank), old palette/fonts, pre-rev-2 agent chat, raw markdown, no tabs/inbox/palette.

Decided: shared **`@washi/ui`** (desktop components move, both apps import); the web keeps
sign-in → workspace → key and gets reskinned; Daily note waits for real data.

- [x] 1 · `@washi/ui`: css (tokens, fonts, keyframes, `@source`), bindable `api`, mascot, sheet-icon
- [x] 2 · stores + agent panel + palette + inbox + dashboard + tabs + header + sheet view move in
- [x] 3 · markdown in agent replies (react-markdown + remark-gfm), chunk merge on both apps
- [x] 4 · studio shell rev 2: sidebar (web), tabs, header, ⌘K, inbox badge, theme toggle,
      settings tabs, auth/picker/first-run reskin, mobile drawer
- [x] 5 · verify: typecheck · biome · `bun test` · desktop `mirin check` · studio in a browser
      (desktop + phone width) · a page with `<Mascot>` renders

Acceptance: both apps import the moved components from `@washi/ui` (no copies); every check above
green; studio screenshots before/after in the PR.

# Studio architecture — one Start app, a desktop with no port (2026-10-12)

Why: two images (Bun.serve + a Vite SPA) built from the whole monorepo took 30+ min on Kuma and
never shipped. Base on `Netko-Labs/tanstack-solo-server-monorepo-template`.

Decided (all the recommended options):
- desktop calls the **same `appRouter`** over mirin IPC (a tRPC link), no loopback HTTP or token
- web subscriptions over **`/trpc-ws`** (template's crossws bridge), cookie auth on the upgrade
- **backend first**; a shared UI package is a follow-up
- auth stays **email + password** + invite links

```
packages/washi/{domain,repository,service,trpc,control,runtime}   shared by both apps
apps/studio    TanStack Start on Nitro: SSR, /api/auth, /api/trpc, /trpc-ws, routine clock
apps/desktop   mirin: runtime in main, renderer → mirin link → appRouter.createCaller
```

- [x] 1 · `packages/server` → `packages/washi` (names unchanged)
- [x] 2 · Bun 1.4.0 · `@washi/runtime` out of apps/server · trpc http/ws edges from the template ·
      `apps/studio` scaffold (config, auth, trpc, health, railpack)
- [x] 3 · web screens ported into studio routes
- [x] 4 · mirin link: `@washi/trpc/mirin` server + client link; desktop drops the embedded server
- [x] 5a · `apps/server`, `apps/web` deleted; compose builds the studio image
- [ ] 5b · Coolify: Railpack app for studio at washi.netko.dev; retire washi-server / washi-web

Acceptance: typecheck, biome, `bun test` green each phase · studio smoke (health, SSR, trpc http +
ws, auth) · desktop `mirin check` · washi.netko.dev signs up → workspace → first run in a browser.

# MLP+1 — the agent runs where it is cheapest — DONE, awaiting review (2026-10-08)

Overnight, unattended. Design source: "Washi — product design" (12 boards; First run · Today ·
Review · Sprint · Accounts · Research). Scope cut to the agent, because the agent is the product.

- **Web (hosted, self-hosted instance):** the workspace's API key is the inference source. The
  key is asked for in first run, not buried in settings, with the daily stop beside it.
- **Desktop (embedded):** the installed `claude` CLI is the inference source. The person's own
  Claude login pays for turns their plan already covers; the API key path stays as fallback.
- **+1:** every turn ends in a receipt — where it ran, how long, what it cost or what the plan
  saved — and the agent's state is visible without opening settings.

Acceptance — all met:

- [x] `bun test` (186), `bun run typecheck` (14/14), `bun run check` green; `mirin check` green
- [x] embedded with no `ANTHROPIC_API_KEY` but a logged-in `claude` → a real turn completes
      (`check:live`: ask → accept at the desk → page opens → plan receipt)
- [x] a plan-covered turn never counts toward the dollar cap; it still counts as a turn
- [x] hosted never runs a local CLI, whatever the machine has installed
- [x] the web asks for a key in first run, and the daily stop is settable there
- [x] `docker compose up` builds and a hosted turn reaches Anthropic from inside the container

Not verified: **a successful hosted turn on a real API key** — no key was available unattended;
everything up to the provider's 401 is proven, in the browser and in the container.

## Steps

- [x] **1 · `ClaudeSdkPort` for real** — phase 5 ticked it, but the SDK loop still lives inline
      in `host.ts` (524 lines). Extract it behind `AgentPort`; host shrinks to orchestration.
- [x] **2 · local CLI discovery** — find `claude` (PATH is empty for a GUI app, so known install
      paths too), read `--version` and `auth status`. Never store the account email.
- [x] **3 · credential kinds** — `api_key` | `local_cli`. Embedded: preference `auto` picks the CLI
      when logged in, else `ANTHROPIC_API_KEY`. Hosted: api_key only, asserted at construction.
- [x] **4 · plan vs metered spend** — a claude.ai login *and* `apiKeySource` none/oauth means
      the plan paid; record it as `saved_usd`, not `cost_usd`. Turn cap still applies.
- [x] **5 · routes** — `agents.inference`, `agents.setInference`, `agents.setDailyCap`.
- [x] **6 · receipts** — `turn_done` carries model, duration, billing; transcripts render it in mono.
- [x] **7 · web first run** — "Give Washi a key" after workspace creation; skip leaves it asleep.
- [x] **8 · agent status** — Idle / Working / Needs you · today $x of $cap, in the shell.
- [x] **9 · desktop settings** — Agents tab stops being design copy: inference source, spend,
      saved, Resume.

## Verified live (embedded, no ANTHROPIC_API_KEY, `claude` 2.1.293 signed in to Max)

- `pong` turn: `billing: plan`, $0 against the cap, $0.001 recorded as saved, 2.4s.
- Tool round-trip: sheet_list + sheet_check pass, sheet_create stops at the desk exactly once,
  the sheet lands. 17.8s, $0.027 saved.
- `init.apiKeySource` is `none` — not `oauth` — for a claude.ai login. The docs suggest
  `oauth`; the binary says otherwise. Billing is `plan` unless the source names a key.
- `tools: []` really does leave the agent with zero built-ins (init lists `tools: []`).

## Verified in the browser (hosted, Postgres, 1280px and 375px)

sign up → create workspace → first run shows "Give Washi a key", chip reads `Asleep · no key` →
save a key with a $10 stop → first run closes, chip reads `Idle · today $0.00 of $10` → prompt
→ events stream over the now-scoped SSE (`connectionParams.workspace`) → a rejected key reads
"The model provider rejected this API key. Replace it in settings" instead of SDK internals.

## Verified in the desktop app (`mirin check`, 11/11)

The Agents tab, inside the real app with launchd's PATH (no shell), finds
`~/.local/bin/claude`, reads `v2.1.293 · Max plan`, and marks Claude Code **In use** with no
ANTHROPIC_API_KEY set. Its static design rows (authorship, autonomy, scheduled runs, revoke)
are gone — none of them did anything, and features.md §2 forbids a control that lies.

## +1 · Stop, and an honest composer (2026-10-08)

- [x] **Stop** — `agents.cancel`; one AbortController per running turn; a stopped turn answers
      its open approvals "no" and ends `cancelled`, not `error`. Send becomes Stop on both clients.
      Live: cancelled while blocked on the desk → `stopReason: cancelled`, session idle.
- [x] **Composer** — the desktop's fake "Sonnet 4.5" picker and "32k / 200k" meter are gone;
      it shows what it actually thinks with (`Claude Code · max`).
- [x] **`check:live`** — the golden path in the real desktop app, opt-in because it spends plan
      usage: ask → the write stops at the desk → Accept → the page lands → receipt
      `on your Claude plan · 19.4s · saved $0.03 · claude-opus-5-5`. 5/5 in 31s.
- [x] **The page Washi made opens** — `sheet_create` (both ports) emits openSheet; the web now
      subscribes to it too. `check:live` asserts the new page's H1 is on screen.
- [x] **`<Sheet>` takes a title** — said in the instructions now. Every live run's first
      sheet_check failed on it; with one sentence, it passes first time (2 checks → 1).
- [x] **A panel opened late can still answer** — approvals lived only in whichever client was
      subscribed when they fired. Close the panel mid-turn (or be the teammate who opens it later)
      and the turn sat until the 5-minute timeout denied it. `agents.pendingApprovals` lists the
      live ones; boot expires rows a dead process left pending.
- [x] **Claude Code model** — Default · Opus · Sonnet · Haiku per workspace. The CLI's default
      on Max is Opus, which spends plan limits fastest; aliases verified live
      (`sonnet` → claude-sonnet-5-5, `haiku` → claude-haiku-5-5). The composer names it.
- [x] **Invite the team** (design board 1, step 2) — Settings → People: members, invite by
      email, pending invitations with Copy link / Cancel. No email server is assumed: the link
      `?invite=<id>` is the invitation, and only the invited address can accept it (a different
      account gets 403 — checked against the live server). Listing your own invitations needs a
      verified email in Better Auth 1.7, which a box without SMTP can't give, so accept-by-link is
      the path. Driven in the browser: invite → sign out → open link → sign up → inside.
- [x] **Today** (design board 2, honest version) — the web's home: what happened in the last
      day (each turn's ask, the tools it touched, its receipt), Needs you (approvals answerable
      inline), today's money. Read from the transcript and the desk; nothing new stored, nothing
      invented. "While you slept" waits on scheduled runs, which do not exist yet.
- [x] **Who said yes** — `approvals.resolved_by`, stamped from the session.
- [x] **Routines** (the design's "while you slept") — a prompt + a daily time, created by a
      person, run by the server's minute clock over every workspace file (opened or not). A run
      is an ordinary turn: the daily stop, the desk and the receipt all apply, in the routine's
      own conversation, so Today retells it with a badge. Writes wait for a person — 12h, not
      5min, for a routine session. Marked as run *before* it runs, so a crash can't run it
      twice; a routine made after its minute starts tomorrow. Times are stored as UTC minutes
      and shown on the client's clock. Runs on the desktop too, while the app is open.
      Driven in the browser: add → Run now → the turn lands in What happened.
      Reviewed, then reworked: routines due together started together and slipped past the
      daily stop (now one *working* run at a time — one parked on a person doesn't block);
      a routine resumed one conversation forever (now a fresh session per run); the clock
      opened every `*.db` incl. deleted orgs and conjured `default.db` on hosted (now only ids
      the control plane knows *and* that have a file); Run now got the 12h wait (now only
      scheduled runs, cleared when the turn ends); resuming after the minute fired at once
      (now waits for tomorrow); UTC minutes drifted an hour across DST (now wall-clock minute
      + IANA zone). A third review found the "one working routine" rule still beatable —
      parked runs approved together in the morning, and Run now with no guard — so it is
      strict now: one routine in flight, parked or not; Run now obeys it; at the daily stop
      nothing is marked and the day catches up after Resume; zones are stored canonical.
      Known and accepted: a person's own turns run concurrently with a routine, as two
      people's turns already do — the stop is checked per turn, not reserved.
      Fourth check: sound. Open, not regressions: a scheduled run with no credential is
      still marked and lost for the day (`canStart` covers the budget only); a turn whose
      port hangs without asking holds the next routine until someone presses Stop.
- `host.ts` is 293 lines: the daily stop moved to `budget.ts`.

## Reviewed twice, by agents that did not write it

Round 1 found 8 defects; all fixed, each in its own commit with a test that reproduces it
(event bus deaf after 256 events · turn-cap trip unresumable · Console login billed as plan ·
Stop ignored during the probe · concurrent prompt corrupting a turn · approvals outliving their
turn · web streams resubscribing on re-render · Stop as a way around the daily stop).
Round 2 found that **my bus fix introduced a lost wake-up** — and `check:live` caught the same
thing independently: transcript silent, page opened. Rewritten; three new bus tests reproduce
the lost wake-up, a post-restart `lastEventId`, and an orphaned waiter set.

Round 2's leftovers, closed: the Claude port counts a response from its first stream event
(`includePartialMessages`), so a Stop before anything completed is priced (live: $0.0047, not
$0); plan turns keep a $25 notional ceiling rather than none, so a stale probe can't remove the
guard; a crashed fire-and-forget turn is logged, not swallowed.

Still open: the **AI SDK port** prices only finished steps — an OpenRouter turn stopped
mid-step undercounts that step.

## Caught while building

- **Every transcript on a hosted server was public.** `onAgentUpdate` / `onApprovalRequested`
  were publicProcedures over one server-wide bus. Fixed in its own commit, with tests that fail
  against the old procedures.
- **The SDK throws on an error result** instead of yielding it, so a failed turn skipped the
  receipt and the turn count. The port now catches and returns it as a turn.

---

# Phase 6 — the web client can actually ask — COMPLETE (2026-09-21)

137 tests green, 14/14 typecheck, biome green, web build clean. Driven in a real browser:
settings → model picker over 317 live models → prompt → the turn's failure arrives over SSE.

Web is a viewer today: sign in, read a page. "Edit by asking" is the product bet and the
web has no way to ask. Every route exists — `agents.*`, `models.list`,
`workspaces.setAgentKey`, `agents.spend` — and nothing renders them.

Acceptance:

- sign in → set a key and model → ask for a page → approve the write → watch it render
- approvals are inline and blocking; nothing writes without a person
- the breaker's state is visible, and Resume is a button rather than a curl
- works at 375px and 1440px

## Steps

- [x] **1 · settings** — BYOK with a real provider/model picker off `models.list` (317 models,
      not a text field), plus spend and the Resume button.
- [x] **2 · agent panel** — session, transcript, composer, streaming over the SSE subscription
      that already resumes from `lastEventId`.
- [x] **3 · approvals inline** — the desk, in the panel. Review is the primary human verb;
      this is the screen that verb happens on.
- [x] **4 · new page** — something for the agent to write into.

## Verified in the browser

- The picker shows real prices from models.dev, and flags `openrouter/auto` as **unpriced** in
  amber — the exact case that was escaping the breaker before yesterday's fix, now visible
  before anyone picks it.
- A prompt with no key stored fails loudly in the transcript with phase 4's own message,
  delivered over the SSE subscription. That is web → tRPC → AgentHost → key resolution →
  failure → stream, end to end.

## Not verified

**No successful turn.** Everything up to the model call is proven; the model call itself needs
a real key and bills real money. The approval prompt has therefore never rendered against a
live tool call — it is written and typed, not exercised.

## Then

Desktop revamp, once the web shape is known. Building it second means the desktop copies a
design that has already survived a small screen, rather than the reverse.

---

# Phase 5 — two ports, one vocabulary (P6) — COMPLETE (2026-09-20)

122 tests green, 13/13 typecheck, biome green, `mirin check` 10/10.

Model-agnostic agents, with OpenRouter as the first BYOK provider. This is the P6 the
audit has been asking for since August: §05 promises "two ports, one vocabulary" and the
code has one port welded to one vendor.

## The call: AI SDK, not Eve

Both were checked. **Eve** (Vercel, June 2026) is a framework that wants to own the agent's
shape — agents as directories of files, sandboxed code execution, subagents, scheduling.
Washi's most load-bearing rule is the opposite: ink/tsuru/hanko are the only capability
surface, never fs or shell, and Q1/Q11 are closed — power grows by adding components, never
a scripting hatch. Washi already owns the approvals desk, the capability ledger, the
transcript and the session model; adopting Eve means bypassing most of it or rewriting the
trust model around it.

**AI SDK 7** (`ai@7.0.107`) is a library, and it maps 1:1 onto what is missing.
`ToolLoopAgent` takes `model` + `instructions` + `tools`; `needsApproval` on a tool — boolean
or async function — *is* `canUseTool`. OpenRouter is one provider package.

## Steps

- [x] **1 · `AgentPort`** — prompt · cancel · resume, normalizing into the existing
      `AgentUpdate` shape. The transcript UI already speaks it; neither port gets to invent one.
- [x] **2 · `ClaudeSdkPort`** — the current host, behind the interface. No behaviour change.
- [x] **3 · `AiSdkPort`** — `ToolLoopAgent`, ink/tsuru/hanko as AI SDK tools, `needsApproval`
      wired to the same approvals desk both origins already pass through (P4).
- [x] **4 · provider config** — `organization_secret.provider` already exists and defaults to
      'anthropic'. Add the model id, and pick the port from the provider.

## What the docs got wrong

Every blog and the AI SDK 6 release notes say tool approval is `needsApproval: true` on the
tool. In `ai@7` that field is **deprecated** — "Tool approval is handled on a `generateText` /
`streamText` level now" — and the live API is `toolApproval` on the agent, a function returning
`'approved' | 'denied' | 'not-applicable'`. It can await, so Washi's desk plugs straight in.
Reading the installed `.d.ts` found this; the research would have shipped the deprecated path.

## Closed by models.dev (2026-09-20)

`packages/shared/models` reads `https://models.dev/api.json` — 222 providers, every model
carrying `tool_call`, context limits and per-MTok pricing.

- **Cost is no longer null on the AI SDK port.** A turn reports tokens; the catalogue supplies
  the price; the daily breaker works on every provider, not just Anthropic. An *unpriced*
  model yields null rather than zero — a free-looking turn would wave an unknown model past
  the cap.
- **`DEFAULT_MODELS` is gone.** `models.list` feeds a picker, and the default is a preference
  list validated against the catalogue.
- Cached in-process, refreshed daily, pruned to providers with an installed SDK and models
  that can call a tool — 317 of them, down from thousands.
- **Never a dependency.** Unreachable models.dev falls back to a bundled floor, and the route
  reports which was used.

### "Cheapest" was the wrong default, and the live data proved it

The first cut picked the cheapest tool-capable model. Against real models.dev that is
`dots-studio/dots-3-note-preview:free` at $0/MTok. Defaulting someone's workspace to a free
preview would produce terrible pages, and the product *is* that the agent designs the page.
A default model is a product decision, not an arithmetic one — so the catalogue decides what
exists and what it costs, and an ordered preference list decides what is good enough to hand
to someone who did not choose.

## Still owed
- **The BYOK UI still assumes Anthropic.** `models.list` exists and returns 317 models; no
  screen offers them yet.
- **No live turn through either port.** Still unbilled and unproven.

## Known cost, stated up front

The Claude Agent SDK gives Washi things the AI SDK does not: session resumption via
`sdkSessionId`, and built-in context compaction. Under the AI SDK port, Washi owns the
message history itself — it already persists every turn, so the data is there, but
compaction becomes its own problem rather than a freebie. **Both ports stay.** That is what
§05 always said.

---

# Phase 4 — the agent, server-side and on a leash — COMPLETE (2026-09-20)

117 tests green, `turbo check-types` 13/13, `biome check` green, `mirin check` 10/10.

The host already runs in the server; what does not is its key or its limits.
Two gaps found by reading rather than assuming:

- **Nothing passes an API key to the SDK.** It relies entirely on ambient
  `ANTHROPIC_API_KEY`, so a hosted workspace's stored BYOK key is decrypted by nobody.
- **`MAX_BUDGET_USD` is a per-`query()` constant.** `cost_usd` is written and never read
  back, so a loop can spend it once per turn, forever. Spec §05 flagged this; hosted mode
  with someone else's key turns it into an incident.

Acceptance:

- `bun test` green, `bun run typecheck` green, `bun run check` green, `mirin check` green
- a hosted turn uses the workspace's own key, and a workspace with no key says so
- the subprocess env is built, not inherited — `WASHI_SECRET_KEY` must not reach the agent
- spend accumulates across turns, and the breaker stops the next one

## Steps

- [x] **1 · key resolution** — `AgentHost` takes a resolver. Hosted decrypts the org's key;
      embedded uses the machine's own env. A workspace with neither fails loudly, not silently.
- [x] **2 · a built subprocess env** — `env` on `query()` REPLACES the environment rather than
      merging. Inheriting `process.env` would hand a multi-tenant agent the master key and the
      Postgres url, so the env is constructed from an allowlist.
- [x] **3 · spend + circuit breaker** — per-workspace daily accumulation in the workspace db
      (works in both modes, and it is activity rather than identity so C1 holds). A cap with a
      Resume button. Not a quota: OSS, no pricing, ever.
- [x] **4 · surface it** — `agents.spend` / `agents.resume`, so a client can show the state
      instead of a turn silently doing nothing.

## Caught while building

**Resume did nothing.** Clearing the pause flag left the cap comparison tripping on the same
spend, so the button cleared a flag and the next check set it again. The cap is measured from
the last acknowledgement now: Resume grants exactly one more cap of headroom, not amnesty for
the day. The first version of the test passed while the bug was live — it asserted
`paused === false` instead of asserting the breaker was open.

## Not verified

The live SDK loop still is not exercised — it bills real usage and needs a key. What is tested
is everything around it: the env allowlist, the breaker arithmetic, key resolution. A real turn
through a hosted workspace's own key has not been run.

## Out of phase 4 (deliberately)

- **Scheduled runs.** They are the payoff, and they are exactly what should not ship before the
  breaker has been watched working. Next phase, with the breaker as a precondition.
- **Agent panel on the web client** — the desktop one works; the web needs BYOK entry first.

---

# Phase 3 — the web client (MVP) — COMPLETE (2026-09-20)

104 tests green, `turbo check-types` 13/13, `biome check` green, `mirin check --scenario`
10 steps green, and the flow verified in a real browser: sign up → create workspace →
sheet renders at 1024px and 375px. Goal was: **a URL you can open, sign in to, and read your workspace from.** Spec:
`docs/server.html` §07. Acceptance:

- `bun test` green, `bun run typecheck` green, `bun run check` green
- `mirin check --scenario` still green — the desktop must not regress
- sign up → create a workspace → see its sheets → open one, rendered by `@washi/paper`
- the shell works at 375px and at 1440px

## Steps

- [x] **1 · retire spec §10** — the canvas sweep shipped; §10 still says "not one responsive
      class in @washi/paper", which is false and cost real time this week. Banner it like §07.
- [x] **2 · touch targets** — `size-4` checkboxes and friends are under the 44px floor.
      The last §10 item that is actually still open.
- [x] **3 · `apps/web`** — Vite + TanStack Router/Query + React 19, sharing `@washi/paper`
      verbatim. Better Auth client → sign in/up → workspace picker → sheet list → sheet view.
      Responsive shell: the desktop chrome (248px sidebar, 334px panel) is not shared.
- [x] **4 · onboarding, rewritten** — the old flow promises "No account required" and "Washi
      never talks to a cloud we run". On the web that flow *is* sign-up → workspace → invite.

## Measured, not guessed

Web bundle is **258 KB gzipped**, dominated by `@tailwindcss/browser`. That is the real
number behind the §10 "precompile sheet CSS" item — it can now be decided rather than
argued about.

## Still open after the MVP

- **No router.** Three screens with nothing to link to, so TanStack Router is not in yet —
  a deviation from the house stack, taken deliberately. It has to land before sheet
  permalinks, which is the point of having a web client at all.
- **`vault` survives as an identifier** in the desktop (`draft.vault`, `VAULT_TOPIC_ORDER`,
  a placeholder). Renaming touches a persisted localStorage shape, so it is its own change.
- **Desktop onboarding**: the storage claims were corrected (it was never "markdown files in
  a folder"), and the E2EE promise removed per Q26. "No account required" stays, because in
  embedded mode it is true.

## Out of the MVP (deliberately, say it rather than fake it)

- **Agent panel on web** — needs BYOK wired to a server-side agent, which is phase 4.
- **Inbox · Dashboard · Daily note** — still static design copy even on desktop; putting them
  on the web would be inventing history, which features.md §2 forbids.
- **Precompiled sheet CSS** — `@tailwindcss/browser` ships a compiler to the client. Works,
  costs startup. A §10 item, deferred with a measurement rather than a guess.

---

# Phase 2 — auth + control plane — COMPLETE (2026-09-17)

104 tests green, `turbo check-types` green, `biome check` green, `mirin check --scenario`
10 steps green. Spec: `docs/server.html` §03 · §04 · §07. Acceptance was:

- `bun test` green, `bun run typecheck` green, `bun run check` green
- **`mirin check --scenario` still green** — the desktop must not notice that hosted mode grew auth
- hosted mode boots only with its secrets, and refuses every unauthenticated call
- a workspace is an organization: a member can open it, a non-member gets NOT_FOUND
- the BYOK key round-trips through encryption and is never readable back to a client

## Steps

- [x] **1 · `packages/server/control`** — Postgres via `drizzle-orm/bun-sql` (Bun 1.4 has
      `Bun.SQL`, so no `pg`). Better Auth core tables + organization plugin + invitations.
      **Zero workspace content — C1.**
- [x] **2 · crypto** — AES-256-GCM, per-org key derived from `WASHI_SECRET_KEY` via HKDF.
      Write-only: clients see `last4`, never the key.
- [x] **3 · `ControlPlane` interface** — declared in `trpc` (the consumer), implemented twice.
      Hosted = Postgres + Better Auth. Embedded = a stub: one actor, one workspace, no auth.
      **This pair is what makes phase 7 cheap (C2).**
- [x] **4 · wire `apps/server`** — mount `/api/auth/*`, authenticate → `actorId`,
      authorize in `workspaceProcedure`. Drop `WASHI_ALLOW_UNAUTHENTICATED`: hosted now
      has real auth, so the escape hatch retires.
- [x] **5 · deployment** — `docker-compose.yml` + `.env.example`. This is an OSS self-hosted
      product; the compose file is the install story, not an afterthought.

## Landed beyond the plan

- **`.env` was not gitignored.** The README tells people to put a master key in one.
  `.env` / `.env.*` ignored, `.env.example` excepted.
- **`@washi/control/embedded` subpath.** The barrel re-exports the hosted plane, so importing
  the *stub* dragged Better Auth and a Postgres driver into the desktop main process. The
  desktop should ship neither.
- **Hosted mode verified against real Postgres** (2026-09-17). sign-up → session → create
  organization → `workspaces.list` → member reads `sheets.list` → non-member gets NOT_FOUND →
  BYOK stored and read back as `last4` only. `SELECT` on `organization_secret` confirms no
  plaintext key anywhere in the control plane.
- **`invitation.createdAt`** — Better Auth's organization plugin wants it; only a real boot
  said so. Added to the schema and as an `ADD COLUMN IF NOT EXISTS` in the DDL.
- **Root `dev:server` script.** Bun auto-loads `.env` from the cwd, so `--cwd apps/server`
  silently started *embedded* mode. Running from the repo root is also what the Dockerfile does.

## Deferred out of phase 2 (deliberately)

`apps/web` + new onboarding (phase 3) · agent server-side + circuit breaker (phase 4) ·
P2 transactions (phase 5) · canvas sweep (phase 6) · embedded mode proper (phase 7).

---

# Phase 1 — server + transport — COMPLETE (2026-09-17)

81 tests green, `turbo check-types` green, `biome check` green, `mirin check --scenario`
10 steps green. Spec: `docs/server.html` §07. Acceptance was:

- `bun test` green, `bun run typecheck` green, `bun run check` green
- `apps/server` boots in both modes; `embedded` serves the desktop app end to end
- no `getDb()` module singleton anywhere — every repository op takes a resolved workspace
- `mirin check --scenario` still passes against the new transport

## Steps

- [x] **1 · restructure** — `packages/desktop/*` → `packages/server/*`; `api` → `trpc`;
      `@washi/desktop-{domain,repository,service}` → `@washi/{domain,repository,service}`
- [x] **2 · workspace handle (C1 · C3 · kills P7)** — `initializeDb()` singleton →
      `openWorkspace(path): Workspace`; every op takes it as first arg; registry opens by id.
      `window_state` leaves the workspace db — a server has no windows.
- [x] **3 · tRPC layer** — `init.ts` (createContext + procedure builders), routers in
      conventions §3 shape (`routers/{entity}/{queries,mutations,subscriptions}.ts` + mergeRouters).
      Events become `tracked()` subscriptions.
- [x] **4 · apps/server** — Bun binary, `Bun.serve` with `/trpc` (http+ws) + `/health`.
      `mode: 'hosted' | 'embedded'` asserted once at boot (C2); hosted branch runs, unauthenticated,
      **local only — no public URL until phase 2 puts Better Auth in front of it.**
- [x] **5 · desktop as thin client (C4)** — `lib/rpc.ts` swaps `mirinjs/client` for a tRPC client
      over `127.0.0.1:port`. mirin keeps window, menu, icon, sidecar spawn.
- [x] **6 · `actor_id` on `capability_calls`** — "who approved this" is the team audit story;
      brutal to retrofit against a populated ledger.

## Landed beyond the plan

- **CORS + a per-boot token.** Two origins is a consequence of the pivot, not an oversight.
  Permissive CORS on a loopback server holding notes means any page you visit can read them,
  so the token from C2 had to land in the same change. Header on calls, `connectionParams`
  on subscriptions — EventSource cannot set headers.
- **`bun run check` unbroken.** It had been dead, not green: a stale worktree's biome.jsonc
  made biome bail on config before checking anything.

## Deferred out of phase 1 (deliberately)

Better Auth + Postgres control plane (phase 2) · `apps/web` + new onboarding (phase 3) ·
agent server-side + circuit breaker (phase 4) · P2 transactions (phase 5) · canvas sweep (phase 6).

---

# M2 — COMPLETE (2026-08-12)

42 unit tests green, typecheck green, biome green, `mirin check --scenario` 7 steps green.
M0 scaffold · M1 sheets core · M2 embedded Claude — all shipped. Full record in git history;
the milestone plan itself is superseded by `docs/server.html` §07.

## Design scope still open

Carried forward — none of it is blocked by the server pivot, but onboarding and the
dashboard are rewritten in phase 3 rather than patched.

- [ ] **Dashboard view** — greeting, stat cards, review queue, recent pages, activity timeline
- [ ] **Inbox** — wire rows to the real capability ledger; dismissals currently reset on reload
- [ ] **Settings view** — 4 tabs incl. agent autonomy segmented control + scheduled runs
- [ ] **Daily note** — real per-day sheet, not static design copy
- [ ] **Model picker + context meter** in composer (SDK setModel / usage_update plumbing)
- [ ] **In-note agent affordances** — authorship captions, inline accept/reject on suggested edits
- [ ] **Dark mode toggle** (tokens shipped), theme segmented control
- [ ] **Cover images / attachments** — still owed an asset story; `Img` is https-only
- [ ] Sidebar folders, Share, toast faces + thinking bar + dropzone

## Known gaps (post-M2)

- Live SDK loop not covered by automated tests (would bill + need auth); unit tests cover
  normalization/gating/actions/persistence, `check` covers UI.
- Fetch component + tsuru allowlist UI unproven end-to-end; no settings surface for the host list.
- No turn cancel: a running turn cannot be interrupted (P6).

## Lessons

- A fix to a concurrency primitive needs a slow-consumer test. Iterating a snapshot of the
  buffer looked equivalent and lost every event emitted while the consumer was mid-write.
- `check:live` caught a bug 175 unit tests did not. Run it after touching the bus or the host.
- It caught a second one later: Clear conversation + a fast send put the prompt in the old
  session while the screen showed the new one. Diagnosed by reading the workspace db (the
  turn had completed, in the other session), not by guessing — the first guess was wrong.

- drizzle `.run()` types as void on bun-sqlite — use raw `getSqlite().query().run()`
  when you need `changes`.
- Renderer typecheck needs `types: ["vite/client", "bun"]` — Router type resolution
  pulls repository sources into the renderer program.
- `mirin check` runs against the persistent dev db — scenarios must be state-robust
  (click the target sheet, don't assume first-boot state).
- babel parser pairs with @babel/types@^7 — v8 types mismatch v7 AST.
- `mirin check` and `mirin dev` can't run simultaneously — CDP port 9222 collides and the
  check dies with "never published an inspector endpoint". Stop dev first.
- zsh does not word-split unquoted `$VAR`. `for f in $FILES` passes the whole newline-joined
  list as one argument; use `... | while IFS= read -r f`.
- Parameter properties (`constructor(private readonly x: T) {}`) are not erasable syntax. The
  renderer's tsconfig sets `erasableSyntaxOnly`, and its program pulls in service sources for
  types — so they fail there even though the file never runs in the renderer.
- `z.unknown()` in an object infers a required key, but tRPC's wire type makes it optional,
  because JSON drops `undefined`. The wire type is the honest one — model it optional.
- A green check can verify nothing. The scenario's last step watched for `rpc.error` events
  that mirin no longer emits after the transport swap; it would have passed forever.
- "never published an inspector endpoint" has two causes and they look identical: a stale
  `mirin dev` holding CDP 9222, *or* the app dying at boot. Check `pgrep -fl mirin` before
  blaming the code — diagnosing from `session.json` alone pointed at the wrong one.
- A package barrel is a bundling decision, not just an export list. One barrel covering both
  a heavy hosted path and a light embedded one pulls the heavy one into every consumer;
  split it at the subpath.
- Bun auto-loads `.env` from the **cwd**. `bun run --cwd apps/server dev` therefore loads
  nothing and falls back to embedded mode without complaining. Run the server from the root.
- Better Auth's CSRF check treats `http://localhost:3000` and `http://127.0.0.1:3000` as
  different origins. Hit the host named in `WASHI_BASE_URL`, or add the other to
  `WASHI_TRUSTED_ORIGINS`.
- OrbStack forwards ports for every container it manages, so 5432/5433 can be taken even with
  no postgres running. `POSTGRES_PORT` in `.env` moves it.

# WSX 0.4 — the closed component format (2026-09-08, merged into main 2026-10-12)

Source: Claude Design project "Washi" → `design_handoff_wsx/` (README + Themes/Primitives/Apps/Spec
`.dc.html`). Reverses Q9 (full Tailwind), Q11 (no expr, ever) and Q15 (zero cosmetics):
**components own appearance; pages own content and meaning.** Four enums are the whole visual API.

## Slice 1 — primitives + styling surface + validation ✅ (2026-09-08)

Acceptance met: `bun test` 100 green · `bun run typecheck` green · `mirin check` 9 steps green
with the reseeded showcase · `docs/wsx.md` regenerated · no Box/Span/hex/utility class in any
seed or scaffold.

- [x] `@washi/wsx/expr` — closed grammar, AST validation, budgeted evaluator (25 tests)
- [x] validator: path + prop + alternatives; `hints`; `within`/`noNest`/`unique`; budget as warning;
      `extractMissing`
- [x] `@washi/paper/registry` — 46 primitives in 7 groups, four enums + `span`/`gap`, ~40-token
      `class` allowlist, `SHEET_ICONS`, `THEMES` (design-exact 8×2×8)
- [x] `@washi/paper/css` — tokens, tone triplets, type roles (Young Serif / Karla), `feel`,
      panel-contract container buckets, all primitives. `@tailwindcss/browser` removed.
- [x] components rewritten; `Repeat` with `$row.column` substitution; `Note`/`Source` numbering;
      `Money` via `Intl`; empty/loading/error states designed once (`Bound`)
- [x] hanko `table.update` (Field writes it)
- [x] app: paper css + Young Serif, `SheetIcon` (icon is a registry name, never emoji), scaffold,
      six 0.4 showcase seeds (old ones retired on seed), agent system prompt, `check.ts`
- [x] docs: `docs/wsx.md`, spec Q9/Q11/Q15 REVISED, CLAUDE.md

## Known gaps after slice 1

- `bun run check` has one pre-existing a11y error in `CommandPalette.tsx:35` (static div with
  onClick) — not from this slice.
- Theme acceptance thresholds: the design's own values sit at accent-on-card 4.02 and border
  1.25 (rules say 4.5 / 1.4). Test holds at 4.0 / 1.2; flag to design.
- Filled tone chips: ink-on-fill only works for success/warning; info/danger need cream. Tone
  token carries `--t-on` per tone (README said per size).
- `stored` state behaves as `local` until persistence lands.
- `Board` renders grouped, no drag (`table.reorder` + rank column pending).
- Sheet `mood` prop from the README omitted — conflicts with "mode is never pinned by a page".
- Chart: bar/line/area/donut only, first text/number column inferred unless `label`/`value`.

## Slice 2 — candidates (own milestones)

- Matrix · Calendar · Timer (tick source, `now()` advancing) · Scene/Beat/Stepper
- Filter/Facet/Search/Sort/Segment scope (`$scope`, stored per reader)
- Board drag → `table.reorder` (fractional rank) · `table.delete` soft 30d · undo log
- stored/records state persistence · derived views · golden tests at 320/400/720/full
- six archetype starter trees · publishing/read mode · `Compare`/`Diff`/`Tree`

## Lessons

- `mirin check` must run with cwd `apps/desktop`; a shifted shell cwd makes it exit 0 with
  "ENOENT chdir" — always check the log, not the exit code.
- zod 4 `issue.input` is undefined on enum failures; read the value from the props by `issue.path`.
- `mirin check` and `mirin dev` can't run simultaneously — CDP 9222 collides.

# Docs, from the ground up (2026-10-21) — one branch `docs/ground-up`, PR when whole

Juan's call: drop the old doc set and rework it: `brand.html` `mascot.html` `prd.html`
`wsx-primitives.html` and a Figma-like canvas of every screen (`design/`, split per area).
`conventions.md` stays. Old docs (washi · spec · server · design · features · wsx.md) retire once
`prd.html` carries their decisions.

- [x] 0 · foundation: `docs/_kit` (doc.css · app.css · mascot.js · canvas.css/js), `docs/index.html`
- [x] 1 · brand.html · 2 · mascot.html · 3 · prd.html · 4 · wsx-primitives.html
- [x] 5 · design/{shell,pages,data,work,agent,account,desktop}.html + design/index.html overview
- [x] 6 · retire old docs, point CLAUDE.md + memory at the new set, PR

# Exa web search (2026-10-21) — branch `feat/exa-search`

Washi can search the web through Exa. Network stays tsuru's; the desk stays the only gate.

- [x] 1 · tsuru `exaSearch` (POST api.exa.ai/search, x-api-key, text contents, size cap) + test
- [x] 2 · control: `organization_integration` (org × integration, sealed like BYOK) · SecretStore
      `integrationInfo`/`setIntegration` · trpc `workspaces.integrationKey` / `setIntegrationKey`
- [x] 3 · runtime `searchKey` option: hosted → stored `exa`, embedded → `EXA_API_KEY`
- [x] 4 · service: `web_search` tool on both ports (`searchKey` dep), `toolKind: search`,
      desk: policy verdict shared by both ports, "always" = api.exa.ai on the allowlist · tests
- [x] 5 · ui `describeTool('web_search')` + studio Settings → Agent "Web search" section
- [x] 6 · docs: prd A2/D55, design account+agent settings frames, CLAUDE.md, .env.example

- [x] 7 · approvals `auto` mode: workspace setting (`agent_approval_mode`), both settings UIs,
      ledgered as `auto`, refusals unchanged · D56

Acceptance: a turn asking "what's new in Loro 1.x" calls `web_search`, the panel asks in words
("Search the web for …"), Allow always puts `api.exa.ai` on the allowlist and the next search
passes; no key → the tool says where to add one.

# Latin only + a better sidebar (2026-10-21) — branch `design/sidebar-latin`

- [x] 1 · no CJK anywhere: docs, kit, app copy, showcases, tests (WASHI wordmark, W agent mark, "done" stamps)
- [x] 2 · design/shell.html "Sidebar · proposed": A Quiet (the call) · B Home first · C Rail + panel · A states, mobbin refs
- [x] 3 · Juan picked D · Ask first (2026-10-21, after Notion and Obsidian reads): every design frame
      now wears it (shell · pages · data · work · agent · account · desktop), D's CSS moved into
      the kit, PRD D57, switcher and user menu redrawn from the footer
- [x] 4 · Sidebar D in the studio (branch `feat/sidebar-d`): ask field (mascot = state + panel,
      text = palette, spend in the tooltip), Home with Inbox · Threads · Routines, Recents (last
      three opened, `washi:recents:<ws>`), Favorites, tree, + New page, Routines, Trash, workspace
      footer with the avatar menu (theme · settings · sign out). Threads opens the panel, whose
      Conversations menu is the history — no new query needed.
- [x] 5 · no tab strip on the web (D58): `TabStrip` left the studio shell, the per-workspace strip
      in localStorage and `savedTabs`/`saveTabs` went with it; the desktop keeps the component.
- [ ] 6 · design review: Juan walks each page (`W` on `bun run docs` — a slideshow, frame → pin →
      pin → verdict, the frame's note split per pin); act on `tasks/design-review.jsonl` page by page
      - [x] shell → #61 (D59: fold, mobile Home, Inbox list; A · B · C deleted)
      - [x] studio code for D59: sidebar fold (⌘\, », edge peek, per-workspace memory) + mobile Home
      - [x] studio code for D59: Inbox as one list (Needs you · days · rows · chips · zero row)
      - [x] pages · data · work walked: one fix (covers) → design #64; data · work all ✓
      - [x] agent walked: five fixes → design #66 (D61 · D62 · D63)
      - [x] code: receipts leave the turn (#67)
      - [x] code: Settings · Agent as three cards, key dialog, model menu, turn cap · pause ·
            who resumes · default effort
      - [x] code: covers — pictures + upload + files store (D60)
      - [x] code: agent panel — attach · model and effort chips · conversations rename, delete,
            auto title · dock right (D61)
      - [ ] account · desktop — waiting on Juan's marks

# Mihon — the WSX sample book (2026-10-21) — branch `feat/mihon`

Storybook was the ask; the registry is zod, so the knobs derive from the spec instead and no
dependency lands. `apps/mihon`: rail (7 groups) · stage (parse + validate + WsxView) · knobs ·
source/scratch · matrix. Host in memory.

- [x] 1 · scaffold: Vite + React + Tailwind over `@washi/ui/css`, `bun run dev:mihon` (3200)
- [x] 2 · `shared/knobs`: zod → KnobDef (enum · boolean · number · text · json), required, styled
- [x] 3 · `shared/specimen`: one default per primitive, `within` wraps, `pageSource` for the views;
      every specimen and matrix validates against `paperRegistry` (test)
- [x] 4 · `shared/host`: `createBookHost` — ink executor over rows (filter · order · limit · group),
      synthetic history, hanko verbs land in memory, toggles, people
- [x] 5 · UI: topbar (theme · mode · feel · accent · width · view), rail with search, knobs with
      reset, source with copy + scratch, diagnostics strip; `#Name` deep links
- [x] 6 · first refine pass (branch `refactor/drop-tape-stamp`): Tape + Stamp dropped (kit = Chip ·
      Mascot · Missing) · Callout: icon on the text line when untitled, variant honoured
      (plain · outline · raised) · line/area chart: headroom so the peak label is not clipped ·
      Roadmap: a single day is a dot, every other tick under 560px · validate: "is required — one
      of …" for a missing enum, no "(root)" · book: pick leaves scratch, invalid JSON knob shows
      red, paper sizes to content
- [ ] 7 · later: Board/Table/Tabs scroll sideways under 400 with no affordance (fade or arrows) ·
      info Callout tint reads grey next to the other tones · Chart with no bind renders
      "Loading…" (only reachable on an invalid page) · React Flow attribution badge on Canvas

Acceptance: pick any primitive, turn every knob, the WSX below is what a page would carry and it
validates; matrix shows variant × tone with no budget error; dark + every theme render.
