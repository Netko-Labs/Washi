import { useEffect, useState } from 'react'
import { api } from '../../../api'
import { setAutoApprove } from '../utils'

export function useAutoApprove() {
  const [on, setOn] = useState<boolean | null>(null)

  useEffect(() => {
    void api.agents.autoApprove
      .query()
      .then((state) => setOn(state.on))
      .catch(() => setOn(null))
  }, [])

  const toggle = async () => {
    if (on === null) return
    setOn(await setAutoApprove(!on))
  }

  return { on, toggle }
}
