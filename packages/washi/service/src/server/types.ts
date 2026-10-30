import type { PagePackageSet, ServerPolicy } from '@washi/domain'

/** What the runtime lends a workspace: read again on every check, so a change lands at once. */
export interface LentServer {
  policy: () => ServerPolicy
  pagePackages?: () => PagePackageSet
}
