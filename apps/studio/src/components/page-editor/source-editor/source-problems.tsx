import { IconAlertTriangle, IconCircleX } from '@tabler/icons-react'
import { useSourceStore } from './lib'

export function SourceProblems() {
  const diagnostics = useSourceStore((state) => state.diagnostics)
  if (diagnostics.length === 0) return null

  return (
    <ul className="mt-3 space-y-1 rounded-xl border border-border bg-card p-2 text-[12.5px]">
      {diagnostics.map(({ severity, message, path, line, column }) => (
        <li
          key={`${severity}:${path ?? ''}:${line ?? ''}:${column ?? ''}:${message}`}
          className="flex items-start gap-2 rounded-lg px-2 py-1"
        >
          {severity === 'error' ? (
            <IconCircleX className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          ) : (
            <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1">{message}</span>
          <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground">
            {line !== undefined ? `${line}:${column ?? 1}` : path}
          </span>
        </li>
      ))}
    </ul>
  )
}
