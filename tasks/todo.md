# MLP+1 — the agent runs where it is cheapest — IN PROGRESS (2026-10-08)

Overnight, unattended. Design source: "Washi — product design" (12 boards; First run · Today ·
Review · Sprint · Accounts · Research). Scope cut to the agent, because the agent is the product.

- **Web (hosted, self-hosted instance):** the workspace's API key is the inference source. The
  key is asked for in first run, not buried in settings, with the daily stop beside it.
- **Desktop (embedded):** the installed `claude` CLI is the inference source. The person's own
  Claude login pays for turns their plan already covers; the API key path stays as fallback.
- **+1:** every turn ends in a receipt — where it ran, how long, what it cost or what the plan
  saved — and the agent's state is visible without opening settings.

Acceptance:

- `bun test`, `bun run typecheck`, `bun run check` green; `mirin check` green
- embedded with no `ANTHROPIC_API_KEY` but a logged-in `claude` → a real turn completes
- a plan-covered turn never counts toward the dollar cap; it still counts as a turn
- hosted never runs a local CLI, whatever the machine has installed
- the web asks for a key in first run, and the daily stop is settable there

## Steps

- [x] **1 · `ClaudeSdkPort` for real** — phase 5 ticked it, but the SDK loop still lives inline
      in `host.ts` (524 lines). Extract it behind `AgentPort`; host shrinks to orchestration.
- [x] **2 · local CLI discovery** — find `claude` (PATH is empty for a GUI app, so known install
      paths too), read `--version` and `auth status`. Never store the account email.
- [x] **3 · credential kinds** — `api_key` | `local_cli`. Embedded: preference `auto` picks the CLI
      when logged in, else `ANTHROPIC_API_KEY`. Hosted: api_key only, asserted at construction.
- [x] **4 · plan vs metered spend** — `init.apiKeySource === 'oauth'` means the plan paid;
      record it as `saved_usd`, not `cost_usd`. Turn cap still applies.
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
- `host.ts` is 249 lines: the daily stop moved to `budget.ts`.

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
