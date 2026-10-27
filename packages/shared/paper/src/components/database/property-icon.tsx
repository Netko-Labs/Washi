import type { PropertyIconProps } from './lib'

const PATHS: Record<string, string> = {
  text: 'M3 4.5h10M3 8h10M3 11.5h6',
  number: 'M6.5 2.5 5.5 13.5M10.5 2.5l-1 11M3 6h10.5M2.5 10h10.5',
  status: 'M8 2.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11M8 2.5v11',
  select: 'M8 2.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11M5.75 7 8 9.25 10.25 7',
  multi_select: 'M6 4.5h7M6 8h7M6 11.5h7M3 4.5h.01M3 8h.01M3 11.5h.01',
  date: 'M3 4.5h10v8.5H3zM3 7.5h10M5.5 3v3M10.5 3v3',
  person:
    'M8 3a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M3.5 13.5c.6-2.3 2.4-3.5 4.5-3.5s3.9 1.2 4.5 3.5',
  boolean: 'M3.5 3.5h9v9h-9zM5.75 8.25 7.25 9.75 10.25 6.5',
  url: 'M9 3h4v4M13 3 7.5 8.5M11 9.5v3a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5h3',
  relation: 'M5 11 11 5M6 5h5v5',
  formula: 'M11 3c-1.6 0-2.2.8-2.6 2.5L6.8 11c-.4 1.7-1 2.5-2.6 2.5M5 7.5h5.5',
  rollup: 'M12 3.5H4.5L9 8l-4.5 4.5H12',
}

/** The property's type, drawn small before its name the way Notion heads a column. */
export function PropertyIcon({ type }: PropertyIconProps) {
  return (
    <svg className="wsx-db-ptype" viewBox="0 0 16 16" aria-hidden>
      <path d={PATHS[type] ?? PATHS.text} />
    </svg>
  )
}
