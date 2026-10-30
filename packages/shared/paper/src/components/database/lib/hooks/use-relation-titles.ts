import { useEffect, useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { RelationTitles } from '../types'
import { relationChoices } from '../utils'

/** Every relation target a view points at, each read once — never once per cell. */
export function useRelationTitles(targets: string[]): RelationTitles {
  const host = usePaperHost()
  const { version } = useData()
  const [titles, setTitles] = useState<RelationTitles>({})
  const key = [...new Set(targets)].sort().join(',')

  useEffect(() => {
    if (!key) return
    let alive = true
    const names = key.split(',')
    Promise.all(names.map((name) => relationChoices(host, name))).then((lists) => {
      if (alive) setTitles(Object.fromEntries(names.map((name, at) => [name, lists[at] ?? null])))
    })
    return () => {
      alive = false
    }
  }, [host, key, version])

  return titles
}
