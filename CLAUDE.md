# Washi

Agent-first knowledge base. Notes are WSX — JSX as a serialization format, rendered by the closed
`@washi/paper` registry. Structure rules: @docs/conventions.md — that file wins for structure, this
one for project facts.

**Washi is one runtime, two hosts.** `@washi/runtime` builds it in two modes: `embedded` (what the
desktop's main process boots — no accounts, one workspace, no port) and `hosted` (the studio, a team
server — Better Auth sessions, organizations, invitations, BYOK). Both serve the **same `appRouter`**:
the studio over HTTP + `/trpc-ws`, the desktop over mirin IPC. Team collaboration ships first;
local-only mode is deferred to phase 7, not cut.

The old `docs/` spec set (PRD, primitives, design canvas) was dropped for a rewrite (2026-10-27); its
decisions log (D1–D87, still cited below) is in git history before that date. Brand and washi-chan
guidelines live in `Netko-Labs/brand-assets` (`washi/guidelines/`). Until the rewrite lands, `/learn`
is the primitives reference and these rules stand — a PR that breaks one does not ship:

- **C1** A workspace is one SQLite file, hosted too; Postgres holds identity only.
- **C2** One binary, `hosted | embedded` asserted once at boot, never per request.
- **C3** `repository` and `service` never see a request, a user or the network.
- **C4** The desktop is the web client in a mirin window: same `appRouter`, no desktop-only paths.
- **W1** WSX is data: registry primitives, the closed `expr` grammar; validated before persist and
  before render. A page may also run code (D100) — imports and code above its markup, `{…}` in it —
  and that code runs only in the reader's QuickJS: no DOM, network or timers, every import bundled
  on the server from a vetted list or a page the reader may read, a deadline and a memory cap, no
  reach but the page's own (its state, rows the reader may read, its verbs), writes only from a
  press. What it draws is checked like any page and keeps the page's own literal look and access.
  A prompt-injected page is wrong content and at worst code doing what a button on that page could
  — never a breach.
- **W2** The registry is closed and additive; components own appearance, pages own content. A gap is
  `<Missing kind reason />`, never an escape hatch.
