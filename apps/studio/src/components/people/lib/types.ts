export interface MemberView {
  id: string
  role: string
  name: string
  email: string
}

export interface InvitationView {
  id: string
  email: string
  role: string
  expiresAt: string
}

export interface PeopleSectionProps {
  workspaceId: string
}

export interface InviteRowProps {
  invitation: InvitationView
  onCancel: (id: string) => void
}
