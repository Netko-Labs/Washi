/** A host name, or `*.suffix` for every host under it — never an address. */
export const FETCH_HOST = /^(\*\.)?(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
