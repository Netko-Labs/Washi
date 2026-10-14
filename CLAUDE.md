# Washi

Agent-first knowledge base. Notes are WSX — JSX as a serialization format, rendered by the closed
`@washi/paper` registry. Structure rules: @docs/conventions.md — that file wins for structure, this
one for project facts.

**Washi is one runtime, two hosts.** `@washi/runtime` builds it in two modes: `embedded` (what the
desktop's main process boots — no accounts, one workspace, no port) and `hosted` (the studio, a team
server — Better Auth sessions, organizations, invitations, BYOK). Both serve the **same `appRouter`**:
the studio over HTTP + `/trpc-ws`, the desktop over mirin IPC. Team collaboration ships first;
local-only mode is deferred to phase 7, not cut.

Specs (visual, canonical):

- `docs/spec.html` (v0.5) — WSX, Paper, ink/tsuru/hanko, the P0–P8 audit. Still current.
- `docs/server.html` (v0.6) — **the server pivot.** Supersedes v0.5 §03 · §04 · §07 · §08 and
  Q12 · Q17 · Q19. Read it for anything about processes, storage topology, identity, or the road.
  Its constraints **C1–C4** are law, not guidance — they are what keep phase 7 a redeployment
  rather than a second implementation.

Progress lives in `tasks/todo.md`. Phases 1–6 and the MLP+1 are done; the studio architecture
(template-based web, desktop over mirin IPC) is the current block.

## Commands

- `bun dev` — run the desktop app (`mirin dev`; root script handles the cwd)
- `bun run dev:studio` — the studio (`bun --bun vite dev`, port from `PORT`). Hosted needs the
  `WASHI_*` env and Postgres (`docker compose up postgres`). Vite must run under Bun (`--bun`):
  Node can't load `bun:` modules, and the error looks like a 500 on every route.
- `bun run --cwd apps/studio build` — `.output/`, what Railpack ships; `bun --no-install
  apps/studio/.output/server/index.mjs` runs it.
- `bun run typecheck` — tsgo across all workspaces (turbo)
- `bun run check` — biome check
- `bun test` — unit tests across workspaces
- `bun run --cwd apps/desktop check` — mirin check scenario (e2e; boots the real app).
  **Stop `bun dev` first** — both want CDP port 9222, and the collision reports as
  "never published an inspector endpoint", which looks identical to a crash at boot.
- `bun run --cwd apps/desktop check:live` — the golden path through a **real** turn on this
  machine's Claude Code login (ask → accept at the desk → page opens → plan receipt). Opt-in:
  it spends plan usage, so it is never part of `check`.
- `docker compose up` — the studio + Postgres (self-hosting). Needs `.env` (see `.env.example`).
  Coolify builds the same app with Railpack: `RAILPACK_CONFIG_FILE=apps/studio/railpack.json`.

## Topology

