import type { WorkspaceLook, WorkspaceLookWrite } from '@washi/domain'
import { coverKeyProblem, sheetIconProblem } from '@washi/paper/registry'
import { getAppMeta, setAppMeta, type Workspace } from '@washi/repository'
import { WORKSPACE_LOOK_KEY } from './constants'
import { WorkspaceThemeError } from './service'

const NONE: WorkspaceLook = { icon: null, cover: null }

/** What a page with no icon or cover of its own wears (D139); nothing until a steward sets it. */
export function workspaceLook(ws: Workspace): WorkspaceLook {
  const raw = getAppMeta(ws, WORKSPACE_LOOK_KEY)
  if (!raw) return NONE
  try {
    const kept = JSON.parse(raw) as Partial<WorkspaceLook>
    return {
      icon: typeof kept.icon === 'string' ? kept.icon : null,
      cover: typeof kept.cover === 'string' ? kept.cover : null,
    }
  } catch {
    return NONE
  }
}

/**
 * Sets the workspace's default icon and cover: a part left out keeps what it was, null clears it.
 * Each is checked as a page's own would be, and a miss names what would do. Who may is the
 * caller's to decide (owners and admins); no page source is touched.
 */
export function setWorkspaceLook(ws: Workspace, write: WorkspaceLookWrite): WorkspaceLook {
  const iconProblem = write.icon ? sheetIconProblem(write.icon) : null
  if (iconProblem) throw new WorkspaceThemeError(iconProblem)
  const coverProblem = write.cover ? coverKeyProblem(write.cover) : null
  if (coverProblem) throw new WorkspaceThemeError(coverProblem)
  const now = workspaceLook(ws)
  const next: WorkspaceLook = {
    icon: write.icon === undefined ? now.icon : write.icon,
    cover: write.cover === undefined ? now.cover : write.cover,
  }
  setAppMeta(ws, WORKSPACE_LOOK_KEY, JSON.stringify(next))
  return next
}
