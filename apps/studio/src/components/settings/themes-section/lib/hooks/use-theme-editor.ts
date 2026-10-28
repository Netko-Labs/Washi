import { isThemeRefused, THEMES, type ThemeId, themeChecks } from '@washi/paper/registry'
import { useThemesStore } from '@washi/ui'
import { useMemo, useState } from 'react'
import type { EditorDraft, ThemeEditorState } from '../types'

/** The draft, the mode on screen, and what its contrast says — recomputed as a colour moves. */
export function useThemeEditor(initial: EditorDraft): ThemeEditorState {
  const [draft, setDraft] = useState(initial)
  const [mode, setMode] = useState<ThemeEditorState['mode']>('light')
  const checks = useMemo(() => themeChecks(draft), [draft])

  return {
    draft,
    mode,
    setMode,
    checks,
    isRefused: isThemeRefused(checks) || draft.name.trim() === '',
    setName: (name) => setDraft((current) => ({ ...current, name })),
    setToken: (token, color) =>
      setDraft((current) => ({
        ...current,
        [mode]: { ...current[mode], [token]: color },
        filled: current.filled.filter((entry) => entry !== `${mode} ${token}`),
      })),
    startFrom: (key) => {
      const pair = Object.hasOwn(THEMES, key)
        ? THEMES[key as ThemeId]
        : useThemesStore.getState().pairOf(key)
      if (pair)
        setDraft((current) => ({ ...current, light: pair.light, dark: pair.dark, filled: [] }))
    },
  }
}
