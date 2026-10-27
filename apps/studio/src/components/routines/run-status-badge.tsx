import { RUN_STATUS, type RunStatusBadgeProps } from './lib'

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const { label, tone } = RUN_STATUS[status]
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 font-medium text-[11px] ${tone}`}
    >
      {label}
    </span>
  )
}
