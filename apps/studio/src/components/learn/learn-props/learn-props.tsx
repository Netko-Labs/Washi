import type { LearnPropsProps } from '../lib'

/** Its own props in a table; the look props every primitive shares in one line under it. */
export function LearnProps({ rows }: LearnPropsProps) {
  const own = rows.filter((row) => !row.styled)
  const shared = rows.filter((row) => row.styled).map((row) => row.key)

  return (
    <div className="text-[13px]">
      {own.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-muted-foreground uppercase tracking-wider">
              <th className="w-[160px] py-1.5 pr-3 font-semibold">Prop</th>
              <th className="py-1.5 font-semibold">Takes</th>
            </tr>
          </thead>
          <tbody>
            {own.map((row) => (
              <tr key={row.key} className="border-border border-t align-top">
                <td className="py-1.5 pr-3">
                  <code className="font-mono text-[12px]">{row.key}</code>
                  {row.required && (
                    <span className="ml-1.5 rounded bg-accent px-1 py-px text-[10px] text-muted-foreground">
                      required
                    </span>
                  )}
                </td>
                <td className="py-1.5 text-muted-foreground">{row.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {shared.length > 0 && (
        <p className="mt-2 text-[12px] text-muted-foreground">
          Also takes the shared look props: <code className="font-mono">{shared.join(' ')}</code>
        </p>
      )}
    </div>
  )
}
