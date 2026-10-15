import { IconSparkles } from '@tabler/icons-react'
import { initials } from '@washi/ui'
import { useEditorStore } from '@/components/page-editor'
import { type PagePresenceProps, usePresence } from './lib'

/** Teammates on the page, and Washi while it writes here — as Notion and Figma show the room. */
export function PagePresence({ sheetId }: PagePresenceProps) {
  const editing = useEditorStore((state) => state.editingId === sheetId)
  const people = usePresence(sheetId, editing)
  const washi = people.find((person) => person.agent)
  const team = people.filter((person) => !person.agent)
  if (people.length === 0) return null

  return (
    <div className="flex items-center gap-2" data-presence>
      {washi && (
        <span className="flex h-6 items-center gap-1 rounded-full bg-agent/10 px-2 text-[12px] text-agent">
          <IconSparkles className="size-3.5" />
          Washi is writing
        </span>
      )}
      <span className="flex -space-x-1.5">
        {team.map((person) => (
          <span
            key={person.id}
            title={`${person.name}${person.editing ? ' · editing' : ''}`}
            className={`grid size-6 place-items-center rounded-full border-2 border-background bg-primary font-semibold text-[9px] text-primary-foreground ${
              person.editing ? 'ring-2 ring-agent' : ''
            }`}
          >
            {initials(person.name)}
          </span>
        ))}
      </span>
    </div>
  )
}
