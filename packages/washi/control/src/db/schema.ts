import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * The control plane, and nothing else (C1). Identity, membership and secrets
 * live here; not one sheet, record, transcript or ledger row does. Content is a
 * SQLite file per workspace, hosted and local alike — which is the whole reason
 * phase 7 is a redeployment rather than a second implementation.
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    /** Better Auth's organization plugin parks the active org here. */
    activeOrganizationId: text('active_organization_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('session_user_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('account_user_idx').on(table.userId)],
)

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** An organization IS a workspace IS one SQLite file (Q23). */
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('member_org_user_idx').on(table.organizationId, table.userId),
    index('member_user_idx').on(table.userId),
  ],
)

export const invitation = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').default('member'),
    status: text('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('invitation_org_idx').on(table.organizationId)],
)

/**
 * BYOK. One key per organization (Q24) — the owner's key runs everyone's turns.
 * Only the ciphertext and a display suffix are ever stored, and nothing here is
 * ever returned to a client: the API exposes `last4` and a replace button.
 * Treated like a password table, because an Anthropic key cannot be scoped —
 * leaking one hands over the whole Anthropic account, not just a workspace.
 */
export const organizationSecret = pgTable(
  'organization_secret',
  {
    organizationId: text('organization_id')
      .primaryKey()
      .references(() => organization.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('anthropic'),
    /** Provider-native model id. Null takes the provider's default. */
    model: text('model'),
    ciphertext: text('ciphertext').notNull(),
    iv: text('iv').notNull(),
    last4: text('last4').notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('organization_secret_provider_idx').on(table.provider)],
)

/**
 * Keys for the services Washi reaches out to (Exa today), one per organization
 * and integration, sealed exactly like the agent key: ciphertext, a display
 * suffix, and nothing a client can read back.
 */
export const organizationIntegration = pgTable(
  'organization_integration',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    integration: text('integration').notNull(),
    ciphertext: text('ciphertext').notNull(),
    iv: text('iv').notNull(),
    last4: text('last4').notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.integration] })],
)

/**
 * A workspace's own bucket for new uploads. Where it is stays legible; the access key pair is
 * sealed like the agent key, and only the key id's last four come back out.
 */
export const organizationStorage = pgTable('organization_storage', {
  organizationId: text('organization_id')
    .primaryKey()
    .references(() => organization.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  region: text('region').notNull(),
  bucket: text('bucket').notNull(),
  prefix: text('prefix'),
  ciphertext: text('ciphertext').notNull(),
  iv: text('iv').notNull(),
  keyLast4: text('key_last4').notNull(),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** The server's own settings (`signup`), one row per key. Not a workspace's. */
export const instanceSetting = pgTable('instance_setting', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** Who runs the server: its first account, seeded at boot and after the first sign-up. */
export const instanceAdmin = pgTable('instance_admin', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
