import { knobsFor, specimenChildren, specimenProps } from '@washi/paper/book'
import { paperRegistry } from '@washi/paper/registry'
import { useMemo } from 'react'
import { useBookStore } from '@/components/shared/book'
import { KnobField } from './knob-field'

function Heading({ children }: { children: string }) {
  return (
    <h2 className="pt-4 pb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
      {children}
    </h2>
  )
}

export function Knobs() {
  const book = useBookStore()
  const name = book.primitive
  const defs = useMemo(() => knobsFor(name), [name])
  const spec = paperRegistry.components[name]
  const props = specimenProps(name, book.knobs)
  const own = defs.filter((def) => !def.styled)
  const style = defs.filter((def) => def.styled)
  const children = specimenChildren(name, book.childrenText)
  const disabled = book.view === 'scratch'

  return (
    <aside
      className={`min-h-0 overflow-y-auto border-border border-l bg-card px-4 pb-6 ${disabled ? 'opacity-50' : ''}`}
      aria-disabled={disabled}
    >
      <div className="flex items-baseline justify-between pt-4">
        <h1 className="font-serif text-[22px]">{name}</h1>
        <button
          type="button"
          onClick={book.reset}
          className="text-[12px] text-muted-foreground hover:text-foreground"
        >
          reset all
        </button>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        children <b className="text-foreground">{spec?.children ?? 'none'}</b>
        {spec?.within && <> · inside {spec.within.join(', ')}</>}
        {spec?.unique && <> · once per sheet</>}
        {spec?.noNest && <> · never inside itself</>}
      </p>
      {own.length > 0 && <Heading>props</Heading>}
      {own.map((def) => (
        <KnobField
          key={def.key}
          def={def}
          value={props[def.key]}
          overridden={def.key in book.knobs}
          onChange={(value) => book.setKnob(def.key, value)}
        />
      ))}
      {spec && spec.children !== 'none' && (
        <>
          <Heading>children</Heading>
          <textarea
            value={children ?? ''}
            onChange={(event) => book.setChildren(event.target.value)}
            spellCheck={false}
            rows={3}
            className="w-full resize-y rounded-[8px] border border-border bg-background px-2 py-1 font-mono text-[11px] leading-[1.4] outline-none focus:border-ring"
          />
          {book.childrenText !== null && (
            <button
              type="button"
              onClick={() => book.setChildren(null)}
              className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              reset children
            </button>
          )}
        </>
      )}
      {style.length > 0 && <Heading>style</Heading>}
      {style.map((def) => (
        <KnobField
          key={def.key}
          def={def}
          value={props[def.key]}
          overridden={def.key in book.knobs}
          onChange={(value) => book.setKnob(def.key, value)}
        />
      ))}
      {spec?.hints && (
        <>
          <Heading>hints</Heading>
          <dl className="text-[12px]">
            {Object.entries(spec.hints).map(([key, hint]) => (
              <div key={key} className="py-0.5">
                <dt className="inline font-mono text-muted-foreground">{key}</dt>
                <dd className="inline"> — {hint}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </aside>
  )
}