- `apps/studio` — TanStack Start on Nitro (bun preset), from `Netko-Labs/tanstack-solo-server-
  monorepo-template`: SSR, `/api/auth/*`, `/api/trpc/*`, `/trpc-ws`, `/api/health`. A Nitro plugin
  boots the runtime at start (so the routine clock ticks unvisited) and drains sockets on SIGTERM.
  Pages are routes: `/sign-in?redirect=`, `/workspaces?invite=`, `/w/$workspaceId` (dashboard),
  `/p/$pageId`, `/inbox`, `/settings?tab=`. The workspace loader resets the shared stores (child
  effects run before the layout's); routes mark their tab open, a tab chosen anywhere pushes its
  URL (`useTabNavigation`), and the strip is saved per workspace in localStorage.
- `apps/desktop` — mirin shell: window, menu, icon, Develop menu. `src/bun/` (main) boots the
  embedded runtime and serves `appRouter` via `createMirinBridge`; the renderer's `api` is a tRPC
  client over `mirinLink`. No port, no token.
- `packages/washi/ui` — the UI both hosts wear: tokens + fonts + mascot keyframes
  (`@washi/ui/css`, which `@source`s itself), the mascot, stores (view/sheets/agent), agent panel,
  palette, inbox, dashboard, tabs, header, sheet view, markdown. Each app calls
  `bindHost({ client, place })` once at boot; the shared code only ever sees `api`. App-only
  chrome (desktop onboarding/sidebar, studio sidebar/settings/auth) stays in the app.
- `packages/washi/runtime` — `bootRuntime(env)` / `startRuntime(options)`: mode assertion, control
  plane, workspace registry, one AgentHost per workspace, the routine clock. Mode is asserted once
  at boot, never per request.
- `packages/washi/{domain,repository,service,trpc}` — one-way layering: domain → repository →
  service → trpc → ui. DB access only in repository; business logic in service; routers in trpc.
- `packages/washi/control` — Postgres control plane: Better Auth, organizations, members,
  invitations, encrypted API keys. Import `@washi/control/embedded` for the stub — the root
  barrel pulls in Better Auth and a Postgres driver.
- `packages/shared/wsx` — WSX parse/validate/serialize (isomorphic, no DOM)
- `packages/shared/paper` — note primitive registry; `./registry` subpath is zod-only (main
  process safe), root export is React (renderer only), `./css` is the styling surface
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
- A keyed turn's Claude session lives in `<dataDir>/<workspace>.claude/` (`CLAUDE_CONFIG_DIR`), beside
  the `.db` holding its `sdkSessionId` — on the volume, so a redeploy can't orphan it. A resume
  the CLI no longer knows retries once, fresh. A local CLI keeps its own config dir.
- A `plan` turn lands in `saved_usd`, never `cost_usd`: the daily stop counts metered dollars
  only, and every turn counts toward the turn cap. `init.apiKeySource` is `none` (not `oauth`)
  for a claude.ai login — the binary, not the docs, set that rule.
- Agent subscriptions are workspaceProcedures and filter on `workspaceId`: one bus serves every
  workspace. HTTP names the workspace in `x-washi-workspace`; a socket in `connectionParams`
  (`contextFromRequest` is the one place both are read). Switching workspace closes the socket.
- **Routines** run on the server's minute clock (`packages/washi/runtime/src/clock.ts`), over the
  workspaces `ControlPlane.workspaceIds()` knows that already have a file — never a stray or
  deleted one, never a conjured `default`. A run is an ordinary `host.prompt` in a fresh session:
  daily stop, desk and receipt all apply. One routine in flight per workspace, parked or not —
  the stop is checked at start and charged at end, so concurrency would outrun it. At the stop
  nothing is marked; the day catches up after Resume. Marked run before it runs; a scheduled run's
  questions wait 12h. Times are wall-clock minute + IANA zone. `routines` is the only
  caller-free path into a turn — keep it that way.
- **Approvals.** Reads pass; writes stop at the `ApprovalDesk`. Auto-approve (a workspace
  setting, `agent_auto_approve_changes` in `app_meta`) waves through `CHANGE_TOOLS` only — page
  and table writes. `fetch_url` and `action_run` always ask: nothing leaves without a person.
  The UI says every tool in words (`describeTool` in `@washi/ui`) — never a tool name or JSON.
- Agent tools are the ONLY capability surface: ink (data), tsuru (network), hanko (actions).
  Never hand agents fs/shell/raw SQL.
- WSX is inert data: registry primitives, literal props, the closed `expr` grammar only. Components
  own appearance (four enums: `variant tone size emphasis`); pages own content. Validation before
  persist and before render. Format reference: `docs/wsx.md`.
- tRPC v11. Routers live in `packages/washi/trpc/src/routers/{entity}/` per conventions §3.
  Web subscriptions ride `/trpc-ws` (the template's crossws bridge, cookie on the upgrade); the
  desktop's ride mirin events. Both yield `tracked()` and arrive as `{ id, data }`. Phase 8's
  `/sync` will be raw binary WS — Loro deltas have no business in JSON.
- Shared stores are SSR-safe: nothing touches `localStorage`/`navigator` at module scope (the
  studio imports them on the server). Host-specific persistence lives in the app — the desktop's
  `profile-store` writes identity/onboarding; the studio takes identity from the session.
- **Client code imports `@washi/trpc/client`, never the barrel.** The barrel carries the router,
  and with it the service layer and the Agent SDK — into the browser bundle.
- `loro-crdt` and the Agent SDK read their own files at runtime (.wasm, the native `claude`
  binary): they stay external in Vite's SSR build and Nitro traces them into `.output`
  (`RUNTIME_FILE_DEPS` in `apps/studio/vite.config.ts`). Inline them and SSR dies on ENOENT.
- One React repo-wide (root `overrides`). Bun's isolated linker will otherwise give workspace
  packages a second copy — an invalid hook call.
- `WASHI_SECRET_KEY` is the session secret **and** the root of every workspace's BYOK key
  derivation. Rotating it signs everyone out and makes every stored API key unreadable.
- `mirin.config.ts` is pure data. Mirin commands run with `apps/desktop` as cwd.
- **Brand lives in `Netko-Labs/brand-assets` (`washi/`)**: icon masters, the Icon Composer
  bundle, the kit. `apps/desktop/icon.iconset`, `icon.icon` and the favicons in
  `apps/studio/public/` are synced output — never edit them here; change the source there,
  `bun run washi && bun run washi:sync ../Washi`, commit both repos.

## Git

Commits: `<emoji> <type>(<scope>?): <subject>` (commitlint enforces). Commit at checkpoints;
push only when asked. Never commit runtime state or secrets — `.env` is gitignored, `.env.example`
is the committed template.
