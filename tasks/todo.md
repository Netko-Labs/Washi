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

## Still owed

- **Cost is null on the AI SDK port.** Usage arrives as tokens and every provider prices
  differently, so the breaker learns nothing from an OpenRouter turn. Until per-model pricing
  is wired, only the turn count bounds those workspaces — the daily dollar cap does not.
- **The BYOK UI still assumes Anthropic.** The route takes a provider and model; no screen
  offers them yet.
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
