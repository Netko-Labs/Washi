# Self-hosting with docker compose. Coolify builds the same app with Railpack (railpack.json).
FROM oven/bun:1.4-slim AS build
WORKDIR /app
COPY . .
# --ignore-scripts: the root `prepare` installs git hooks (husky); an image has no git.
RUN bun install --frozen-lockfile --ignore-scripts --filter @washi/studio
RUN bun run --cwd apps/studio build

# glibc, not alpine: the Agent SDK's native claude binary is the glibc build.
FROM oven/bun:1.4-slim
WORKDIR /app
COPY --from=build /app/apps/studio/.output ./.output
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
# slim has no curl or wget; the probe is bun itself.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD ["bun", "-e", "const r = await fetch('http://localhost:3000/api/health'); process.exit(r.ok ? 0 : 1)"]
CMD ["bun", "--no-install", ".output/server/index.mjs"]
