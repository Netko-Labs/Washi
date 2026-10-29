import { useState } from 'react'
import { SettingsCard } from '../shared/card'
import { CopyLine } from './copy-line'
import { type AgentsSectionProps, claudeCommand, mcpUrl, useAccessTokens } from './lib'
import { TokenRow } from './token-row'

/** An outside agent — Claude Code, any MCP client — works here as you, with a token you make. */
export function AgentsSection({ workspaceId }: AgentsSectionProps) {
  const access = useAccessTokens()
  const [name, setName] = useState('')
  const url = mcpUrl(window.location.origin, workspaceId)

  if (!access.isAvailable) {
    return (
      <p className="text-[13.5px] text-muted-foreground">This server takes no outside agents.</p>
    )
  }

  return (
    <div className="grid gap-4">
      <SettingsCard
        title="Connect an agent"
        desc="It reads what you can read here and writes as you — pages, tables and comments, each in its history. Nothing it does reaches past this workspace."
      >
        <div className="grid gap-3 px-5 py-4">
          <CopyLine label="MCP address" value={url} />
          {access.issued ? (
            <>
              <CopyLine label="Claude Code" value={claudeCommand(url, access.issued.token)} />
              <p className="text-[12.5px] text-muted-foreground">
                This is the only time “{access.issued.info.name}” is shown. Keep it where the agent
                runs; revoke it below if it leaks.{' '}
                <button type="button" className="underline" onClick={access.dismiss}>
                  Done
                </button>
              </p>
            </>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              Make a token below; its command to paste into your terminal shows here.
            </p>
          )}
        </div>
      </SettingsCard>
      <SettingsCard title="Your tokens" desc="Each acts as you, in this workspace only.">
        {access.tokens.length > 0 && (
          <ul>
            {access.tokens.map((token) => (
              <TokenRow
                key={token.id}
                token={token}
                onRevoke={() => void access.revoke(token.id)}
              />
            ))}
          </ul>
        )}
        <form
          className="flex gap-2 border-border border-t px-5 py-3 first:border-t-0"
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) void access.create(name.trim()).then((made) => made && setName(''))
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Name it after the agent — “Claude Code on my laptop”"
            maxLength={60}
            className="h-[34px] min-w-0 flex-1 rounded-[10px] border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-[34px] shrink-0 rounded-[10px] bg-foreground px-3.5 font-medium text-[12.5px] text-background disabled:opacity-40"
          >
            Make a token
          </button>
        </form>
        {access.error && (
          <p role="alert" className="px-5 pb-3 text-[12.5px] text-destructive">
            {access.error}
          </p>
        )}
      </SettingsCard>
    </div>
  )
}
