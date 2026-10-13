import { type InviteBannerProps, useInvite } from './lib'

export function InviteBanner({ onAccepted }: InviteBannerProps) {
  const state = useInvite(onAccepted)
  if (state.kind === 'none') return null
  return (
    <p
      className={`mt-6 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed ${
        state.kind === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-accent'
      }`}
    >
      {state.kind === 'accepting'
        ? 'Joining the workspace you were invited to…'
        : `${state.message} You are signed in as a different address than the one invited, or the link expired.`}
    </p>
  )
}
