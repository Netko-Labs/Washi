import { IconX } from '@tabler/icons-react'
import { ANY_HOST } from '@washi/domain'
import { useState } from 'react'
import { SettingsCard } from '../../shared/card'
import { changedLine, HOST_LISTS, type HostListCardProps } from '../lib'

/** A host list: chips to remove, a field to add, a shortcut to `*`, the refusal in words. */
export function HostListCard({
  kind,
  hosts,
  onSave,
  isEditable = true,
  lastChange,
}: HostListCardProps) {
  const copy = HOST_LISTS[kind]
  const isAny = hosts.includes(ANY_HOST)
  const changed = changedLine(lastChange)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = async (next: string[]) => {
    const refused = await onSave(next)
    setError(refused)
    return refused === null
  }
  const add = async () => {
    if (draft.trim() && (await save([...hosts, draft]))) setDraft('')
  }

  return (
    <SettingsCard title={copy.title} desc={copy.desc}>
      {hosts.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 px-4 pt-3">
          {hosts.map((host) => (
            <li
              key={host}
              className="flex items-center gap-1 rounded-full border border-border py-0.5 pr-1 pl-2.5 font-mono text-[12.5px]"
            >
              {host}
              {isEditable && (
                <button
                  type="button"
                  aria-label={`Remove ${host}`}
                  onClick={() => void save(hosts.filter((each) => each !== host))}
                  className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive"
                >
                  <IconX className="size-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 pt-3 text-[13px] text-muted-foreground">{copy.empty}</p>
      )}
      {isEditable && (
        <form
          className="flex gap-2 px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault()
            void add()
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={copy.placeholder}
            aria-label={copy.title}
            className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-9 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13px] hover:bg-accent disabled:opacity-50"
          >
            Allow
          </button>
        </form>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-border border-t px-4 py-3">
        <p
          className={`min-w-0 flex-1 text-[12.5px] ${isAny ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {copy.anyWarning}
          {changed && <span className="block text-muted-foreground">{changed}</span>}
        </p>
        {isEditable && !isAny && (
          <button
            type="button"
            onClick={() => void save([...hosts, ANY_HOST])}
            className="h-8 shrink-0 rounded-xl border border-border px-3 font-semibold text-[12.5px] hover:bg-accent"
          >
            Allow every site (*)
          </button>
        )}
      </div>
      {error && (
        <p className="border-border border-t px-4 py-3 text-[13px] text-destructive">{error}</p>
      )}
    </SettingsCard>
  )
}
