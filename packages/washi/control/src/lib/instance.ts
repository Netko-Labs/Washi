import type { SignupMode } from '@washi/trpc'
import { and, eq, gt, sql } from 'drizzle-orm'
import { instanceAdmin, instanceSetting, invitation, user } from '../db'
import type { ControlDB } from './client'
import { DEFAULT_SIGNUP } from './constants'

const SIGNUP_KEY = 'signup'

/** The oldest account runs the server, once nobody does — on boot and after each sign-up. */
export async function seedInstanceAdmin(db: ControlDB): Promise<void> {
  await db.execute(sql`
    INSERT INTO "instance_admin" (user_id)
    SELECT id FROM "user"
    WHERE NOT EXISTS (SELECT 1 FROM "instance_admin")
    ORDER BY created_at, id
    LIMIT 1
    ON CONFLICT DO NOTHING`)
}

export async function isInstanceAdmin(db: ControlDB, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: instanceAdmin.userId })
    .from(instanceAdmin)
    .where(eq(instanceAdmin.userId, userId))
    .limit(1)
  return rows.length > 0
}

export async function signupMode(db: ControlDB): Promise<SignupMode> {
  const [row] = await db
    .select({ value: instanceSetting.value })
    .from(instanceSetting)
    .where(eq(instanceSetting.key, SIGNUP_KEY))
    .limit(1)
  return row?.value === 'open' ? 'open' : DEFAULT_SIGNUP
}

export async function setSignupMode(db: ControlDB, mode: SignupMode): Promise<void> {
  const row = { value: mode, updatedAt: new Date() }
  await db
    .insert(instanceSetting)
    .values({ key: SIGNUP_KEY, ...row })
    .onConflictDoUpdate({ target: instanceSetting.key, set: row })
}

/** Open, the very first account, or an email a workspace is waiting for. */
export async function mayCreateAccount(db: ControlDB, email: string): Promise<boolean> {
  if ((await signupMode(db)) === 'open') return true
  const [anyone] = await db.select({ id: user.id }).from(user).limit(1)
  if (!anyone) return true
  const [invited] = await db
    .select({ id: invitation.id })
    .from(invitation)
    .where(
      and(
        sql`lower(${invitation.email}) = ${email.toLowerCase()}`,
        eq(invitation.status, 'pending'),
        gt(invitation.expiresAt, new Date()),
      ),
    )
    .limit(1)
  return Boolean(invited)
}
