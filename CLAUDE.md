# Washi

Agent-first knowledge base. Notes are WSX — JSX as a serialization format, rendered by the closed
`@washi/paper` registry. Structure rules: @docs/conventions.md — that file wins for structure, this
one for project facts.

**Washi is one runtime, two hosts.** `@washi/runtime` builds it in two modes: `embedded` (what the
desktop's main process boots — no accounts, one workspace, no port) and `hosted` (the studio, a team
server — Better Auth sessions, organizations, invitations, BYOK). Both serve the **same `appRouter`**:
the studio over HTTP + `/trpc-ws`, the desktop over mirin IPC. Team collaboration ships first;
local-only mode is deferred to phase 7, not cut.

Specs (visual, canonical — `docs/index.html` is the hub; all of them wear `docs/_kit`):

- `docs/prd.html` — **what Washi is and what must be true.** Nouns, golden flows, the rules
  that cannot bend (**C1–C4** are law, not guidance — they keep phase 7 a redeployment, not a
  second implementation), architecture, status, the decisions log. Design every flow against it.
- `docs/wsx-primitives.html` — the page format and the closed registry, primitive by primitive.
- `docs/brand.html` · `docs/mascot.html` — identity and washi-chan (faces, motions, agent states).
- `docs/design/` — every screen as a frame on a Figma-like canvas, one page per area
  (shell · pages · data · work · agent · account · desktop). Real code is the truth; a frame
  named `· proposed` is a change. When the canvas and the PRD disagree, the PRD wins.

Progress lives in `tasks/todo.md`. Phases 1–6 and the MLP+1 are done; the studio architecture
(template-based web, desktop over mirin IPC) is the current block.

## Commands

- `bun dev` — run the desktop app (`mirin dev`; root script handles the cwd)
- `bun run dev:studio` — the studio (`bun --bun vite dev`, port from `PORT`). Hosted needs the
  `WASHI_*` env and Postgres (`docker compose up postgres`). Vite must run under Bun (`--bun`):
  Node can't load `bun:` modules, and the error looks like a 500 on every route.
- `bun run --cwd apps/studio build` — `.output/`, what Railpack ships; `bun --no-install
  apps/studio/.output/server/index.mjs` runs it.
- `bun run dev:mihon` — the sample book (`apps/mihon`, port 3200): every paper primitive, knobs
  read off its zod spec, a variant × tone matrix, a scratch editor, all over an in-memory host.
  No Postgres, no login. Open it to refine a primitive; the real check is the sheet it writes.
- `bun run typecheck` — tsgo across all workspaces (turbo)
- `bun run check` — biome check
- `bun test` — unit tests across workspaces
- `bun run --cwd apps/desktop check` — mirin check scenario (e2e; boots the real app).
  **Stop `bun dev` first** — both want CDP port 9222, and the collision reports as
  "never published an inspector endpoint", which looks identical to a crash at boot.
- `bun run --cwd apps/desktop check:live` — the golden path through a **real** turn on this
  machine's Claude Code login (ask → page lands → plan receipt). Opt-in:
  it spends plan usage, so it is never part of `check`.
- `docker compose up` — the studio + Postgres (self-hosting). Needs `.env` (see `.env.example`).
  Coolify builds the same app with Railpack: `RAILPACK_CONFIG_FILE=apps/studio/railpack.json`.

## Topology

