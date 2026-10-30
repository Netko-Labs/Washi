import { Link } from '@tanstack/react-router'
import { Mascot } from '@washi/ui'
import type { ChatMissingProps } from './lib'

/** A chat id that names nothing this reader has: deleted, mistyped, or someone else's (D67). */
export function ChatMissing({ workspaceId }: ChatMissingProps) {
  return (
    <div className="paper-canvas grid flex-1 place-items-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot face="sad" motion="sway" size={110} className="mascot-motion" />
        <div className="font-serif text-[23px] italic">This chat isn't here</div>
        <p className="max-w-72 text-[14px] text-muted-foreground leading-relaxed">
          It was deleted, or it is someone else's.
        </p>
        <Link
          to="/w/$workspaceId/chats"
          params={{ workspaceId }}
          className="mt-1 rounded-xl border border-border bg-background px-5 py-2.5 font-medium text-[14px] hover:bg-accent"
        >
          All chats
        </Link>
      </div>
    </div>
  )
}
