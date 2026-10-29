import { SettingsCard } from '../../shared/card'
import type { ServerWidgetsCardProps } from '../lib'

/** The server's switch over every workspace's widgets: off is off; on, each workspace decides. */
export function ServerWidgetsCard({ widgets, onChange }: ServerWidgetsCardProps) {
  return (
    <SettingsCard
      title="Widgets"
      desc="A widget runs a page’s own HTML in a frame with no network. Off here, no workspace can turn them on."
      tag={
        widgets ? { tone: 'ok', label: 'Each workspace decides' } : { tone: 'off', label: 'Off' }
      }
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-[13px] text-muted-foreground">
          {widgets
            ? 'A workspace’s owners may allow widgets in its settings.'
            : 'No page on this server runs a widget.'}
        </p>
        <button
          type="button"
          onClick={() => void onChange(!widgets)}
          className="h-9 shrink-0 rounded-xl border border-border px-4 font-semibold text-[13px] hover:bg-accent"
        >
          {widgets ? 'Turn off everywhere' : 'Let workspaces decide'}
        </button>
      </div>
    </SettingsCard>
  )
}
