import { sql } from 'drizzle-orm'
import type { ControlDB } from './client'
import { seedInstanceAdmin } from './instance'

/**
 * Hand-written idempotent DDL, matching the workspace side — no drizzle-kit,
 * no migration files. The control plane is small and additive; when that stops
 * being true it earns a real migration story.
 */
export async function ensureControlSchema(db: ControlDB): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      active_organization_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS session_user_idx ON "session"(user_id)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      access_token_expires_at TIMESTAMP,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      id_token TEXT,
      password TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS account_user_idx ON "account"(user_id)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "organization" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "member" (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS member_org_user_idx ON "member"(organization_id, user_id)`,
  )
  await db.execute(sql`CREATE INDEX IF NOT EXISTS member_user_idx ON "member"(user_id)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "invitation" (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMP NOT NULL,
      inviter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)
  // Additive, for a database created before this column existed.
  await db.execute(
    sql`ALTER TABLE "invitation" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS invitation_org_idx ON "invitation"(organization_id)`,
  )

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "organization_secret" (
      organization_id TEXT PRIMARY KEY REFERENCES "organization"(id) ON DELETE CASCADE,
      provider TEXT NOT NULL DEFAULT 'anthropic',
      model TEXT,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      last4 TEXT NOT NULL,
      updated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)
  await db.execute(sql`ALTER TABLE "organization_secret" ADD COLUMN IF NOT EXISTS model TEXT`)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS organization_secret_provider_idx ON "organization_secret"(provider)`,
  )

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "organization_integration" (
      organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
      integration TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      last4 TEXT NOT NULL,
      updated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (organization_id, integration)
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "instance_setting" (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "instance_admin" (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`)
  await seedInstanceAdmin(db)
}
