import { IconFile, IconFileText } from '@tabler/icons-react'
import { BUBBLE_PROSE, Markdown } from '@washi/ui'
import type { ChatPersonProps } from './lib'

export function ChatPerson({ block }: ChatPersonProps) {
  return (
    <div className="flex flex-col items-end gap-1.5" data-chat-person>
      {block.attachments.length > 0 && (
        <div className="flex max-w-[80%] flex-wrap justify-end gap-1.5">
          {block.attachments.map((ref) => (
            <span
              key={ref.id}
              className="flex h-7 items-center gap-1.5 rounded-xl border border-border px-2.5 text-[12.5px] text-muted-foreground"
            >
              {ref.kind === 'page' ? (
                <IconFileText className="size-3.5" />
              ) : (
                <IconFile className="size-3.5" />
              )}
              <span className="max-w-[200px] truncate">{ref.name}</span>
            </span>
          ))}
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-3xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed ${BUBBLE_PROSE}`}
      >
        <Markdown text={block.text} />
      </div>
    </div>
  )
}