- `apps/studio` — TanStack Start on Nitro (bun preset), from `Netko-Labs/tanstack-solo-server-
  monorepo-template`: SSR, `/api/auth/*`, `/api/trpc/*`, `/trpc-ws`, `/api/health`. A Nitro plugin
  boots the runtime at start (so the routine clock ticks unvisited) and drains sockets on SIGTERM.
  Pages are routes: `/sign-in?redirect=`, `/workspaces?invite=`, `/w/$workspaceId` (dashboard),
  `/p/$pageId`, `/inbox`, `/settings?tab=`, `/trash`. The workspace loader resets the shared stores (child
  effects run before the layout's); routes mark their view active, and a page chosen anywhere
  pushes its URL (`useTabNavigation`). **No tab strip on the web (D58)** — the URL is the whole
  state; `TabStrip` is the desktop's. The sidebar is **Sidebar D (D57)**: the ask field (the
  mascot is Washi's state and opens the panel, the text opens the palette), Home with Inbox ·
  Threads · Routines as icons, Recents (last three pages opened, per workspace in localStorage),
  Favorites, the page tree (native drag and drop; `placementFor` in `@washi/ui` decides where a
  drop lands and refuses a page into its own subtree), Routines, Trash, and the workspace footer:
  the name switches workspaces in place (the shell is keyed by workspace id and the route has
  `gcTime: 0`, so every switch reruns the loader and the route effects), the avatar holds theme ·
  settings · sign out. The sidebar **folds** (D59): `⌘\`, a » in the header while folded, the
  left edge peeks it as an overlay, remembered per workspace (`washi:fold:<id>`). Under `md` there
  is no drawer: `NarrowShell` makes the sidebar the Home screen (places as top tabs, Recents as
  cards, 48px rows) and the ask field a bottom bar whose ✎ is New page on Home and Edit on a page;
  a page opens with ‹ back. `useIsNarrow` picks the shell; the workspace routes never SSR.
- `apps/desktop` — mirin shell: window, menu, icon, Develop menu. `src/bun/` (main) boots the
  embedded runtime and serves `appRouter` via `createMirinBridge`; the renderer's `api` is a tRPC
  client over `mirinLink`. No port, no token.
- `apps/mihon` — the WSX sample book: a Vite SPA over `@washi/paper` with a `PaperHost` in memory
  (`tasks` seeded, verbs land, binds refetch). Knobs come from `paperRegistry` (`knobsFor`), one
  specimen per primitive (`SPECIMENS`, tested to validate), and the stage runs the server's gates
  client-side. Not a host of the runtime; never shipped.
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
  **Writes merge.** `sheets.get` hands out `version` (encoded frontiers); a write that sends it back
  as `baseVersion` is replayed on a fork at that version and merged into the present
  (`mergeSheetSource`), then re-validated — a merge that breaks WSX is `SheetConflictError`. The
  editor and Washi's `sheet_replace` both send it; without it a write still replaces.
- **Live.** Every mutation under `sheets.*`, `tables.*` or `capabilities.*` emits
  `workspaceChanged`, and so does each finished Washi write (`runtime/agent-watch.ts`). Clients
  hold one `live.onChange` subscription (`useLiveStore`): pages refetch the list, data refetches
  through `PaperHost.onDataChange`. An open editor takes a remote change in only while it has
  nothing unsaved (`absorb`, ids kept per row); otherwise its next save merges. Presence is a
  15s heartbeat (`live.here`) in the runtime's memory, never a record; Washi appears on a page
  for 20s after each rewrite of it.
- Pages nest Notion-style: `parent_id` + `position`, a fractional key (`positionBetween` in
  domain), so a move rewrites one row. Delete trashes the subtree under one `deleted_at` stamp;
  that stamp is the batch Restore and Purge act on. A restored page whose parent is gone comes
  back at the top level. The service refuses a move into a page's own subtree (`SheetMoveError`
  → 400).
- Page chrome (icon, `cover`, `full_width`, rename) is metadata — `sheets.updateMeta` never
  touches the Loro doc, and width alone is not an edit. The studio draws it **above** the sheet
  through `SheetView`'s `chrome` slot, outside the paper, so Q18 holds: everything on the sheet
  is still authored by the sheet. A cover is a **key**, never a URL (D60): `preset:sage` (a
  gradient), `picture:fjord` (one of the twelve photographs in `apps/studio/public/covers/`,
  attribution beside them) or `file:<id>` (an upload). An icon is a registry name or an emoji.
- **Files.** Uploads live in the workspace's files store: a row in the workspace's `files`
  table and the bytes beside the `.db` (`<dataDir>/<workspace>.files/`) or, with
  `WASHI_FILES_S3_*` set, in a bucket under a per-workspace prefix through Bun's own S3 client.
  `POST /api/files` (multipart, JPG · PNG · WebP, 5 MB) and `GET /api/files/<id>` are studio
  routes gated like a workspace procedure (`src/server/files.ts`); `files.remove` is tRPC. A
  purge frees the uploads its pages' covers pointed at. The desktop renders no covers yet.
- Typing into a page (studio `page-editor`) edits the sheet's **top level** as blocks: plain-text
  Title/Text/List/Item/Quote/Callout/Code/Divider become typed blocks; anything else (or text with
  inline marks) stays a locked block, kept byte-for-byte. `/` also drops live blocks in as locked
  blocks: a new database (`/database Name` defines the table), a linked view of any table
  (`<Database>`), or a 30-day progress chart over a status's done group. Saves go through `sheets.update` — the
  same validation as the agent's. `serialize` writes text with `<{}>&`, runs of spaces or
  newlines as a string literal, so typed text always round-trips.
- **Source mode** (the `</>` toggle while editing, or *Edit source* in the page menu) edits the
  sheet's raw WSX in CodeMirror. It runs the server's own check client-side (parse + validate
  against `paperRegistry`), autosaves only a valid draft through `sheets.update` with
  `baseVersion`, and holds Done while the draft has errors. There are no hooks to edit: `state`,
  `expr`, `bind` and `action` are a page's whole behaviour, and nothing in it executes.
- **Tables are Notion databases.** Properties: `status` (todo · doing · done groups), `select`,
  `multi_select`, `person` (member id), `date` (`start/end` for a range), `url`, `relation` (record
  ids). Every row can open as a page (`sheets.row_id`, unique; out of the tree). Every write to a
  row also appends what it became to `record_changes` — the history a `Chart history` replays day
  by day. Never update `records` without going through `insertRecord`/`updateRecords`/
  `deleteRecords`, or history silently forgets.
- **Team space.** `tables.seedTeamSpace` makes `projects` + `issues`, the Backlog, Roadmap, Wiki
  (+ How we work), Ideas canvas and Weekly review pages, and a 17:00 routine (the asker's zone) that
  rewrites only the review's "This week" callout. It refuses a workspace that already has either
  table. Members come from `ControlPlane.listMembers` — `workspaces.members` for the UI,
  `people_list` for Washi (a person cell holds the member id).
- **A canvas edits its own markup.** `<Canvas>` holds `<Node>`/`<Edge>`; React Flow draws it, and a
  hand edit calls `PaperHost.replaceNode(from, to)`: in view mode `SheetView`'s host swaps the
  element and saves through `sheets.update`; in the page editor `LockedBlock` routes it into the
  editor store instead, so autosave never writes a stale canvas over a fresh one.
- Comments live in the workspace file (`comments`, `mention_inbox`), so they travel with it (C1).
  The author is the session's actor — never the request body; embedded mode signs as `You`. A
  mention is an unread Inbox row for that person; a trashed page hides its mentions, a purge
  deletes its discussion. The studio polls the unread count every 30s (no socket yet). The Inbox
  (`@washi/ui`) is one list grouped by day (D59): Washi's questions pinned as rows with inline
  answers, its turns from `agents.today`, and whatever rows the host adds — the studio passes its
  mentions through `useMentionRows`; the desktop passes none. Mark all read is the studio header's.
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
  daily stop and desk apply, the receipt is recorded. One routine in flight per workspace, parked or not —
  the stop is checked at start and charged at end, so concurrency would outrun it. At the stop
  nothing is marked; the day catches up after Resume. Marked run before it runs; a scheduled run's
  questions wait 12h. Times are wall-clock minute + IANA zone. `routines` is the only
  caller-free path into a turn — keep it that way.
- **Approvals.** Reads pass; page and table writes (`CHANGE_TOOLS`) land without asking, marked
  `edited_by = 'washi'`. Each Washi write pushes the page's prior state onto `sheet_revisions` —
  its undo stack, cleared the moment a person changes the page, so Undo never erases their words.
  `fetch_url`, `web_search` and `action_run` always stop at the `ApprovalDesk`: nothing leaves
  without a person. "Always" on a fetch or a search lists its host on the workspace allowlist
  (tsuru), so a search allowed always is `api.exa.ai` on that list. A workspace may set
  approvals to `auto` (`agents.setApprovalMode`, Settings → Agent on both hosts): a standing yes
  for what leaves, each call ledgered as `auto`; policy refusals still refuse. Owner or admin
  only (`ownerProcedure`), as is setting an integration key.
  The UI says every tool in words (`describeTool` in `@washi/ui`) — never a tool name or JSON.
- Agent tools are the ONLY capability surface: ink (data), tsuru (network), hanko (actions).
  Never hand agents fs/shell/raw SQL. `web_search` is tsuru's `exaSearch`: hosted runs on the
  workspace's Exa key (`organization_integration`, sealed like BYOK, `Settings → Agent → Web
  search`); embedded reads `EXA_API_KEY`. No key → the tool answers with where one goes.
- WSX is inert data: registry primitives, literal props, the closed `expr` grammar only. Components
  own appearance (four enums: `variant tone size emphasis`); pages own content. Validation before
  persist and before render. Format reference: `docs/wsx-primitives.html`.
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
  Nitro ships every installed platform binary; the studio `build` script drops the `-musl` ones
  (~285 MB): both hosts are glibc.
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
