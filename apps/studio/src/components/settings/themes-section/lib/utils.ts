import type { WorkspaceTheme } from '@washi/domain'
import { THEMES, themeFile } from '@washi/paper/registry'
import type { EditorDraft } from './types'
import { TOKEN_GROUPS } from './values'

export const blankDraft = (): EditorDraft => ({
  id: null,
  name: '',
  light: THEMES.washi.light,
  dark: THEMES.washi.dark,
  filled: [],
})

export const draftOf = (theme: WorkspaceTheme): EditorDraft => ({
  id: theme.id,
  name: theme.name,
  light: theme.light,
  dark: theme.dark,
  filled: [],
})

/** A `.washi-theme.json` the browser saves; Import reads it back. */
export function downloadTheme(theme: WorkspaceTheme): void {
  const blob = new Blob([themeFile(theme)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${theme.slug}.washi-theme.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

const LABELS = new Map(TOKEN_GROUPS.flatMap((group) => group.tokens.map((t) => [t.key, t.label])))

/** `dark mutedBg` → `dark quiet fill`, the names the editor shows. */
export const filledNames = (filled: string[]) =>
  filled
    .map((entry) => {
      const [mode, key = ''] = entry.split(' ')
      return `${mode} ${(LABELS.get(key as never) ?? key).toLowerCase()}`
    })
    .join(', ')
