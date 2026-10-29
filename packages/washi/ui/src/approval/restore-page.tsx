import { IconRestore } from '@tabler/icons-react'
import { type RestorePageProps, useRestorePage } from './lib'

const SAID = { restored: 'Restored', gone: 'No longer in the trash' } as const

export function RestorePage({ id }: RestorePageProps) {
  const { state, restore } = useRestorePage(id)
  if (state === 'restored' || state === 'gone') {
    return <span className="mt-1 block px-1 text-[11px] text-muted-foreground">{SAID[state]}</span>
  }
  return (
    <button
      type="button"
      disabled={state === 'busy'}
      onClick={() => void restore()}
      className="mt-1 inline-flex h-6 items-center gap-1 rounded-full border border-border px-2 font-medium text-[11px] text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60"
    >
      <IconRestore className="size-3" />
      Restore
    </button>
  )
}
