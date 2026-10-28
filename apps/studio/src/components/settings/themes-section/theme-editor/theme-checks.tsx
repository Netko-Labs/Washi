import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react'
import type { ThemeChecksProps } from '../lib'

const MARK = {
  pass: <IconCheck className="size-3.5 text-[#5e7d5a]" />,
  warn: <IconAlertTriangle className="size-3.5 text-[#b7832a]" />,
  refuse: <IconX className="size-3.5 text-destructive" />,
}

/** Each pairing read as a ratio; a refused one holds Save, a warned one only says so. */
export function ThemeChecks({ checks }: ThemeChecksProps) {
  return (
    <ul className="grid gap-0.5">
      {checks.map((check) => (
        <li key={check.rule.label} className="flex items-center gap-2 text-[12.5px]">
          {MARK[check.verdict]}
          <span className="flex-1 text-muted-foreground">{check.rule.label}</span>
          <span
            className={`font-mono text-[11.5px] tabular-nums ${check.verdict === 'refuse' ? 'text-destructive' : ''}`}
            title={`wants ${check.rule.warn}:1, needs ${check.rule.refuse}:1`}
          >
            {check.ratio.toFixed(1)}:1
          </span>
        </li>
      ))}
    </ul>
  )
}
