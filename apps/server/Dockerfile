FROM oven/bun:1.4-alpine AS deps
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
COPY packages/shared/paper/package.json packages/shared/paper/
COPY packages/shared/tsuru/package.json packages/shared/tsuru/
COPY packages/shared/typescript-config/package.json packages/shared/typescript-config/
COPY packages/shared/wsx/package.json packages/shared/wsx/
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4-alpine
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY package.json ./
COPY apps/server apps/server
COPY packages packages

ENV NODE_ENV=production
EXPOSE 3000
# Bun runs the TypeScript entry directly; there is no build step to drift from source.
CMD ["bun", "run", "apps/server/src/main.ts"]
