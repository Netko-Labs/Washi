# Washi

Agent-first knowledge base on the mirin framework (Bun main process + CEF renderer). Notes are
WSX — JSX as a serialization format, rendered by the closed `@washi/paper` registry. Spec (visual,
canonical): `docs/spec.html`. Structure rules: @docs/conventions.md — that file wins for structure,
this one for project facts.

## Commands

- `bun dev` — run the app (`mirin dev`, cwd must be `apps/desktop`; root script handles it)
- `bun run typecheck` — tsgo across all workspaces (turbo)
- `bun run check` — biome check
- `bun test` — unit tests across workspaces
- `bun run --cwd apps/desktop check` — mirin check scenario (e2e; boots the real app)

## Topology

- `apps/desktop` — mirin shell: `src/bun/` main process, everything else renderer
- `packages/desktop/{domain,repository,service,api}` — one-way layering: domain → repository →
  service → api → ui. DB access only in repository; business logic in service; routes in api.
- `packages/shared/wsx` — WSX parse/validate/serialize (isomorphic, no DOM)
- `packages/shared/paper` — note primitive registry; `./registry` subpath is zod-only (main
  process safe), root export is React (renderer only), `./css` is the styling surface
- `packages/shared/ink` — typed table DSL (descriptors; executed in repository)
- `packages/shared/tsuru` — scoped fetch policy + guarded client
- `packages/shared/hanko` — safe action verb registry

## Hard facts

- Local db: bun:sqlite + Drizzle as query builder only; hand-written idempotent DDL in
  repository (`ensureColumn` for additive changes). No drizzle-kit migrations.
- Sheet source of truth: Loro text doc (snapshot blob in sqlite); `source` column is a cache.
- Ids: `Bun.randomUUIDv7()`. Timestamps: HLC strings from domain.
- Agent tools are the ONLY capability surface: ink (data), tsuru (network), hanko (actions).
  Never hand agents fs/shell/raw SQL.
- WSX is inert data: registry primitives, literal props, the closed `expr` grammar only. Components
  own appearance (four enums: `variant tone size emphasis`); pages own content. Validation before
  persist and before render. Format reference: `docs/wsx.md`.
- The RPC router is global; route files live in `packages/desktop/api/src/routes/`.
- `mirin.config.ts` is pure data. Mirin commands run with `apps/desktop` as cwd.

## Git

Commits: `<emoji> <type>(<scope>?): <subject>` (commitlint enforces). Commit at checkpoints;
push only when asked. Never commit runtime state or secrets.
