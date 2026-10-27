import type { ModelSwitchProps } from '../lib'

/** A model as a row with a switch: name and id, its price, and whether the team may pick it. */
export function ModelSwitch({ model, isOn, isRecommended, onToggle }: ModelSwitchProps) {
  return (
    <li className="flex items-center gap-3 border-border border-t px-5 py-3 first:border-t-0">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13px]">
          <span className="truncate">{model.name}</span>
          {isRecommended && (
            <span className="shrink-0 rounded-full bg-primary/12 px-1.5 py-px font-medium text-[10.5px] text-primary">
              Recommended
            </span>
          )}
        </span>
        <span className="block truncate font-mono text-[11px] text-muted-foreground">
          {model.id}
          {model.inputPerMTok != null && ` · $${model.inputPerMTok} · $${model.outputPerMTok} /M`}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={`Offer ${model.name}`}
        onClick={onToggle}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isOn ? 'bg-primary' : 'bg-foreground/15'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${isOn ? 'translate-x-4' : ''}`}
        />
      </button>
    </li>
  )
}
