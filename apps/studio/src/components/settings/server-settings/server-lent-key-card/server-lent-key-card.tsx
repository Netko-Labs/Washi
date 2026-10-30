import { useState } from 'react'
import { KeyDialog } from '../../key-dialog'
import { PROVIDER_META } from '../../lib'
import { ProviderRow, SettingsCard } from '../../shared/card'
import { LENT_KEY_COPY, type ServerLentKeyCardProps } from '../lib'

/** One key the server lends every workspace without its own: Exa's for search, Unsplash's for photos. */
export function ServerLentKeyCard({ target, connected, onSave, onRemove }: ServerLentKeyCardProps) {
  const [open, setOpen] = useState(false)
  const copy = LENT_KEY_COPY[target]

  return (
    <>
      <SettingsCard
        title={copy.title}
        desc={copy.desc}
        tag={connected ? { label: copy.lent, tone: 'ok' } : { label: copy.none, tone: 'off' }}
      >
        <ProviderRow
          meta={PROVIDER_META[target]}
          connected={connected}
          onConnect={() => setOpen(true)}
          onRemove={() => void onRemove()}
        />
      </SettingsCard>
      {open && (
        <KeyDialog
          target={target}
          connected={connected}
          blurb={copy.blurb}
          onSave={onSave}
          onRemove={onRemove}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
