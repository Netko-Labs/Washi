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
