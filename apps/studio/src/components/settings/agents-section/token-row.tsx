import { type TokenRowProps, whenLabel } from './lib'

export function TokenRow({ token, onRevoke }: TokenRowProps) {
  return (
    <li className="flex items-center gap-3 border-border border-t px-5 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[13.5px]">{token.name}</p>
        <p className="text-[12.5px] text-muted-foreground">
          <span className="font-mono">…{token.last4}</span> · made {whenLabel(token.createdAt)} ·
          used {whenLabel(token.lastUsedAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRevoke}
        className="h-8 shrink-0 rounded-[10px] border border-border px-3 text-[12.5px] hover:bg-accent hover:text-destructive"
      >
        Revoke
      </button>
    </li>
  )
}
