# Phase 1 — server + transport

Spec: `docs/server.html` §07. Acceptance for the whole phase:

- `bun test` green, `bun run typecheck` green, `bun run check` green
- `apps/server` boots in both modes; `embedded` serves the desktop app end to end
- no `getDb()` module singleton anywhere — every repository op takes a resolved workspace
- `mirin check --scenario` still passes against the new transport

## Steps

- [x] **1 · restructure** — `packages/desktop/*` → `packages/server/*`; `api` → `trpc`;
      `@washi/desktop-{domain,repository,service}` → `@washi/{domain,repository,service}`
- [ ] **2 · workspace handle (C1 · C3 · kills P7)** — `initializeDb()` singleton →
      `openWorkspace(path): Workspace`; every op takes it as first arg; registry opens by id.
      `window_state` leaves the workspace db — a server has no windows.
- [ ] **3 · tRPC layer** — `init.ts` (createContext + procedure builders), routers in
      conventions §3 shape (`routers/{entity}/{queries,mutations,subscriptions}.ts` + mergeRouters).
      Events become `tracked()` subscriptions.
- [ ] **4 · apps/server** — Bun binary, `Bun.serve` with `/trpc` (http+ws) + `/health`.
      `mode: 'hosted' | 'embedded'` asserted once at boot (C2); hosted branch runs, unauthenticated,
      **local only — no public URL until phase 2 puts Better Auth in front of it.**
- [ ] **5 · desktop as thin client (C4)** — `lib/rpc.ts` swaps `mirinjs/client` for a tRPC client
      over `127.0.0.1:port`. mirin keeps window, menu, icon, sidecar spawn.
- [ ] **6 · `actor_id` on `capability_calls`** — "who approved this" is the team audit story;
      brutal to retrofit against a populated ledger.

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
