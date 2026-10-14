import { WsxView } from '@washi/paper'
import type { LockedBlockProps } from './lib'

/** Washi's own blocks — tables, charts, boards — stay whole: move or delete them, ask Washi to change them. */
export function LockedBlock({ block, rootProps }: LockedBlockProps) {
  return (
    <div
      className="page-editor-locked rounded-lg ring-1 ring-transparent ring-offset-4 ring-offset-transparent hover:ring-border"
      title="Washi made this — ask Washi to change it"
    >
      <WsxView
        root={{ kind: 'element', name: 'Sheet', props: rootProps, children: [block.node] }}
      />
    </div>
  )
}
