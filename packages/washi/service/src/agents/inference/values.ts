export const MISSING = {
  cliAbsent:
    'Claude Code is not installed on this computer. Install it from claude.com/code, or switch Washi to an API key in settings.',
  cliSignedOut:
    'Claude Code is installed but signed out. Run `claude` in a terminal, sign in, then ask again.',
  envKeyAbsent:
    'No ANTHROPIC_API_KEY in this app’s environment. Set one, or switch Washi to Claude Code in settings.',
  nothing:
    'Washi has nothing to think with yet. Sign in to Claude Code on this computer, or set ANTHROPIC_API_KEY.',
  workspaceKeyAbsent: 'No API key for this workspace. Add one in settings before asking Washi.',
} as const
