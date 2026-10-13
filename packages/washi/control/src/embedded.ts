/**
 * Embedded-only entry. The desktop imports from here, never from the package
 * root: the root pulls in Better Auth and a Postgres driver, and neither has
 * any business inside a local app that has no accounts and no control plane.
 */
export { createEmbeddedControlPlane, type EmbeddedControlPlaneOptions } from './lib/embedded'
