import { useEffect, useState } from 'react'
import { useSession } from '@/integrations/auth'
import { readRecentEmoji, withRecent, writeRecentEmoji } from '../utils'

/** This person's last picks on this device, newest first: an emoji or a `file:<id>`. */
export function useRecentEmoji() {
  const { data: session } = useSession()
  const personId = session?.user.id ?? 'local'
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => setRecent(readRecentEmoji(personId)), [personId])

  const remember = (value: string) => {
    const next = withRecent(readRecentEmoji(personId), value)
    writeRecentEmoji(personId, next)
    setRecent(next)
  }

  return { recent, remember }
}
