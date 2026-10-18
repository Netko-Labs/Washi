import { create } from 'zustand'
import type { SourceState } from './types'
import { checkSource } from './utils'

/** The page's WSX as text, while the editor is in source mode. */
export const useSourceStore = create<SourceState>((set) => ({
  draft: '',
  diagnostics: [],
  savedSource: null,
  version: null,
  revision: 0,
  load: (source, version) =>
    set(({ revision }) => ({
      draft: source,
      diagnostics: [],
      savedSource: source,
      version,
      revision: revision + 1,
    })),
  type: (draft) => set({ draft, diagnostics: checkSource(draft) }),
  absorb: (source, version) =>
    set(({ revision }) => ({
      draft: source,
      diagnostics: checkSource(source),
      savedSource: source,
      version,
      revision: revision + 1,
    })),
  markSaved: (savedSource, version) => set({ savedSource, version }),
}))
