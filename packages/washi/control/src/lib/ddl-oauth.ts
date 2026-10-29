import { sql } from 'drizzle-orm'
import type { ControlDB } from './client'

/** The OAuth provider's and JWT plugin's tables (D101), as `db/oauth.ts` declares them. */
export async function ensureOAuthTables(db: ControlDB): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "jwks" (
      id TEXT PRIMARY KEY,
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      expires_at TIMESTAMP,
      alg TEXT,
      crv TEXT
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_client" (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL UNIQUE,
      client_secret TEXT,
      client_discovery_id TEXT,
      disabled BOOLEAN DEFAULT FALSE,
      skip_consent BOOLEAN,
      enable_end_session BOOLEAN,
      subject_type TEXT,
      scopes TEXT[],
      client_credentials_scopes TEXT[] DEFAULT '{}',
      user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      name TEXT,
      uri TEXT,
      icon TEXT,
      contacts TEXT[],
      tos TEXT,
      policy TEXT,
      software_id TEXT,
      software_version TEXT,
      software_statement TEXT,
      redirect_uris TEXT[] NOT NULL,
      post_logout_redirect_uris TEXT[],
      backchannel_logout_uri TEXT,
      backchannel_logout_session_required BOOLEAN,
      token_endpoint_auth_method TEXT,
      application_type TEXT,
      jwks TEXT,
      jwks_uri TEXT,
      grant_types TEXT[],
      response_types TEXT[],
      require_pkce BOOLEAN,
      dpop_bound_access_tokens BOOLEAN DEFAULT FALSE,
      reference_id TEXT,
      metadata JSONB
    )`)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "oauthClient_userId_idx" ON "oauth_client" (user_id)`,
  )

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_resource" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      access_token_ttl INTEGER,
      refresh_token_ttl INTEGER,
      signing_algorithm TEXT,
      signing_key_id TEXT,
      allowed_scopes TEXT[],
      custom_claims JSONB,
      dpop_bound_access_tokens_required BOOLEAN DEFAULT FALSE,
      disabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      policy_version INTEGER DEFAULT 1,
      metadata JSONB
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_client_resource" (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES "oauth_client"(client_id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL REFERENCES "oauth_resource"(identifier) ON DELETE CASCADE,
      metadata JSONB,
      created_at TIMESTAMP
    )`)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "oauthClientResource_clientId_idx" ON "oauth_client_resource" (client_id)`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "oauthClientResource_resourceId_idx" ON "oauth_client_resource" (resource_id)`,
  )

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_refresh_token" (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL REFERENCES "oauth_client"(client_id) ON DELETE CASCADE,
      session_id TEXT REFERENCES "session"(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      reference_id TEXT,
      authorization_code_id TEXT,
      resources TEXT[],
      requested_user_info_claims TEXT[],
      expires_at TIMESTAMP,
      created_at TIMESTAMP,
      revoked TIMESTAMP,
      rotated_at TIMESTAMP,
      rotation_replay_response TEXT,
      rotation_replay_expires_at TIMESTAMP,
      auth_time TIMESTAMP,
      confirmation JSONB,
      scopes TEXT[] NOT NULL
    )`)
  for (const column of ['client_id', 'session_id', 'user_id', 'authorization_code_id']) {
    await db.execute(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS "oauth_refresh_token_${column}_idx" ON "oauth_refresh_token" (${column})`,
      ),
    )
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_access_token" (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE,
      client_id TEXT NOT NULL REFERENCES "oauth_client"(client_id) ON DELETE CASCADE,
      session_id TEXT REFERENCES "session"(id) ON DELETE SET NULL,
      user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
      reference_id TEXT,
      authorization_code_id TEXT,
      resources TEXT[],
      requested_user_info_claims TEXT[],
      refresh_id TEXT REFERENCES "oauth_refresh_token"(id) ON DELETE CASCADE,
      expires_at TIMESTAMP,
      created_at TIMESTAMP,
      revoked TIMESTAMP,
      confirmation JSONB,
      scopes TEXT[] NOT NULL
    )`)
  for (const column of [
    'client_id',
    'session_id',
    'user_id',
    'authorization_code_id',
    'refresh_id',
  ]) {
    await db.execute(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS "oauth_access_token_${column}_idx" ON "oauth_access_token" (${column})`,
      ),
    )
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_consent" (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES "oauth_client"(client_id) ON DELETE CASCADE,
      user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
      reference_id TEXT,
      resources TEXT[],
      requested_user_info_claims TEXT[],
      scopes TEXT[] NOT NULL,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )`)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "oauthConsent_clientId_idx" ON "oauth_consent" (client_id)`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "oauthConsent_userId_idx" ON "oauth_consent" (user_id)`,
  )

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_client_assertion" (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "oauth_workspace_grant" (
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES "oauth_client"(client_id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, client_id)
    )`)
}
