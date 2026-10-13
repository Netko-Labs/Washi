# glibc, not alpine: the Agent SDK binary bun installs is the glibc build, and on musl it
# cannot even start — every hosted Anthropic turn would fail.
FROM oven/bun:1.4-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/server/package.json apps/server/
COPY packages/server/control/package.json packages/server/control/
COPY packages/server/domain/package.json packages/server/domain/
COPY packages/server/repository/package.json packages/server/repository/
COPY packages/server/service/package.json packages/server/service/
COPY packages/server/trpc/package.json packages/server/trpc/
COPY packages/shared/hanko/package.json packages/shared/hanko/
COPY packages/shared/ink/package.json packages/shared/ink/
COPY packages/shared/models/package.json packages/shared/models/
COPY packages/shared/paper/package.json packages/shared/paper/
COPY packages/shared/tsuru/package.json packages/shared/tsuru/
COPY packages/shared/typescript-config/package.json packages/shared/typescript-config/
COPY packages/shared/wsx/package.json packages/shared/wsx/
# --ignore-scripts: the root `prepare` installs git hooks (husky, a devDependency); an image has no git.
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:1.4-slim
WORKDIR /app
# The whole tree, not just ./node_modules: bun's isolated linker puts workspace links in each
# workspace's own node_modules, and without them `@washi/*` does not resolve.
COPY --from=deps /app ./
COPY apps/server apps/server
COPY packages packages

ENV NODE_ENV=production
EXPOSE 3000
# Bun runs the TypeScript entry directly; there is no build step to drift from source.
CMD ["bun", "run", "apps/server/src/main.ts"]
