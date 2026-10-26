export type Step = 'name' | 'start' | 'invite'
export type Starter = 'empty' | 'team'
export type InviteRole = 'member' | 'admin'

export interface Made {
  id: string
  name: string
}

export interface InviteDraft {
  key: number
  email: string
  role: InviteRole
}

export interface SentInvite {
  id: string
  email: string
  role: InviteRole
}

export interface NameStepProps {
  busy: boolean
  error: string | null
  onName: (name: string) => void
}

export interface StartStepProps {
  busy: boolean
  error: string | null
  onStart: (starter: Starter) => void
}

export interface InviteStepProps {
  workspace: Made
  onDone: () => void
}

export interface StepperProps {
  current: Step
}

export interface InviteSentListProps {
  sent: SentInvite[]
}
