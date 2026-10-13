# @washi/server

One binary, two modes.

- **embedded** — what the desktop app boots in-process. Loopback, a per-boot token, no
  accounts, one workspace. No Postgres.
- **hosted** — a team server. Better Auth sessions, organizations, invitations, BYOK.

```bash
cp .env.example .env
openssl rand -base64 48        # → WASHI_SECRET_KEY
docker compose up
```

## The two planes

Postgres holds **identity only**: accounts, organizations, members, invitations, encrypted
API keys. Content is a SQLite file per workspace under `WASHI_DATA_DIR`, and it is the same
code path the desktop app uses locally. That split is constraint **C1** in `docs/server.html`
— break it and local mode stops being a redeployment and becomes a second implementation.

**A backup must cover `WASHI_DATA_DIR`.** Postgres holds who may read the notes; the volume
holds the notes.

## WASHI_SECRET_KEY

It is the session secret *and* the root of every workspace's BYOK key derivation. Rotating it
signs everyone out and makes every stored API key unreadable — they have to be re-entered.
The server refuses to boot below 32 characters.

## Routes

| path | what |
| --- | --- |
| `/health` | liveness, and which mode is running |
| `/api/auth/*` | Better Auth: sign-in, sign-up, organizations, invitations |
| `/trpc/*` | the app surface |

`/sync` is phase 8 and will be raw binary WS, not tRPC — Loro deltas have no business in JSON.
