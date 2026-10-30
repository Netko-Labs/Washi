import { acceptFor, uploadRefusal } from '@washi/domain'
import { hostUploadFile } from '@washi/ui'
import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import { api } from '@/integrations/trpc'
import { useEditorStore } from '../editor-store'
import type { LockedBlock, UploadChoice } from '../types'
import { filesOf, pickFiles, terminalPath } from '../utils'

/**
 * A Terminal's files while its page is edited: an upload stored now, or one already stored,
 * lands in `files` under its own name; ✕ takes it back off. The upload itself stays.
 */
export function useTerminalFiles(block: LockedBlock) {
  const root = useRef<HTMLDivElement>(null)
  const [isOpen, setOpen] = useState(false)
  const [recent, setRecent] = useState<UploadChoice[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useDismiss(root, isOpen, () => setOpen(false))
  const files = filesOf(block.node)

  const write = (change: (files: Record<string, string>) => Record<string, string>) => {
    const { blocks, replaceInBlock } = useEditorStore.getState()
    const current = blocks.find((each) => each.id === block.id) ?? block
    if (current.kind !== 'locked') return
    const { files: _files, ...props } = current.node.props
    const next = change(filesOf(current.node))
    const node = {
      ...current.node,
      props: Object.keys(next).length ? { ...props, files: next } : props,
    }
    replaceInBlock(block.id, current.node, node)
  }

  const attach = (upload: UploadChoice) => {
    write((now) => ({ ...now, [terminalPath(upload.name, now)]: `file:${upload.id}` }))
    setOpen(false)
  }

  const detach = (path: string) =>
    write((now) => Object.fromEntries(Object.entries(now).filter(([each]) => each !== path)))

  const toggle = () => {
    setError(null)
    setOpen(!isOpen)
    if (isOpen) return
    api.files.recent
      .query({ limit: 20 })
      .then(setRecent)
      .catch(() => setRecent([]))
  }

  const upload = async () => {
    setOpen(false)
    const [file] = await pickFiles(acceptFor('file'))
    if (!file) return
    try {
      const caps = await api.files.caps.query().catch(() => undefined)
      const refused = uploadRefusal(file.type, file.size, 'file', caps)
      if (refused) throw new Error(refused)
      const send = hostUploadFile()
      if (!send) throw new Error('this app stores no files')
      const stored = await send(file)
      attach({ id: stored.id, name: file.name, size: file.size })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return { root, files, isOpen, recent, error, toggle, upload, attach, detach }
}
