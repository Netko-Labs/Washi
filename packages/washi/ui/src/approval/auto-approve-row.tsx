import { SettingsCard, SettingsRow } from '../settings-kit'
import { useAutoApprove } from './lib'

/** YOLO, said plainly: changes go through, anything leaving the workspace still asks. */
export function AutoApproveRow() {
  const { on, toggle } = useAutoApprove()

  return (
    <SettingsCard>
      <SettingsRow
        title="Approve changes automatically"
        sub="Washi creates and edits pages and tables without asking. Visiting websites and running actions still ask first."
        wrap
        last
      >
        <button
          type="button"
          role="switch"
          aria-checked={on === true}
          aria-label="Approve changes automatically"
          disabled={on === null}
          onClick={() => void toggle()}
          className={`flex h-5 w-9 flex-none items-center rounded-full p-0.5 transition-colors disabled:opacity-50 ${
            on ? 'justify-end bg-primary' : 'bg-border'
          }`}
        >
          <span className="size-4 rounded-full bg-background shadow-sm" />
        </button>
      </SettingsRow>
    </SettingsCard>
  )
}
