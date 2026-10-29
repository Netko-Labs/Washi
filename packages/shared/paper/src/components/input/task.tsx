import { useState } from 'react'
import { styled } from '../../lib'
import type { TaskProps } from '../../lib/types'
import { usePaperHost } from '../../provider'
import { useRow } from '../../state'

export function Task({ row, done, field, children, ...rest }: TaskProps) {
  const host = usePaperHost()
  const scoped = useRow()
  const rowId = row ?? (scoped?.id as string | undefined)
  const [checked, setChecked] = useState(done ?? scoped?.[field ?? 'done'] === true)
  return (
    <label
      {...styled(rest, 'wsx-task')}
      data-done={checked || undefined}
      data-toggle={field ? '' : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!rowId}
        onChange={async (event) => {
          setChecked(event.target.checked)
          if (rowId) await host.toggleTask(rowId, event.target.checked, field)
        }}
      />
      <span>{children}</span>
    </label>
  )
}