- **W3** Pages size to their container, never the window.
- **A1** Agent tools (ink · tsuru · hanko) are the only capability surface; never fs, shell or raw SQL.
- **A2** Reads pass, page and table writes land with an undo stack, whatever leaves stops at the desk.
- **A3** A team server never bills one person's plan.
- **A4** Washi never reviews code.
- **P1** Every record write goes through `insertRecord · updateRecords · deleteRecords`.
- **P2** Writes merge (Loro, `baseVersion`); a merge that breaks WSX is `SheetConflictError`.
- **P3** Nothing on screen is invented; empty states are the honest default.

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
  Pages are routes: `/sign-in?redirect=`, `/workspaces?invite=`, `/new` (a new workspace: name it ·
  start it · invite people, then the workspace's first run wakes Washi), `/s/$workspaceId/$token` (a
  page's read-only link, no session — D65), `/w/$workspaceId` (dashboard),
  `/p/$pageId`, `/inbox`, `/chats` · `/chats/new` · `/chats/$chatId` (D67), `/routines` · `/routines/$id` (D68), `/settings?tab=`, `/trash`, and `/learn` (D87: every primitive
  live over the book's in-memory host, recipes, limits — public, no session; Settings → General links it). Any of them may carry `?peek=<page>`: a row
  opened over it (D79, `RowPeek` — side or center, `washi:peek`; Back closes it). The shell
  registers the peek with `useRowOpenerStore`; without one (the desktop) `openRow` opens a tab. The workspace loader resets the shared stores (child
  effects run before the layout's); routes mark their view active, and a page chosen anywhere
  pushes its URL (`useTabNavigation`). **No tab strip on the web (D58)** — the URL is the whole
  state; `TabStrip` is the desktop's. The sidebar is **Sidebar D (D57)**: the ask field (the
  mascot is Washi's state and opens the panel, the text opens the palette), Home with Inbox ·
  Chats · Routines as icons, Recents (last three pages opened, per workspace in localStorage),
  Favorites, the page tree (native drag and drop; `placementFor` in `@washi/ui` decides where a
  drop lands and refuses a page into its own subtree), Routines, Trash, and the workspace footer:
  the name switches workspaces in place (the shell is keyed by workspace id and the route has
  `gcTime: 0`, so every switch reruns the loader and the route effects), the avatar holds theme ·
  settings · sign out. The sidebar **folds** (D59): `⌘\` or its toggle (`SidebarToggle`, top-left at the same pixel open or folded, as
  claude.ai has it; hovering it folded peeks, a click pins), the
  left edge peeks it as an overlay, remembered per workspace (`washi:fold:<id>`). Under `md`
  `NarrowShell` shows the same Home (the dashboard) and pages as the desktop, one at a time; a page
  has ‹ back, and ☰ or a swipe in from the left edge opens the whole sidebar as a full-screen menu
  (`MobileDrawer`, D80–D82; drawn once and slid, never mounted on open; ✕, a swipe back left or a
  pick closes it). The header keeps Edit and ⋯ (`NarrowHeaderActions`; comments, share, copy link and
  the star fold into ⋯ as `PageMenuQuick`); Washi is the mascot FAB under the thumb, no bottom bar. Gestures are `useSwipe` (`components/shared/gestures`): touch
  events, axis-locked, far-or-fast commits; a phone's peek is a sheet its bar pulls down. `useIsNarrow` picks the shell; the workspace routes never SSR.
- `apps/desktop` — mirin shell: window, menu, icon, Develop menu. `src/bun/` (main) boots the
  embedded runtime and serves `appRouter` via `createMirinBridge`; the renderer's `api` is a tRPC
  client over `mirinLink`. No port, no token.
- `apps/mihon` — the WSX sample book: a Vite SPA over `@washi/paper` with a `PaperHost` in memory
  (`tasks` seeded, verbs land, binds refetch). Knobs come from `paperRegistry` (`knobsFor`), one
  specimen per primitive (`SPECIMENS`, tested to validate) — host, specimens, knobs and the guide
  (`SUMMARIES`, `RECIPES`, `pageLimits`, `propRows`) live in `@washi/paper/book`, which `/learn` reads too, and the stage runs the server's gates
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
- **The look is the page's (D64).** `icon` and `cover` are `<Sheet>` props; the source is the
  truth and `sheets.icon/cover` a cache every write re-reads off the root (`lookOf`). Never set
  the columns any other way — `sheets.updateMeta` writes a picked icon or cover into the doc
  (`updateSheetMetaAndLook`: merged, validated, an edit); only `full_width` and rename are metadata,
  and width alone is not an edit. A look picked before D64 was lifted into its page once per
  workspace (`liftLooksIntoSource`, app meta `look_in_source`, quiet: no stamp, no author). Paper's
  `SheetFrame` draws the cover full bleed and the icon half over it; the host lends what paper
  can't know through `SheetLookProvider` (picture/file URLs, `drawIcon`, a `band` for its own
  controls, `edit(part, anchor)`), and `SheetView` takes `chrome` (the band) and `look`. The editor
  saves over the `<Sheet>` of the version it typed on (`sourceOver`), so typing never reverts a
  look changed meanwhile. A cover is a **key**, never a URL (D60): `preset:sage` (a gradient),
  `picture:fjord` (one of the twelve photographs in `apps/studio/public/covers/`, attribution
  beside them) or `file:<id>` (an upload); presets and pictures live in `@washi/paper/registry`.
  An icon is a registry name, an emoji or `file:<id>` (`SheetIcon` draws an upload through the
  host's `fileUrl`, else a page glyph).
- **A workspace keeps its own emoji (D71).** `custom_emojis` (workspace file; `ensureCustomEmojis`):
  a bare lowercase shortcode unique per workspace over an upload; `emojis.list/add/remove`, its
  adder or a steward removes. Picking one sets the icon to `file:<fileId>`. `trashedUploads` never
  frees an emoji's file; removing the emoji frees it only if nothing wears it (`isUploadWorn`).
  The picker's Unicode set is generated (`apps/studio/scripts/emoji-values.ts` from
  `emoji-test.txt`, ≤ Emoji 15.1) into `components/shared/emoji/values/` — never hand-edit it.
- **A person picks a page's theme (D88).** `<Sheet theme>` is a registry id — the house eight and
  seven ported palettes (`theme-values/`, a light tone nudged in lightness where it missed the rules)
  — or `ws:<slug>`, a theme the workspace made: `workspace_themes` (workspace file), eight tokens a
  mode, `themes.list/add/update/remove`, its maker or a steward changes it, a rename keeps the slug.
  Written like the look (`updateMeta` → the source; ⋯ → Theme). Paper resolves a `ws:` key through
  `SheetLookHost.theme` (`useThemesStore.pairOf` in `SheetView`; a public link carries the tokens in
  its payload); a key nobody lends wears Washi. `themeChecks` is the one contrast gate: below `refuse`
  a save is refused, below `warn` the editor flags it. Import reads shadcn/tweakcn CSS (`:root` ·
  `.dark`, oklch/hsl/hex) or a Washi theme file (`readTheme`, `fillDraft` names what it filled);
  Export writes the file back. Washi leaves `theme` unset unless asked.
- **Who reads a page is the page's (D65).** `<Sheet visibility access>`, cached in
  `sheets.visibility/access` like the look: `shared` (default) = the workspace, `private` = the
  member ids in `access` + owners (a page is as closed as its most closed ancestor), `public` =
  plus a read-only link (`sheet_shares`; one live token per page, opened and closed by
  `syncShare` on every write). Every read goes through `readableSet(ws, viewer)` — tRPC's
  `pageProcedure` checks any `id`/`sheetId`/`parentId` and answers NOT_FOUND; `ctx.viewer` is
  the actor + whether they own the workspace. Washi reads as the asker (`AskOptions.viewer` →
  `pagesFor`); routines are `NOBODY`. Washi's writes may not change visibility/access nor lower
  `redactionWeight` on a public page (`guardWashiWrite`). `<Redact reason>` blocks and
  `redact={[cols]}` on data views are emptied/dropped server-side for a link (`sharedPage`,
  `sharedQuery`: only the page's own tables, no filter/sort/group on a redacted column).
  Tables themselves are not page-scoped: members read every table. `forgetUnenforcedVisibility`
  dropped pre-D65 visibility props once per workspace (app meta `visibility_enforced`).
- **Files.** Uploads live in the workspace's files store: a row in the workspace's `files`
  table and the bytes beside the `.db` (`<dataDir>/<workspace>.files/`) or, with
  `WASHI_FILES_S3_*` set, in a bucket under a per-workspace prefix through Bun's own S3 client.
  `POST /api/files` (multipart) and `GET /api/files/<id>` are studio routes gated like a workspace
  procedure (`src/server/files.ts`); `files.remove` is tRPC. What a workspace takes is `UPLOAD_RULES`
  in domain (D95): pictures 10 MB, videos 50 MB, audio and documents 25 MB — never HTML or SVG;
  `uploadRefusal` says why in words, on the server and before a picker uploads (covers, icons and
  emojis ask for a picture). Served bytes are `nosniff`, `Content-Security-Policy: sandbox`, inline
  only for media and PDFs (else a download), and honour `Range` (`byteRange` → 206) so a video seeks.
  `<Video>` `<Audio>` `<File src name bytes>` and `<Figure>` take an https address or `file:<id>`
  (`mediaUrl` through the host's `fileUrl`); `/image` `/video` `/audio` `/file` open the picker in the
  press that chose them and land the block once stored. Every `file:` key a page holds is indexed in
  `sheet_files` on each write (`extractFiles`), so a purge frees a block's upload like a cover's
  (`trashedUploads`), `isUploadWorn` keeps one still used, and a shared link serves only uploads its
  own (redacted) page uses. `<Gallery columns gap>` holds Figures as squares; a press opens a native
  `<dialog>` lightbox read off the grid as drawn (each picture a focusable button — Enter or Space
  opens it; ‹ › and the arrow keys walk, Escape closes);
  `/gallery` uploads several pictures at once (one refused refuses all, in its words). The desktop
  renders no covers or uploaded icons yet.
- **A workspace may bring its own bucket (D70).** Settings → Workspace → Storage: endpoint,
  region, bucket, folder and a key pair, in the control plane's `organization_storage` (the
  pair sealed like BYOK, only the key id's last four shown; `storage.*`, writes `ownerProcedure`).
  `storage.set` re-runs `storage.test` (`testStorage`: put, read back, delete a probe under
  `<folder>/<workspace>/`) and refuses unless it passes. New uploads go to that bucket; a read
  tries it, then the server's store (`routedBlobStore`), so nothing moves or is deleted on a
  switch. A change lands on the next upload, no restart (`workspaceBuckets` rebuilds when the
  config reads differently; the control plane caches the opened config until `set`/`remove`).
  After Remove, files that landed in the bucket no longer open. Embedded has no storage store.
- Typing into a page (studio `page-editor`) edits the sheet's **top level** as blocks: plain-text
  Title/Text/List/Item/Quote/Callout/Code/Divider become typed blocks; anything else (or text with
  inline marks) stays a locked block, kept byte-for-byte. `/` also drops live blocks in as locked
  blocks: a new database (`/database Name` defines the table), a linked view of any table
  (`<Database>`), or a 30-day progress chart over a status's done group. Saves go through `sheets.update` — the
  same validation as the agent's. `serialize` writes text with `<{}>&`, runs of spaces or
  newlines as a string literal, so typed text always round-trips.
  A locked block draws its own `<Sheet>` frame under a `SheetLookProvider` with no `band` or `edit`, so
  the page's controls (cover, comments, Undo) are drawn once, not per block. The studio gives a page
  64px gutters from a 640px sheet up (`styles.css`), the room each block's + and ⋮⋮ need; the handle's
  hover area is the whole gutter beside the block.
- **Source mode** (the `</>` toggle while editing, or *Edit source* in the page menu) edits the
  sheet's raw WSX in CodeMirror. It runs the server's own check client-side (parse + validate
  against `paperRegistry`), autosaves only a valid draft through `sheets.update` with
  `baseVersion`, and holds Done while the draft has errors. `state`, `expr`, `bind` and `action`
  are a page's behaviour; a page's own code (D100) is what runs, sandboxed. `/` → Page code opens it.
- **Tables are Notion databases.** Properties: `status` (todo · doing · done groups), `select`,
  `multi_select`, `person` (member id), `date` (`start/end` for a range), `url`, `relation` (record
  ids), `formula` (D73: an `expr` over its own row in the page grammar — `month(date)`, `usd * fx_rate`,
  `when(paid, false, days(now(), due) < 0)` — computed on every read by `ink-formulas.ts`, never
  stored or written; checked at definition; a query that filters, orders or groups on one finishes
  in memory over ≤5000 rows; a link hides any formula that reads a redacted column), `rollup` (D74:
  `{ table, via, fn, column?, where?, on? }` — an aggregate over another table's rows pointing here,
  by relation id or by `on` value; `{ param }` in its `where` reads the query's `params`, which a page
  may fill from state; computed before formulas by `ink-rollups.ts`; never over another rollup). Washi's
  `db_link_column` (`linkColumn`) turns a text/select/multi_select column into a relation in one
  transaction, matching values to the target's text column; `create` makes the missing targets. Every row can open as a page (`sheets.row_id`, unique; out of the tree). Every write to a
  row also appends what it became to `record_changes` — the history a `Chart history` replays day
  by day — and who wrote it (`author`, D78): a member id the service passes as data (tRPC's
  `ctx.viewer.id`, the person who pressed a page action), `washi` for its tools and agent actions,
  null for versions from before. `rowActivity` diffs consecutive versions (formulas and rollups are
  never stored, so never diffed): the row page's Activity and Washi's `db_row_activity`. Never
  update `records` without going through `insertRecord`/`updateRecords`/`deleteRecords`, or
  history silently forgets.
  A **copy** (D76: ink kind `copy`, page verb `table.copy`, `tables/copy.ts`) makes every row a
  `where` matches a new row, `set` over it — a cell or `{ expr }` over the source row
  (`add_months(date, 1)`); `params` fill `{ param }` filters and read as `$name`, and an unset one
  refuses. One transaction through `insertRecord`, ≤500 rows or nothing, computed columns never set.
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
- **The server is its first account's (D66).** The oldest account is the app admin
  (`instance_admin`, seeded at boot and after each sign-up once nobody holds it). Sign-up is
  `invite` by default — only the very first account or an email with a pending, unexpired
  invitation — or `open`; Better Auth's `user.create.before` hook refuses the rest
  (`mayCreateAccount`). Settings → Server is the admin's alone (`instance.*`, `adminProcedure`);
  embedded has no instance store, and the studio refuses to boot in embedded mode. Washi is
  AGPL-3.0-only (`LICENSE`, every `package.json`).
- **A chat is its starter's (D67).** `agent_sessions.created_by`; null is the workspace's (a
  routine's runs, every chat before D67). `chatProcedure` answers NOT_FOUND for any `sessionId`
  that is someone else's, and the agent subscriptions, `pendingApprovals` and `today` drop their
  events — an owner does not read a member's chat. A chat may be anchored (`anchor_sheet_id` +
  `page`·`subtree`). Search is FTS5 over title + everything said (`agent_sessions_fts`, rebuilt per
  chat on each ask and each finished turn; `searchChats`, matches marked ⟦ ⟧). A chat opens as a
  page at `/chats/$chatId` (the panel's `page` placement; the host's `onExpand` gives the panel ⤢);
  `/chats/new` is the store's `draft` — nothing is created until the first send.
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
- **Routines are pages (D68).** `/routines` (switches, next run, templates) and
  `/routines/$id` (`?tab=setup|runs`; `/routines/new?template=`). A schedule is five-field cron on
  the wall clock of its IANA zone (`@washi/domain` `shared/cron`: `parseCron`, `latestOccurrence`,
  `nextOccurrence`, `describeCron`); due = not run since the latest minute it names **today**
  (`last_run_at`, a wall key `YYYY-MM-DDTHH:MM`), so a night off never catches up tomorrow.
  `minuteOfDay` is still accepted on create (→ a daily cron) and still returned, for the desktop.
  Every run is a row in `routine_runs` (trigger `schedule`·`manual`) and its own chat (the
  workspace's: `created_by` null); status, cost and duration are read off that chat. Run now leaves
  the schedule alone. Saving or resuming never fires: the minute already past today counts as run.
- **Reminders are rules, not turns (D77).** `reminders` (workspace file; `ensureReminders`): a table,
  its `date` column, `days_before` 0–60, an ink `where`, an optional `person` column, the zone it
  counts days in. The routine clock calls `tickReminders` beside `routines.tick` — no agent, no
  cost — and `reminder_hits` takes one row per rule · row · due day (`INSERT OR IGNORE`), so a row
  reminds once per date; a range counts by its start. A person column sends a row only to the member
  it names; `reminder_reads` is per person. `reminders.inbox/unread/markRead` feed the studio's Inbox
  (`useReminderRows`, its count polled every 30s like mentions); rules sit under Routines; Washi's
  `reminder_create`. A rule whose table or column is gone is skipped, never thrown.
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
- **The agent panel (D61).** `AgentPanel` takes a `placement`: `float` (the popover), `dock` (a
  flex sibling the studio's wide shell puts beside the page; the default — only an undock is
  remembered, `washi:dock:<id>` = `0`; the FAB, the whole mascot tile on a squircle, steps aside
  while it is open) or `sheet` (the whole screen under
  `md`). The composer sets a conversation up: `+` attaches a page by id (Washi is told to read it
  with `sheet_get`), a text file (inlined, 200 KB) or a picture (an image block on the Claude
  port; the AI SDK path says it cannot see it yet) through the host's `uploadFile`; the model
  and effort chips are per conversation (`agents.setSessionOptions`, null = the workspace
  default; on the desktop the model chip is Claude Code's four). A conversation is titled from
  its first ask, then by Washi through `set_conversation_title` (a tool both ports expose,
  asked for in the instructions); `agents.renameSession` and `deleteSession` (refused while a
  turn runs) are the person's. `onSessionChanged` tells the list to refetch.
- **Settings is grouped by whose it is (D69):** one column, the groups as sliding pills and each
  group's sections as tabs under them — Account (Profile — `auth.updateUser`; Preferences —
  the theme, one `useTheme` store in `components/shared/theme`), Workspace (General — rename through
  `auth.organization.update`, owners and admins; People; Storage — D70; Emojis — D71), Washi
  (Models · What leaves · Usage · Routines), Server (the app admin's). `?tab=` names the section;
  an unknown one (the old `agent`)
  lands on Models. **The team's models** are app meta `agent_enabled_models` (`EnabledModel[]`, id +
  the catalogue's name, per provider; none for the key's provider = the recommended three), set by owners (`agents.setEnabledModels`)
  and read by the composer's model chip through `agents.settings`. Menus and pickers in the studio
  are `Floating` (`components/shared/floating`): portalled to the body, so no `overflow-hidden`
  card or sidebar clips them; `useDismiss` treats a press inside `[data-floating]` as inside.
- **Settings → Washi is the old three cards (D63):** Model (a row per provider; `workspaces.
  setAgentModel` changes the default model without a new key, `removeAgentKey` puts Washi to
  sleep; the default effort — Quick · Balanced · Deep — is `agents.setDefaultEffort`, mapped to
  the SDK's `low · medium · high` on every turn), What leaves the server, Usage and the daily
  stop (`setDailyCap`, `setTurnCap`, `pause`, `setResumeBy` — `owners` makes `resume` refuse a
  member). All of it is app meta in the workspace file except the key, which is the control
  plane's. The day resets on the server's clock; the zone is shown, not set.
  The UI says every tool in words (`describeTool` in `@washi/ui`) — never a tool name or JSON.
- Agent tools are the ONLY capability surface: ink (data), tsuru (network), hanko (actions).
  Never hand agents fs/shell/raw SQL. `web_search` is tsuru's `exaSearch`: hosted runs on the
  workspace's Exa key (`organization_integration`, sealed like BYOK, `Settings → Agent → Web
  search`); embedded reads `EXA_API_KEY`. No key → the tool answers with where one goes.
- **Primitives fit any width (D80).** Paper reads the sheet's own width (`@container wsx`), never
  the window — a phone, the agent panel and a peek reflow alike (`css/narrow.css`): ≤520 a Table
  stacks into cards (first column the title, `data-label` the rest), ≤480 ledger rows wrap, bars put
  the label over the track, a Form goes one column, stats sit two to a row. A Stat in a Grid sizes
  its figure to its own column (`15cqi`), and `.wsx` clips sideways overflow, so a phone never
  scrolls a page horizontally. Coarse pointers get 44px targets and 16px inputs.
- **Pages are apps, not forms laid flat (D83).** `<Agenda bind date title time end badge add>` is a
  week (‹ › Today, the week the reader's, never saved; tighter from 720px, a list under 560px); a row opens in the peek;
  each day's + opens a modal Form seeded with that day (`seed`, written even when not shown).
  `view="month"` (D86) draws whole weeks as a grid (`monthSpan`; neighbours dimmed, three events a
  day then +N more, a list of busy days under 560px); `state` names a `YYYY-MM` page-state key it
  follows and ‹ › Today write, so it moves with a month `Select`.
  `<Form trigger>` puts a form behind one button in a native `<dialog>` (`FormDialog`: top layer,
  Escape, a bottom sheet under 560px, closes when the row lands). An empty data view is a quiet
  filled line, not a dashed box.
- **A page can take bookings (D102).** `<Slots bind date minutes hours days add addLabel>` is
  Calendly's picker: each allowed weekday's `hours` (`09:00-17:00`) cut into `minutes` slots, minus
  rows whose `date` overlaps (a `start/end` range; a lone moment takes `minutes`, a bare day the
  whole day) and minus the past, all in wall-clock strings — zones never enter. A press opens the
  `add` Form in a dialog with `date` seeded `start/end`; as it is sent the day is read again
  (`useSlotBooking`, the form's `check`), and a slot taken meanwhile is refused in words. Week paging is Agenda's (`useAgendaPeriod`). Agenda reads a row's times off its own range
  when it has no `time` column.
- **Days as a grid (D103).** `<Heatmap bind date value weeks label weekStart>` is GitHub's calendar:
  the last `weeks` (4–53, default 16) whole weeks to today, a column per week, each day leveled 1–4
  against the busiest day on screen — rows counted, or `value` summed; a moment or a range counts on
  its first day; future days faded. Once loaded it always draws (an empty grid is an answer); the
  query is held to the days shown (≤ 1000 rows; a read back at the cap says its totals are partial).
- **Database views read like Notion's (D84).** A table's head shows each property's type
  (`PropertyIcon`) and name in sentence case; select/status/person cells draw a pill, a step dot or a
  face over an invisible native select; dates read "Nov 4, 2026" and numbers group until pressed
  (`DateCell`/`NumberCell` swap to the editor on a press); the foot counts rows. A Board with no
  `onAdd` gets + New per column when the host has `newRow`: the row is made in that group, titled
  Untitled, and opened in the peek. A word that means something (high, blocked, in review, done…) wears
  its tone everywhere it shows — pill, badge, a board column's dot, a plain `<Table>` cell past the
  title (`VALUE_TONES` in paper's `lib`); there, and in a Board card's `badge`, a list cell is a pill per item
  (`listCell` keeps what `toRows` joined; `patchRow` carries it through an optimistic move), and an untoned `<Badge>` is a neutral pill. Dates read as dates wherever a cell is drawn (`whenLabel`:
  a day, a moment, a `start/end` range), `$row` in visible text included; empty cells sort last.
  `<Roadmap end>` runs a bar from `date` to a second column, as trackers keep start and due apart.
  A Board column's head counts its cards and sums a numeric `meta` in the reader's numbers, with no
  unit it cannot know. `<Stat format="percent">` reads a ratio as one. Inside a Repeat, a Progress
  takes `value="$row.ratio"` (or `expr` over `$row`); a share nothing real gives — a failed `expr`, an
  empty cell — reads —, never 0% (`ratioOf`). The book's host computes formula columns as the
  server does, so `/learn` and the sample book show their real values.
  A `gallery` view (D91) is a card per row: `cover` names a column holding an https image or a cover
  key (`preset:` · `picture:` · `file:`), the title, then `columns` (default: the first three) read-only
  (`CardValue`); a press opens the row; + New adds one.
- **A wide block reaches past the column (D85).** `width="wide" | "full"` on Board · Agenda · Table ·
  Database · Roadmap · Chart · Canvas · Grid (`css/reach.css`): the sheet's width is `--sheet-w`
  (`100cqi`, an `@property` so it inherits as px), the reach is centred on the column and stops at
  the gutter (`--pad-x`); inside a Card, Grid, Stack, Row, Callout, Reveal or Drawer it stays put. In
  the page editor each live block is its own sheet, so a wide block sits in the column while editing.
- **A page lays itself out (D89).** `<Columns><Column ratio>` is Notion's side by side (flex shares,
  stacked under 560px); `<Bento columns><Tile shape title>` packs tiles densely (square · wide · tall
  · big · banner; 2 across under 720px, 1 under 400). Specs in `registry/layout-specs.ts`, CSS in
  `css/layout-kit.css` (`.wsx-cols`/`.wsx-col` — `.wsx-columns` is the column chart's). A Column and
  a Tile are each a `wsx` container, so what sits in one reflows to its own width. Both take `width`.
  The editor edits Columns in place (a `ColumnsBlock`: each column its own run of blocks; every store
  op finds its block's list through `locate`/`writeList`, then `tidy` drops an emptied column and
  unwraps a lone one). Drag ⋮⋮ onto a block's outer fifth to put it beside (a new row of columns,
  or a new column, ≤5), the rest drops above or below (`moveBlock`); the gap between columns drags
  or takes ← → (`resizeColumns`, shares in sixths). Rows of columns never nest; a Bento stays locked.
- **A hub page lists its pages (D90).** `<Subpages of? layout="list|cards|gallery">` draws a page's
  children live (`PaperHost.listPages` + `onPagesChange` over the sheets store, so a reader never sees
  one they cannot open; `pageId` is the page being drawn; `newPage` gives + New page), `<PageLink
  sheet>` one page as a block. A host with no page tree (a shared link) leaves `listPages` out and
  Subpages draws nothing. `/` in the editor: New page inside (made under the page, linked in place),
  Subpages, Subpage gallery, Link to page · <title>.
- **Pages know each other (D93).** `<Include sheet>` draws another page's blocks without its frame
  (`WsxView` lends the render, its own state and data kept; `PaperHost.loadSheet`, refetched when the
  tree moves); inside an included page, or pointing at itself, it is a PageLink — includes never nest.
  `<Backlinks of?>` lists readable pages linking here (`PaperHost.backlinks` → `sheets.backlinks`);
  `extractRefs` counts Ref, PageLink, Include and a canvas node's page, indexed on each write.
  `<Outline title>` reads the drawn page's headings (Titles and Section titles, not an include's —
  while editing, the heading fields' own values, re-read on input) and scrolls to one. Pages written
  before these were indexed are read again once per workspace at open (`reindexPages`, app meta
  `index_links_files`).
- **A bookmark is read once (D94).** `<Bookmark href title description image site>` is a link as a
  card; its words are the page's own props, so drawing it fetches nothing (the picture loads with no
  referrer). `/bookmark <url>` (or an https address after `/`, beside Embed) asks `links.preview`
  once: tsuru's `linkPreview` — the person's press is the consent for that one host, still https
  only, no private ranges, redirects re-checked, 512 KB — reads og/twitter/`<title>` tags; a site
  that will not answer becomes a bare link. The network call lives in tsuru and is wired in trpc,
  never in `service` (C3). Each preview is a ledger row (`origin: 'sheet'`, `link_preview`, `auto`
  — or `denied` with tsuru's reason), as every press that reaches out is.
- **A page may hold a widget, where an owner allows (D98).** `<Widget title height>` keeps HTML and JS
  as its text (≤ 50 000 chars, checked at save) and draws it in an iframe `sandbox="allow-scripts"` —
  no `allow-same-origin`, so an opaque origin with no cookies, storage or parent — under a CSP with
  no network at all (`default-src 'none'`; pictures only `data:`/`blob:`, which can carry nothing out).
  Its only way out is a `postMessage` bridge the prelude lends as `washi.rows(query)` (the reader's
  rows), `washi.state` / `onState` / `setState` (page state, scalars), `washi.act(action)` (page
  verbs) and its own height; the page hears only its own frame's messages (`useWidget`). The page's
  colours arrive on load. App meta `widgets_enabled`, off by default: `embeds.widgets` /
  `embeds.setWidgets` (owners and admins), Settings → Workspace → Embeds → Widgets; off, or on a
  shared link, a widget is a note. `/widget` drops a clock.
- **A page may hold an automation (D97).** `<Automation table on="insert|update" title>` keeps TSX
  defining `function run(event)` (`{ table, kind, row, before }`). Each write lands it in the index
  (`sheet_automations`, read off the page by `extractAutomations`; a trashed page's sleep). Every row
  write — any path, since `insertRecord`/`updateRecords` tell `onRecordWrite` (a per-workspace
  listener set in repository) — runs the live automations on that table after the write, on the
  server's own QuickJS (`runAutomation`: 16 MB, 100 ms, `rows(query)` reads synchronously, `act`
  collects, `now`). Its actions apply only if the run finished: `table.insert · update · delete`
  (hanko-checked, ≤ 50), signed `automation` — a write so signed never runs automations, so a rule
  cannot loop. Every run is a ledger row (`automation`, `auto` or `denied` with why); a run that
  changed rows emits `workspaceChanged`. The page draws a note (⚡ when a row is added to …); the
  editor gives it Code · Preview; `/` offers *Automation · <table>* with a starter.
- **A workspace may define formula functions (D99).** `<Formula name>` keeps a pure TS function named
  after it (lowercase, never a built-in's name such as `sum` or `when`); `extractFormulas` indexes it
  (`sheet_formulas`; on live pages, the first to take a name keeps it). Only a formula column may call
  one — `parseExpr(…, { workspaceCalls: true })` reads an unknown call as a `fn` node, and
  `validateExpr` checks it against `shape.functions` at definition (`checkFormulas` gets the
  workspace's names); a page's `expr` still refuses any call it does not know. Formulas are computed
  in repository, so service lends a runner through `setFormulaRunner` (a per-workspace callback, like
  `onRecordWrite`): one QuickJS per query with every function defined once, 20 ms per call, values in
  and a value out — no rows, state or network. A function gone, slow or throwing makes that cell null,
  never the query fail. The engine (`scripts/engine.ts`) is shared with automations and loaded at open.
- **Outside agents work a workspace over MCP (D101).** `/mcp/$workspaceId` (studio route, `@washi/mcp`
  `answerMcp`: Streamable HTTP, stateless, JSON answers) serves one member in one workspace. Auth is a
  personal access token (`washi_pat_…`, control plane `access_token`, kept only as its SHA-256, last
  four shown; `tokens.list/create/revoke`, any member for themself; Settings → Account → Agents shows
  the address and the `claude mcp add` line once). A token speaks only for its workspace and only while
  its person is a member; anything else is a 401 that says nothing about the workspace. The tools are
  the **capability table** (`service/capabilities`: `pageCapabilities`, `tableCapabilities` —
  the same set Washi's Claude and AI SDK ports now build from, signed `washi` there — plus
  `commentCapabilities`, MCP only: comment on a page or a row by `recordId`, its row page). Over MCP a
  row write is signed by the member's id and a page write is a person's (`editedBy` null); reads go
  through `readableSet`; no fetch, web search or hanko verbs. Each write emits `workspaceChanged`, so
  open pages refetch. Embedded has no token store, so no MCP.
  **Or OAuth** (`@better-auth/oauth-provider` + `jwt`, `disabledPaths: ['/token']`): an agent
  registers itself (dynamic, public, PKCE), its person signs in (`/sign-in` keeps the signed query;
  `continueUrl` follows it on) and on `/oauth/consent` picks the workspace — `oauth.grant` keeps it
  in `oauth_workspace_grant` (person · client), then Better Auth is told yes. Its one resource is
  `<base>/mcp` (`mcpResource`); `/mcp` checks the JWT against the server's own keys (`auth.api.
  getJwks`, issuer = auth base URL, audience = the resource) and acts where the grant says; on
  `/mcp/<id>` only if that is the grant. Discovery (`/.well-known/oauth-authorization-server[/api/
  auth]`, `openid-configuration`, `oauth-protected-resource[/mcp]`) is a Nitro handler over
  `control.oauth.discovery`; every 401 names `resource_metadata`. OAuth tables: `db/oauth.ts`, as
  `npx auth generate` writes them (regenerate, don't hand-edit), DDL in `lib/ddl-oauth.ts`.
  Installable as a Claude Code plugin from this repo (`.claude-plugin/marketplace.json` → `netko-labs`,
  `plugins/washi`: `.mcp.json` reads `WASHI_MCP_URL` and `WASHI_TOKEN`, and the `backlog` skill —
  take an issue, fix it here, comment the PR on its row, move its status). `claude plugin validate`.
- **An embed is https and listed (D92).** `<Embed src title ratio height>`: the registry refuses http;
  a built-in provider (`EMBED_PROVIDERS` — YouTube via youtube-nocookie, Vimeo, Spotify, Loom, Figma,
  CodePen, CodeSandbox, Miro, Google Maps, Indify) turns its page URL into its player and always plays;
  any other host plays only if the workspace lists it — app meta `embed_hosts`, `embeds.hosts` /
  `embeds.setHosts` (owners and admins), Settings → Workspace → Embeds — which `PaperHost.embedAllowed`
  asks (the studio caches it a minute; `forgetEmbedHosts` on a switch or a save). Anything else is a
  quiet card with an Open ↗ link; a shared link has no list, so only built-ins play there. Frames are
  sandboxed (scripts, same-origin, popups, presentation, forms). This list is not tsuru's fetch
  allowlist: one is what a reader's browser loads, the other what may leave the server. `/embed <url>`
  or an https address after `/` drops one in the editor.
- **Pages are programs (D100).** `parse` reads a page MDX-style:
  code above the first line-start `<Sheet` whose code parses is `root.prelude` (`source` + the
  capitalized names it binds, the page's own components); a non-literal prop is `element.code[prop]`
  (its source), a non-literal child a `{ kind: 'code', source }` hole; literals stay data, so a page
  of literals parses exactly as before. `validate` checks a code prop by name only, lets
  `onPress`/`onClick`/`key` through and the prelude's components by; a `<Sheet>`'s own props stay
  literal. Text beside a hole keeps the space JSX keeps (`Hello {name}`), and `serialize` writes an
  element of text and holes on one line so it survives. `hasCode` says a page runs; `checkSource`
  checks its code at save (below); the editor opens a page with code in source mode. `pageModule` makes a page an ES module: imports, functions
  and `export`s on top, every other statement and the markup in `export default function view()`.
  `compilePage` (service `pages/`, `scripts.page`) bundles it with `Bun.build` — `washi` (the hooks,
  `PAGE_HOOKS`, as calls into `globalThis.__washi`), `washi/ui` (registry names), `PAGE_LIBRARIES`
  (`date-fns`, `lodash-es`, `zod`, resolved off disk) and `page:<id>` (a page the reader can read,
  transitively, ≤ 8 deep) — into one IIFE that sets `globalThis.__page = { view, exports }`; cached
  by source + imported sources (64), ≤ 768 KB. Anything else is refused in words, at save too
  (`pageCodeDiagnostics`: Transpiler + the allowlist). The studio declares the libraries so Nitro
  traces them into `.output` (`RUNTIME_FILE_DEPS`); `zod` alone bundles to ~490 KB.
  Paper runs it (`PageProgram`, from `WsxView` when `hasCode`): `PaperHost.compilePage` (the studio:
  `scripts.page`), then the shared sandbox (`lib/sandbox`: QuickJS, 32 MB, 100 ms a draw) with
  `programPrelude` — the registry names, an `h` that calls a page's own components, and
  `globalThis.__washi`: `useRows` `useRow` `useTable` `useInsert` `useUpdate` `useDelete` · `useState`
  (local, by call order) `usePageState` (the page's `state`; an
  unset key's `initial` is written once the page has drawn, so a Select on it shows the same) `useStored` (the reader's, localStorage)
  `useInterval` `useNow` · `usePage` `usePages` `useMembers` `useMe` (`describeMe`) `useNavigate` ·
  `act`. Reads answer from what is known and are fetched after the run that asked, then it draws
  again (also on data or page-tree changes). A write — `act`, an insert, a state change, a
  navigation — runs only from a press; mid-draw it throws, so drawing never writes. What `view()`
  returns is checked like a page (`checkDrawn`; the `<Sheet>` keeps the page's own literal props;
  adjacent text runs joined); before it runs, where it stops (said once, quietly) or on a host
  without `compilePage` (a shared link, the book), `literalOnly` draws just its literal parts.
  `<Script>` (D96) left the registry with it: `liftScriptsIntoCode` (app meta `scripts_as_code`,
  once per workspace at open, quiet) made each one a component of its page — `ScriptN()` holding its
  code and returning `view()`, drawn where it stood (in a Section of its title), the page importing
  `usePageState as useState, useRows, useInterval, act` so it runs as it did; a page that would not
  check keeps its scripts as `<Code lang="tsx">`. A handler (`onPress`) stands in for the `action`
  it becomes; on a primitive that takes no press it is refused in words. `/` → Page code opens the
  source editor; Automations and Formulas keep Code · Preview (`ScriptBlock`, `scripts.compile`).
- WSX is inert data: registry primitives, literal props, the closed `expr` grammar only. Components
  own appearance (four enums: `variant tone size emphasis`); pages own content. Validation before
  persist and before render. Format reference: `/learn` and the registry specs.
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
