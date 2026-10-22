import { IconCheck, IconChevronDown, IconSearch } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { MODEL_MENU_LIMIT, type ModelMenuProps, RECOMMENDED, useMenu } from '../lib'

const ROW = 'flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent'
const GROUP =
  'bg-background px-3 pt-2 pb-1 font-semibold text-[10.5px] text-muted-foreground uppercase tracking-[0.06em]'

/** A popover under the Default model row: three recommended with a line each, then all of them. */
export function ModelMenu({ models, provider, value, catalogueSource, onPick }: ModelMenuProps) {
  const menu = useMenu()
  const [term, setTerm] = useState('')
  const needle = term.trim().toLowerCase()

  const { recommended, rest } = useMemo(() => {
    const own = models.filter((model) => model.provider === provider)
    const picks = (RECOMMENDED[provider] ?? []).flatMap((pick) => {
      const model = own.find((candidate) => candidate.id === pick.id)
      return model ? [{ model, desc: pick.desc }] : []
    })
    const pickedIds = new Set(picks.map((pick) => pick.model.id))
    const matches = (name: string, id: string) =>
      !needle || `${name} ${id}`.toLowerCase().includes(needle)
    return {
      recommended: picks.filter((pick) => matches(pick.model.name, pick.model.id)),
      rest: own
        .filter((model) => !pickedIds.has(model.id) && matches(model.name, model.id))
        .slice(0, MODEL_MENU_LIMIT),
    }
  }, [models, provider, needle])

  const current = models.find((model) => model.id === value)
  const label = current?.name ?? (value ? value : "the provider's default")

  const pick = (id: string | null) => {
    onPick(id)
    menu.close()
  }

  const price = (model: { inputPerMTok: number | null; outputPerMTok: number | null }) =>
    model.inputPerMTok == null ? (
      <span className="text-amber-700">no price · counts toward the turn cap</span>
    ) : (
      `$${model.inputPerMTok} · $${model.outputPerMTok} /M`
    )

  return (
    <div ref={menu.root} className="relative">
      <button
        type="button"
        onClick={menu.isOpen ? menu.close : menu.open}
        aria-haspopup="listbox"
        aria-expanded={menu.isOpen}
        className={`flex h-[34px] max-w-[260px] items-center gap-2 rounded-[10px] border bg-background px-2.5 text-[13px] ${
          menu.isOpen ? 'border-primary' : 'border-border hover:bg-accent'
        }`}
      >
        <span className="truncate">{label}</span>
        <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
      {menu.isOpen && (
        <div
          role="listbox"
          className="absolute top-full right-0 z-50 mt-1.5 w-[340px] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
        >
          <label className="flex items-center gap-2 border-border border-b px-3">
            <IconSearch className="size-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={`Search ${models.filter((m) => m.provider === provider).length} models…`}
              className="h-10 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="max-h-[320px] overflow-y-auto">
            {recommended.length > 0 && <div className={GROUP}>Recommended</div>}
            {recommended.map(({ model, desc }) => (
              <button key={model.id} type="button" onClick={() => pick(model.id)} className={ROW}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[13px]">{model.name}</span>
                  <span className="block text-[12px] text-muted-foreground">{desc}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {price(model)}
                </span>
                {model.id === value && <IconCheck className="size-3.5 shrink-0" />}
              </button>
            ))}
            {rest.length > 0 && <div className={GROUP}>All {provider} models</div>}
            {rest.map((model) => (
              <button key={model.id} type="button" onClick={() => pick(model.id)} className={ROW}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{model.name}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {model.id}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {price(model)}
                </span>
                {model.id === value && <IconCheck className="size-3.5 shrink-0" />}
              </button>
            ))}
            {recommended.length + rest.length === 0 && (
              <p className="px-3 py-4 text-[13px] text-muted-foreground">
                {models.length === 0 ? 'Loading models…' : 'Nothing matches that.'}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-border border-t px-3 py-2 text-[12px] text-muted-foreground">
            {catalogueSource === 'fallback' ? (
              <span className="text-amber-700">models.dev is unreachable — a bundled list</span>
            ) : (
              <span>The price is why the daily stop exists.</span>
            )}
            {value && (
              <button type="button" onClick={() => pick(null)} className="hover:text-foreground">
                Use the default
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
