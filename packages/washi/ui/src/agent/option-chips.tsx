import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { useState } from 'react'
import { api } from '../api'
import { useAgentStore } from '../stores'
import { EFFORTS, LOCAL_MODELS, type OptionChipsProps, offeredModels } from './lib'

const CHIP =
  'flex h-6 max-w-[150px] items-center gap-1 rounded-full border border-border bg-card px-2 font-medium text-[11px] hover:bg-accent'
const MENU =
  'absolute bottom-full left-0 z-[60] mb-1.5 w-[220px] rounded-xl border border-border bg-popover p-[5px] text-popover-foreground shadow-[0_12px_36px_rgb(0_0_0/0.18)]'
const ROW =
  'flex w-full items-center gap-2 rounded-lg px-2 py-[6px] text-left text-[12.5px] hover:bg-accent'

/** Model and effort, per conversation, starting from the workspace defaults. */
export function OptionChips({ session, inference }: OptionChipsProps) {
  const [open, setOpen] = useState<'model' | 'effort' | null>(null)
  const local = inference?.active === 'local_cli'
  const models = local ? LOCAL_MODELS : offeredModels(inference)
  const currentModel = local ? inference?.localModel : session?.model
  const modelLabel = local
    ? (LOCAL_MODELS.find((m) => m.id === (currentModel ?? 'default'))?.label ?? 'Default')
    : (models.find((m) => m.id === currentModel)?.label ??
      (currentModel ? currentModel : 'Default model'))
  const effort = session?.effort ?? null
  const effortLabel = EFFORTS.find((e) => e.id === effort)?.label ?? 'Balanced'

  const pickModel = (id: string | null) => {
    setOpen(null)
    if (local)
      void api.agents.setLocalModel.mutate({
        model: (id ?? 'default') as 'default' | 'opus' | 'sonnet' | 'haiku',
      })
    else void useAgentStore.getState().setSessionOptions({ model: id })
  }

  if (inference?.active === null) {
    return (
      <span className="truncate font-mono text-[11px] text-muted-foreground">
        Asleep · see Settings
      </span>
    )
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(open === 'model' ? null : 'model')}
          aria-haspopup="menu"
          aria-expanded={open === 'model'}
          className={CHIP}
          title={
            local
              ? `Claude Code${inference?.plan ? ` · ${inference.plan}` : ''}`
              : 'The model this conversation thinks with'
          }
        >
          <span className="truncate">◆ {modelLabel}</span>
          <IconChevronDown className="size-3 shrink-0 opacity-70" />
        </button>
        {open === 'model' && (
          <div role="menu" className={MENU}>
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                role="menuitem"
                onClick={() => pickModel(model.id)}
                className={ROW}
              >
                <span className="min-w-0 flex-1">
                  <span className="block">{model.label}</span>
                  {model.desc && (
                    <span className="block text-[11px] text-muted-foreground">{model.desc}</span>
                  )}
                </span>
                {(local ? (currentModel ?? 'default') : currentModel) === model.id && (
                  <IconCheck className="size-3.5" />
                )}
              </button>
            ))}
            {!local && (
              <button
                type="button"
                role="menuitem"
                onClick={() => pickModel(null)}
                className={`${ROW} text-muted-foreground`}
              >
                The workspace default
                {!currentModel && <IconCheck className="ml-auto size-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(open === 'effort' ? null : 'effort')}
          aria-haspopup="menu"
          aria-expanded={open === 'effort'}
          className={`${CHIP} text-muted-foreground`}
          title="How hard Washi thinks in this conversation"
        >
          {effortLabel}
          <IconChevronDown className="size-3 shrink-0 opacity-70" />
        </button>
        {open === 'effort' && (
          <div role="menu" className={MENU}>
            {EFFORTS.map((choice) => (
              <button
                key={choice.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(null)
                  void useAgentStore.getState().setSessionOptions({ effort: choice.id })
                }}
                className={ROW}
              >
                <span className="min-w-0 flex-1">
                  <span className="block">{choice.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{choice.desc}</span>
                </span>
                {(effort ?? 'balanced') === choice.id && <IconCheck className="size-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
