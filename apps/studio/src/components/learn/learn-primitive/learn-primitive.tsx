import { placementOf, propRows, SPECIMENS, SUMMARIES, specimenSource } from '@washi/paper/book'
import { LearnProps } from '../learn-props'
import { LearnSheet } from '../learn-sheet'
import { anchorOf, CHILD_POLICY_LABELS, type LearnPrimitiveProps } from '../lib'

export function LearnPrimitive({ name }: LearnPrimitiveProps) {
  const placement = placementOf(name)
  const rules = [
    CHILD_POLICY_LABELS[placement.children],
    placement.within.length > 0 && `Only inside ${placement.within.join(' or ')}`,
    placement.unique && 'Once per page',
    placement.noNest && 'Never inside itself',
  ].filter((rule): rule is string => Boolean(rule))

  return (
    <article id={anchorOf(name)} className="learn-primitive scroll-mt-6 space-y-3">
      <header>
        <h3 className="font-semibold text-[18px]">{name}</h3>
        <p className="text-[14px] text-muted-foreground">{SUMMARIES[name]}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {rules.map((rule) => (
            <li
              key={rule}
              className="rounded-full border border-border px-2 py-0.5 text-[11.5px] text-muted-foreground"
            >
              {rule}
            </li>
          ))}
        </ul>
      </header>
      {SPECIMENS[name] && (
        <LearnSheet
          source={specimenSource({
            name,
            knobs: {},
            childrenText: null,
            theme: 'washi',
            feel: 'note',
            accent: 'accent',
          })}
        />
      )}
      <LearnProps rows={propRows(name)} />
    </article>
  )
}
