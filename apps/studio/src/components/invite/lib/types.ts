export interface InviteBannerProps {
  onAccepted: (workspaceId: string) => void
}

export type InviteState =
  | { kind: 'none' }
  | { kind: 'accepting' }
  | { kind: 'failed'; message: string }
