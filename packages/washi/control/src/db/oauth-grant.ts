import { integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { oauthClient } from './oauth'
import { organization, user } from './schema'

/**
 * The workspaces a person chose for one client on consent: where its access tokens act (D124).
 * `position` 0 is the default, the one a call that names none acts in.
 */
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
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.clientId, table.organizationId] })],
)
