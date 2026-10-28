import { type ScriptCodeProps, useScriptCode } from './lib'

/** The script's own code, typed in place; a line under it says whether it compiles. */
export function ScriptCode({ block }: ScriptCodeProps) {
  const { host, check } = useScriptCode(block)
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background font-mono">
      <div ref={host} className="max-h-[480px] overflow-auto" />
      <p
        className={`border-border border-t px-3 py-1.5 font-sans text-[12px] ${
          check.status === 'refused' ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        {check.status === 'checking' && 'Checking…'}
        {check.status === 'ok' && 'Compiles · saved with the page'}
        {check.status === 'refused' && `Not kept yet — ${check.error}`}
      </p>
    </div>
  )
}
