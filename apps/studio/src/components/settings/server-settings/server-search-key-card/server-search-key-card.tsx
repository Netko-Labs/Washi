import { useState } from 'react'
import { KeyDialog } from '../../key-dialog'
import { PROVIDER_META } from '../../lib'
import { ProviderRow, SettingsCard } from '../../shared/card'
import { SEARCH_KEY_COPY, type ServerSearchKeyCardProps } from '../lib'

/** The server's own Exa key: what a workspace without one searches the web with. */
export function ServerSearchKeyCard({ searchKey, onSave, onRemove }: ServerSearchKeyCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <SettingsCard
        title={SEARCH_KEY_COPY.title}
        desc={SEARCH_KEY_COPY.desc}
        tag={
          searchKey
            ? { label: SEARCH_KEY_COPY.lent, tone: 'ok' }
            : { label: SEARCH_KEY_COPY.none, tone: 'off' }
        }
      >
        <ProviderRow
          meta={PROVIDER_META.exa}
          connected={searchKey}
          onConnect={() => setOpen(true)}
          onRemove={() => void onRemove()}
        />
      </SettingsCard>
      {open && (
        <KeyDialog
          target="exa"
          connected={searchKey}
          blurb={SEARCH_KEY_COPY.blurb}
          onSave={onSave}
          onRemove={onRemove}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
