# Build to M2

Acceptance: `bun test` green, `turbo check-types` green, `biome check` green,
`mirin check --scenario` green (M1 + M2 flows), commits at each milestone.

## M0 — scaffold

- [x] repo shape (Anko 1:1), configs, conventions fork, CI
- [x] booting shell: rpc ping round-trip, check.ts passes

## M1 — sheets core

- [ ] domain: schema (sheets, tables/columns/records, sessions/turns, approvals, oplog), HLC
- [ ] @washi/ink: specs + query/mutation descriptors (+aggregations) + tests
- [ ] @washi/wsx: parse/validate/serialize/extract + diagnostics + tests
- [ ] @washi/paper: registry (zod, class allowlist) + React components + WsxView
- [ ] repository: DDL, Loro sheet store, ops folders, FTS5, ink executor + tests
- [ ] service: sheet service (validate-on-save, link extraction), search
- [ ] api routes + events; ui: sidebar, sheet view, cmdk search
- [ ] check.ts: create sheet → renders → search finds it

## M2 — embedded Claude

- [ ] @washi/tsuru: policy + guarded fetch + SSRF tests
- [ ] @washi/hanko: verb registry + executor + tests
- [ ] agent host: SDK query loop, in-process MCP tools, canUseTool → approvals,
      session/turn persistence, budget, ACP-shaped updates
- [ ] api agent routes + events
- [ ] ui: right panel — transcript, tool cards, wsx diff, permission prompts
- [ ] check.ts: agent panel renders; approval flow drivable without API key

## Lessons

(log corrections here as they happen)
