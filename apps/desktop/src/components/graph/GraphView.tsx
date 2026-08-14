import { useSheetsStore } from '@/stores/sheets/sheets-store'

const EDGES = [
  'M450 260 L300 160',
  'M450 260 L640 170',
  'M450 260 L360 390',
  'M450 260 L620 380',
  'M300 160 L180 250',
  'M640 170 L760 260',
  'M360 390 L240 430',
  'M620 380 L700 450',
  'M300 160 L640 170',
]

const NODES = [
  { label: 'Nullbyte', pos: 'left-[33.3%] top-[30.7%]', dot: 'size-3.5 bg-agent', muted: false },
  { label: 'Hearth', pos: 'left-[71%] top-[32.6%]', dot: 'size-3.5 bg-agent', muted: false },
  { label: 'SLAB', pos: 'left-[40%] top-[75%]', dot: 'size-3 bg-muted-foreground', muted: false },
  {
    label: 'Token audit',
    pos: 'left-[68.8%] top-[73%]',
    dot: 'size-[11px] bg-muted-foreground',
    muted: true,
  },
  {
    label: 'Latency refs',
    pos: 'left-[20%] top-[48%]',
    dot: 'size-2.5 bg-muted-foreground',
    muted: true,
  },
  {
    label: 'Research',
    pos: 'left-[84.4%] top-[50%]',
    dot: 'size-2.5 bg-muted-foreground',
    muted: true,
  },
  {
    label: 'Kitchen trip',
    pos: 'left-[26.6%] top-[82.7%]',
    dot: 'size-[9px] bg-muted-foreground',
    muted: true,
  },
  {
    label: 'Pricing',
    pos: 'left-[77.7%] top-[86.5%]',
    dot: 'size-[9px] bg-muted-foreground',
    muted: true,
  },
]

export function GraphView() {
  const pageCount = useSheetsStore((state) => state.sheets.length)

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="relative h-full min-h-[520px]">
        <div className="absolute inset-0 bg-[length:22px_22px] bg-[radial-gradient(var(--border)_1px,transparent_1px)] opacity-60" />

        <div className="absolute top-5 left-6 z-[2] flex items-center gap-2">
          <span className="inline-flex h-5 items-center rounded-md border border-border bg-background px-2 font-medium text-[11px]">
            {pageCount} pages
          </span>
          <span className="inline-flex h-5 items-center rounded-md border border-border bg-background px-2 font-medium text-[11px]">
            118 links
          </span>
          <span className="ml-1.5 inline-flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className="size-2 rounded-full bg-agent" />
            agent-touched
          </span>
        </div>

        <svg viewBox="0 0 900 520" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <g className="stroke-border" strokeWidth="1.5" fill="none">
            {EDGES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </svg>

        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-[3] flex flex-col items-center gap-1.5">
          <span className="size-5 rounded-full bg-foreground" />
          <span className="font-semibold text-xs">Design specs</span>
        </div>
        {NODES.map((node) => (
          <div
            key={node.label}
            className={`absolute z-[3] flex flex-col items-center gap-[5px] ${node.pos}`}
          >
            <span className={`rounded-full ${node.dot}`} />
            <span className={`text-[11px] ${node.muted ? 'text-muted-foreground' : ''}`}>
              {node.label}
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}
