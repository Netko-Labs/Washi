import { useRef } from 'react'
import { type SettingsTabsProps, useSlidingPill } from './lib'

const EASE = 'duration-[260ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none'

/** Whose settings, as pills; that group's sections, as tabs under them. */
export function SettingsTabs({ groups, current, onTab }: SettingsTabsProps) {
  const pills = useRef<HTMLDivElement>(null)
  const group = groups.find((each) => each.sections.some((section) => section.key === current))
  const pill = useSlidingPill(pills, group?.label ?? '')

  return (
    <div className="mb-7">
      <div
        ref={pills}
        role="tablist"
        aria-label="Settings for"
        className="relative inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl bg-foreground/[0.045] p-[3px]"
      >
        {pill && (
          <span
            aria-hidden
            className={`absolute top-[3px] bottom-[3px] rounded-[9px] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--border)] transition-[left,width] ${EASE}`}
            style={{ left: pill.left, width: pill.width }}
          />
        )}
        {groups.map((each) => (
          <button
            key={each.label}
            type="button"
            role="tab"
            data-key={each.label}
            aria-selected={each === group}
            onClick={() => each.sections[0] && onTab(each.sections[0].key)}
            className={`relative h-8 shrink-0 rounded-[9px] px-3.5 text-[13px] transition-colors ${EASE} ${
              each === group
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {each.label}
          </button>
        ))}
      </div>

      {group && group.sections.length > 1 && (
        <div className="mt-4 flex gap-1 overflow-x-auto border-border border-b">
          {group.sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onTab(key)}
              aria-current={key === current ? 'page' : undefined}
              className={`-mb-px flex h-9 shrink-0 items-center gap-[7px] border-b-2 px-3 font-medium text-[13px] transition-colors ${
                key === current
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
