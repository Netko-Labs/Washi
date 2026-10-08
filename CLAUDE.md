# Washi

Agent-first knowledge base. Notes are WSX — JSX as a serialization format, rendered by the closed
`@washi/paper` registry. Structure rules: @docs/conventions.md — that file wins for structure, this
one for project facts.

**Washi is a server with clients.** One Bun binary runs in two modes: `embedded` (what the desktop
app boots in-process — loopback, a per-boot token, no accounts, one workspace) and `hosted` (a team
server — Better Auth sessions, organizations, invitations, BYOK). Team collaboration ships first;
local-only mode is deferred to phase 7, not cut.

Specs (visual, canonical):

- `docs/spec.html` (v0.5) — WSX, Paper, ink/tsuru/hanko, the P0–P8 audit. Still current.
- `docs/server.html` (v0.6) — **the server pivot.** Supersedes v0.5 §03 · §04 · §07 · §08 and
  Q12 · Q17 · Q19. Read it for anything about processes, storage topology, identity, or the road.
  Its constraints **C1–C4** are law, not guidance — they are what keep phase 7 a redeployment
  rather than a second implementation.

Progress lives in `tasks/todo.md`. Phases 1–6 are done; the MLP+1 (agent inference on the
plan or the key, first run, receipts, Stop, invites) is the current block.

## Commands

- `bun dev` — run the desktop app (`mirin dev`; root script handles the cwd)
- `bun run dev:server` — run the server standalone. **From the repo root**: Bun reads `.env` from
  the cwd, so `--cwd apps/server` silently starts embedded mode instead.
- `bun run typecheck` — tsgo across all workspaces (turbo)
- `bun run check` — biome check
- `bun test` — unit tests across workspaces
- `bun run --cwd apps/desktop check` — mirin check scenario (e2e; boots the real app).
  **Stop `bun dev` first** — both want CDP port 9222, and the collision reports as
  "never published an inspector endpoint", which looks identical to a crash at boot.
- `bun run --cwd apps/desktop check:live` — the golden path through a **real** turn on this
  machine's Claude Code login (ask → accept at the desk → page opens → plan receipt). Opt-in:
  it spends plan usage, so it is never part of `check`.
- `docker compose up` — hosted mode + Postgres. Needs `.env` (see `.env.example`).

## Topology

- `apps/server` — the Bun binary. `Bun.serve` with `/health`, `/api/auth/*`, `/trpc/*`.
  Mode is asserted once at boot in `assertMode`, never per request.
- `apps/desktop` — mirin shell and a **client of its own server**: window, menu, icon, Develop
  menu, and the embedded server booted in-process. `src/bun/` is the main process.
- `packages/server/{domain,repository,service,trpc}` — one-way layering: domain → repository →
  service → trpc → ui. DB access only in repository; business logic in service; routers in trpc.
- `packages/server/control` — Postgres control plane: Better Auth, organizations, members,
  invitations, encrypted API keys. Import `@washi/control/embedded` for the stub — the root
  barrel pulls in Better Auth and a Postgres driver.
- `packages/shared/wsx` — WSX parse/validate/serialize (isomorphic, no DOM)
- `packages/shared/paper` — note component registry; `./registry` subpath is zod-only (main
  process safe), root export is React (renderer only)
- `packages/shared/ink` — typed table DSL (descriptors; executed in repository)
- `packages/shared/tsuru` — scoped fetch policy + guarded client
- `packages/shared/hanko` — safe action verb registry

## Hard facts

- **Two planes.** Postgres holds identity only — accounts, organizations, members, invitations,
  encrypted keys. Content is one SQLite file per workspace, same code hosted and local. This is
  constraint C1; breaking it kills local mode.
- A workspace **is** a Better Auth organization **is** one SQLite file. `vault` is the old word.
- No module-singleton database. `openWorkspace({ id, path })` returns a `Workspace` and every
  repository op takes one. `repository` and `service` never see a request, a user or a network.
- Workspace db: bun:sqlite + Drizzle as query builder only; hand-written idempotent DDL
  (`ensureColumn` for additive changes). No drizzle-kit migrations — the control plane's DDL is
  hand-written too.
- Sheet source of truth: Loro text doc (snapshot blob in sqlite); `source` column is a cache.
  Loro is a storage format today — delta export and merge arrive with sync at phase 8.
- Ids: `Bun.randomUUIDv7()`. Timestamps: HLC strings from domain.
- **Who pays for a turn.** A credential is `api_key` or `local_cli`. Embedded finds the
  person's installed `claude` (PATH is empty for a GUI app — known install paths too) and runs
  it via the Agent SDK's `pathToClaudeCodeExecutable` with **no** key in the env, so their own
  login pays. `auto` prefers it over `ANTHROPIC_API_KEY`. Hosted runs on the workspace's stored
  key and has no local branch at all — a team server must never bill one person's plan.
- A `plan` turn lands in `saved_usd`, never `cost_usd`: the daily stop counts metered dollars
  only, and every turn counts toward the turn cap. `init.apiKeySource` is `none` (not `oauth`)
  for a claude.ai login — the binary, not the docs, set that rule.
- Agent SSE subscriptions are workspaceProcedures and filter on `workspaceId`: one bus serves
  every workspace. EventSource can't set headers, so the workspace rides `connectionParams`.
- **Routines** run on the server's minute clock (`apps/server/src/lib/clock.ts`), over the
  workspaces `ControlPlane.workspaceIds()` knows that already have a file — never a stray or
  deleted one, never a conjured `default`. A run is an ordinary `host.prompt` in a fresh session:
  daily stop, desk and receipt all apply. One routine in flight per workspace, parked or not —
  the stop is checked at start and charged at end, so concurrency would outrun it. At the stop
  nothing is marked; the day catches up after Resume. Marked run before it runs; a scheduled run's
  questions wait 12h. Times are wall-clock minute + IANA zone. `routines` is the only
  caller-free path into a turn — keep it that way.
- Agent tools are the ONLY capability surface: ink (data), tsuru (network), hanko (actions).
  Never hand agents fs/shell/raw SQL.
- WSX is inert data: registry components, literal props, no expressions. Validation before
  persist and before render.
- tRPC v11. Routers live in `packages/server/trpc/src/routers/{entity}/` per conventions §3.
  Subscriptions are SSE with `tracked()`, so they resume from `lastEventId`. Phase 8's `/sync`
  will be raw binary WS instead — Loro deltas have no business in JSON.
- `WASHI_SECRET_KEY` is the session secret **and** the root of every workspace's BYOK key
  derivation. Rotating it signs everyone out and makes every stored API key unreadable.
- `mirin.config.ts` is pure data. Mirin commands run with `apps/desktop` as cwd.

## Git

Commits: `<emoji> <type>(<scope>?): <subject>` (commitlint enforces). Commit at checkpoints;
push only when asked. Never commit runtime state or secrets — `.env` is gitignored, `.env.example`
is the committed template.
