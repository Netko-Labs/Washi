import type { WorkspaceTheme } from '../../entities/themes'

/** Two themes named alike look alike in every picker, so a name is the workspace's once. */
export function themeNameClash(
  themes: Pick<WorkspaceTheme, 'id' | 'name'>[],
  name: string,
  exceptId: string | null = null,
): string | null {
  const wanted = name.trim().toLowerCase()
  const taken = themes.find(
    (theme) => theme.id !== exceptId && theme.name.trim().toLowerCase() === wanted,
  )
  return taken
    ? `This workspace already has a theme named “${taken.name}” — pick another name`
    : null
}
