import { IconSearch } from '@tabler/icons-react'
import { useState } from 'react'
import { type EnabledModelsCardProps, RECOMMENDED } from '../lib'
import { SettingsCard } from '../shared/card'
import { ModelSwitch } from './model-switch'

const SHOWN = 30

/**
 * What the composer's model chip offers the team. Nothing picked means the recommended three;
 * the first switch turns that implicit list into an explicit one.
 */
export function EnabledModelsCard({ models, provider, enabled, onChange }: EnabledModelsCardProps) {
  const [term, setTerm] = useState('')
  if (!provider) return null

  const own = models.filter((model) => model.provider === provider)
  const recommended = (RECOMMENDED[provider] ?? []).flatMap((pick) =>
    own.filter((model) => model.id === pick.id),
  )
  const current = enabled ?? recommended.map((model) => ({ id: model.id, name: model.name }))
  const isOn = (id: string) => current.some((model) => model.id === id)
  const needle = term.trim().toLowerCase()
  const shown = own
    .filter((model) => !needle || `${model.name} ${model.id}`.toLowerCase().includes(needle))
    .slice(0, SHOWN)

  const toggle = (id: string, name: string) =>
    void onChange(
      isOn(id) ? current.filter((model) => model.id !== id) : [...current, { id, name }],
    )

  return (
    <SettingsCard
      title="Models the team can pick"
      desc="What the model chip under the ask offers. A conversation can switch between these."
      tag={{ label: `${current.length} on`, tone: current.length > 0 ? 'ok' : 'off' }}
    >
      <div className="flex items-center gap-2 border-border border-b px-4">
        <IconSearch className="size-3.5 text-muted-foreground" />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={`Search ${own.length} models…`}
          aria-label="Search models"
          className="h-10 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        {enabled && (
          <button
            type="button"
            onClick={() => void onChange(null)}
            className="shrink-0 text-[12px] text-muted-foreground hover:text-foreground"
          >
            Back to recommended
          </button>
        )}
      </div>
      <ul className="max-h-[420px] overflow-y-auto">
        {shown.map((model) => (
          <ModelSwitch
            key={model.id}
            model={model}
            isOn={isOn(model.id)}
            isRecommended={recommended.some((pick) => pick.id === model.id)}
            onToggle={() => toggle(model.id, model.name)}
          />
        ))}
        {shown.length === 0 && (
          <li className="px-4 py-4 text-[13px] text-muted-foreground">
            {own.length === 0 ? 'Loading models…' : 'Nothing matches that.'}
          </li>
        )}
      </ul>
    </SettingsCard>
  )
}
