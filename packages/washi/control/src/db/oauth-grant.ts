import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { oauthClient } from './oauth'
import { organization, user } from './schema'

/** The workspace a person chose for one client on consent: what its access tokens act in. */
export const oauthWorkspaceGrant = pgTable(
  'oauth_workspace_grant',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.clientId] })],
)
