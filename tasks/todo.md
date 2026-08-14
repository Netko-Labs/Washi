# Build to M2 — COMPLETE (2026-08-12)

Acceptance met: `bun test` 42 green, `turbo check-types` green, `biome check` green,
`mirin check --scenario` 7 steps green (M1 + M2 flows), commits at each milestone.

## M0 — scaffold ✅

- [x] repo shape (Anko 1:1), configs, conventions fork, CI
- [x] booting shell: rpc ping round-trip, check.ts passes

## M1 — sheets core ✅

- [x] domain: schema (sheets, tables/records, sessions/turns, approvals, oplog), HLC
- [x] @washi/ink: specs + query/mutation descriptors (+aggregations) + tests
- [x] @washi/wsx: parse/validate/serialize/extract + diagnostics + tests
- [x] @washi/paper: registry (zod, class allowlist) + React components + WsxView
- [x] repository: DDL, Loro sheet store, ops folders, FTS5, ink executor + tests
- [x] service: sheet service (validate-on-save, link extraction), search
- [x] api routes + events; ui: sidebar, sheet view, search
- [x] check.ts: create sheet → renders → search finds it

## M2 — embedded Claude ✅

- [x] @washi/tsuru: policy + guarded fetch + SSRF tests
- [x] @washi/hanko: verb registry + executor + tests
- [x] agent host: SDK query loop, in-process MCP tools, canUseTool → approvals,
      session/turn persistence, budget, ACP-shaped updates
- [x] api agent routes + events
- [x] ui: right panel — transcript, tool cards, wsx diff, permission prompts
- [x] check.ts: agent panel renders; session creation drivable without API key

## Design feature gaps (from the spec-parity pass, 2026-08-12)

Elements of docs/spec.html's language that the current model cannot express — features, not hacks:

- [x] **Sheet accent color** — `theme.accent` tape preset on <Sheet> (2026-08-12).
- [x] **`Tape` Paper primitive** — plus Stamp/Chip/Hero/Stat/Card/Timeline/Step (2026-08-12).
- [x] **Page-level typography/texture** — `theme.face` (gothic/serif/rounded) + `theme.paper`
      (plain/dots/lines). Cover images still open.
- [ ] **Cover images for sheets** — needs an asset story (https-only Img exists; local assets don't).
- [x] **Styling freedom in WSX** — Q9 revised 2026-08-13: full Tailwind vocabulary (arbitrary
      values, variants, gradients) via `@tailwindcss/browser`; `url()` banned. Box/Span primitives
      added; six presets remain as starting palettes.
- [ ] **Dark mode toggle** — tokens exist for `.dark`, no UI or persistence wired.
- [ ] **Sheet page-card tape** still hash-derived in app chrome — should read `theme.accent`
      when the sheet has one (small SheetView follow-up).

## Design-handoff implementation (2026-08-13) — shipped vs remaining

Shipped from the claude.ai design projects: handoff tokens (light + pure-black dark), Inter,
248px sidebar (vault switcher w/ VaultIcon, ⌘K search button, page tree, sync row), 48px
breadcrumb header + "Washi watching" pill (AgentMascot state-driven), 334px agent panel
(un-bubbled messages, tool pills, suggestion chips, pill composer, mascot header), command
palette (cmdk), mascot system (MascotDefs + Mascot 7 faces + AgentMascot 8 states + VaultIcon
12 topics + design keyframes), UI-state empty states, suggested-edit diff styling.

Remaining from the handoffs (each is real scope, not styling):

- [ ] **Onboarding flow** — 4-step first-run (local-first pitch, vault creation, sync choice,
      agent consent) + server path variants. Needs first-run detection + vault naming.
- [ ] **Dashboard view** — greeting, stat cards, review queue, recent pages, activity timeline.
- [ ] **Graph view** — backlink graph on dotted canvas (sheet_links data exists).
- [ ] **Settings view** — 4 tabs incl. agent autonomy segmented control + scheduled runs.
- [ ] **Multi-workspace/vault backend** — switcher popover, create-workspace dialog, per-vault db.
- [ ] **Model picker + context meter** in composer (SDK setModel / usage_update plumbing).
- [ ] **In-note agent affordances** — authorship captions, agentColor block borders, inline
      accept/reject on suggested edits (needs block-level anchors → spec Q2/Q3 territory).
- [ ] **Dark mode toggle** (tokens shipped), theme segmented control.
- [ ] **Toast faces + thinking bar + dropzone** from UI states (components exist, not wired).
- [ ] Sidebar folders (tree grouping), user/account row, Share.

## Known gaps (post-M2)

- Live SDK loop not covered by automated tests (would bill + need auth); unit tests
  cover normalization/gating/actions/persistence, check covers UI. Exercise manually
  with `bun dev` and a prompt.
- cmdk installed but unused (simple search input shipped instead).
- Fetch component + tsuru allowlist UI: agents can allow-always hosts; no settings
  surface to edit the list yet.

## Lessons

- drizzle `.run()` types as void on bun-sqlite — use raw `getSqlite().query().run()`
  when you need `changes`.
- Renderer typecheck needs `types: ["vite/client", "bun"]` — Router type resolution
  pulls repository sources into the renderer program (Anko does the same via
  transitive bun-types inclusion).
- `mirin check` runs against the persistent dev db — scenarios must be state-robust
  (click the target sheet, don't assume first-boot state).
- babel parser pairs with @babel/types@^7 — v8 types mismatch v7 AST.
- `mirin check` and `mirin dev` can't run simultaneously — CDP port 9222 collides and the
  check dies with "never published an inspector endpoint". Stop dev first.
