import { IconCheck } from '@tabler/icons-react'
import { usePeople } from '@/components/row-properties'
import type { SharePeopleProps } from './lib'

/** Who a private page opens for. Whoever is choosing stays in; the owner always reads it. */
export function SharePeople({ access, me, busy, onToggle }: SharePeopleProps) {
  const people = usePeople()

  return (
    <ul className="grid max-h-48 gap-px overflow-y-auto">
      {people.map((person) => {
        const on = access.includes(person.id) || person.id === me
        return (
          <li key={person.id}>
            <button
              type="button"
              disabled={busy || person.id === me}
              onClick={() => onToggle(person.id)}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span
                className={`grid size-4 shrink-0 place-items-center rounded border ${
                  on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                }`}
              >
                {on && <IconCheck className="size-3" />}
              </span>
              <span className="min-w-0 flex-1 truncate">{person.name}</span>
              {person.id === me && <span className="text-[11px] text-muted-foreground">you</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
