import { ROLE_PILL, type RolePillProps } from './lib'

export function RolePill({ role }: RolePillProps) {
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 font-medium text-[12px] capitalize ${ROLE_PILL[role] ?? ROLE_PILL.member}`}
    >
      {role}
    </span>
  )
}
