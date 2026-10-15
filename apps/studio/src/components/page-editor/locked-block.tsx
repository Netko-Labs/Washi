import { WsxView } from '@washi/paper'
import type { LockedBlockProps } from './lib'

/** Live blocks — databases, charts, boards — move and delete whole; their rows edit in place. */
export function LockedBlock({ block, rootProps }: LockedBlockProps) {
  return (
    <div
      className="page-editor-locked rounded-lg ring-1 ring-transparent ring-offset-4 ring-offset-transparent hover:ring-border"
      title="A live block: move or delete it here"
    >
      <WsxView
        root={{ kind: 'element', name: 'Sheet', props: rootProps, children: [block.node] }}
      />
    </div>
  )
}
