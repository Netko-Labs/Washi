import { useTreeStore } from './lib'

export function TreeNotice() {
  const notice = useTreeStore((state) => state.notice)
  if (!notice) return null
  return (
    <p role="status" className="px-2 py-1 text-[12px] text-destructive">
      {notice}
    </p>
  )
}
