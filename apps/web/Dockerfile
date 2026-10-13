# The web client is static: build once with the server's public origin baked in, serve with nginx.
FROM oven/bun:1.4-slim AS build
WORKDIR /app
COPY . .
# --ignore-scripts: the root `prepare` installs git hooks (husky); an image has no git.
RUN bun install --frozen-lockfile --ignore-scripts --filter @washi/web
ARG VITE_WASHI_SERVER
ENV VITE_WASHI_SERVER=$VITE_WASHI_SERVER
RUN test -n "$VITE_WASHI_SERVER" && bun run --cwd apps/web build

FROM nginx:1.29-alpine
COPY apps/web/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
