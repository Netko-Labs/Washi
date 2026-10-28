import { matrixAxes } from '@washi/paper/book'
import { THEME_IDS, THEMES, type ThemeId } from '@washi/paper/registry'
import { SegmentedControl } from '@washi/ui'
import {
  ACCENTS,
  type Accent,
  FEELS,
  type Feel,
  MODES,
  type Mode,
  useBookStore,
  VIEWS,
  type View,
  WIDTHS,
  type Width,
} from '@/components/shared/book'

function Label({ children }: { children: string }) {
  return (
    <span className="text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
      {children}
    </span>
  )
}

export function Topbar() {
  const book = useBookStore()
  const views = VIEWS.filter((view) => view !== 'matrix' || matrixAxes(book.primitive) !== null)

  return (
    <header className="col-span-3 flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1.5 border-border border-b bg-card px-4 py-1.5">
      <div className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
        <span className="font-display font-bold text-[15px] tracking-[0.06em]">MIHON</span>
        <span className="text-[12px] text-muted-foreground">the WSX sample book</span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Label>theme</Label>
        <select
          value={book.theme}
          onChange={(event) => book.set({ theme: event.target.value as ThemeId })}
          className="h-8 rounded-[10px] border border-border bg-background px-2 text-[13px]"
        >
          {THEME_IDS.map((id) => (
            <option key={id} value={id}>
              {THEMES[id].name}
            </option>
          ))}
        </select>
        <SegmentedControl
          options={[...MODES]}
          active={book.mode}
          onSelect={(mode) => book.set({ mode: mode as Mode })}
        />
        <Label>feel</Label>
        <SegmentedControl
          options={[...FEELS]}
          active={book.feel}
          onSelect={(feel) => book.set({ feel: feel as Feel })}
        />
        <Label>accent</Label>
        <SegmentedControl
          options={[...ACCENTS]}
          active={book.accent}
          onSelect={(accent) => book.set({ accent: accent as Accent })}
        />
        <Label>width</Label>
        <SegmentedControl
          options={[...WIDTHS]}
          active={book.width}
          onSelect={(width) => book.set({ width: width as Width })}
        />
        <SegmentedControl
          options={[...views]}
          active={book.view}
          onSelect={(view) => book.set({ view: view as View })}
        />
      </div>
    </header>
  )
}
