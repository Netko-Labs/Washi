import { useState } from 'react'
import { styled, useExprValue } from '../lib'
import type { BlockProps, RevealProps, ShowProps, TabsProps } from '../lib/types'
import { useSheetState } from '../state'

export function Show({ expr, children }: ShowProps) {
  const value = useExprValue(expr)
  return value === true ||
    (typeof value === 'number' && value !== 0) ||
    (typeof value === 'string' && value !== '')
    ? children
    : null
}

export function Tabs({ labels, state, children, ...rest }: TabsProps) {
  const sheet = useSheetState()
  const [internal, setInternal] = useState(0)
  const active = state
    ? Math.max(0, labels.indexOf(String(sheet.values[state] ?? labels[0])))
    : internal
  const select = (index: number) =>
    state ? sheet.set(state, labels[index] ?? null) : setInternal(index)
  const panels = Array.isArray(children) ? children : [children]

  return (
    <div {...styled(rest, 'wsx-tabs')}>
      <div className="wsx-tabs-list" role="tablist">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            className="wsx-tabs-tab"
            aria-selected={index === active}
            onClick={() => select(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{panels[active]}</div>
    </div>
  )
}

export function Tab({ children, ...rest }: BlockProps) {
  return <div {...styled(rest, 'wsx-tab')}>{children}</div>
}

export function Reveal({ label, state, children, ...rest }: RevealProps) {
  const sheet = useSheetState()
  const open = state ? sheet.values[state] === true : undefined
  return (
    <details
      {...styled(rest, 'wsx-reveal')}
      open={open}
      onToggle={(event) => state && sheet.set(state, event.currentTarget.open)}
    >
      <summary>{label}</summary>
      <div className="wsx-reveal-body">{children}</div>
    </details>
  )
}
