import { useState } from 'react'
import type { ViewLocal, ViewSort } from '../types'
import { renamedHidden, renamedSort } from '../utils'

/** The reader's sort and hidden properties, held while the view is on screen — never saved. */
export function useViewLocal(): ViewLocal {
  const [sort, setSort] = useState<ViewSort | null>(null)
  const [hidden, setHidden] = useState<string[]>([])

  return {
    sort,
    hidden,
    sortBy: (column, direction) => setSort({ column, direction }),
    clearSort: () => setSort(null),
    hide: (column) => setHidden((now) => (now.includes(column) ? now : [...now, column])),
    show: (column) => setHidden((now) => now.filter((each) => each !== column)),
    rename: (from, to) => {
      setSort((now) => renamedSort(now, from, to))
      setHidden((now) => renamedHidden(now, from, to))
    },
  }
}
