/** Saving Washi's key is `ownerProcedure`: an owner or an admin. */
export function mayGiveKey(role: string): boolean {
  return role === 'owner' || role === 'admin'
}
