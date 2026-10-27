export { DOCK_KEY_PREFIX, DRAWER_EDGE, DRAWER_SWIPE, FOLD_KEY_PREFIX } from './constants'
export { enterWorkspace } from './enter-workspace'
export { useDock } from './hooks/use-dock'
export { useFold } from './hooks/use-fold'
export { useRouteTab } from './hooks/use-route-tab'
export { useTabNavigation } from './hooks/use-tab-navigation'
export { useWorkspaceBoot } from './hooks/use-workspace-boot'
export { loadWorkspace } from './load-workspace'
export { useShellStore } from './shell-store'
export type {
  AgentLayerProps,
  FoldState,
  MobileDrawerProps,
  ShellState,
  WorkspaceShellProps,
} from './types'
export { pathFor, readDock, readFold, writeDock, writeFold } from './utils'
