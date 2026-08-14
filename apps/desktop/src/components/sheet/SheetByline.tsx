import { Mascot } from '@/components/mascot/Mascot'
import { initials, useViewStore } from '@/stores/view/view-store'

export function SheetByline({ editedLabel }: { editedLabel: string }) {
  const identity = useViewStore((state) => state.identity)

  return (
    <div className="flex items-center gap-2.5 border-border border-b bg-card px-8 pt-5 pb-4">
      <span
        className="grid size-7 place-items-center rounded-full font-semibold text-[10px]"
        style={{ backgroundColor: identity.color, color: '#fff6e4' }}
      >
        {initials(identity.name)}
      </span>
      <Mascot face="wink" size={26} />
      <span className="text-[12px] text-muted-foreground">
        Edited {editedLabel} · kept tidy by Washi
      </span>
    </div>
  )
}
