import { useViewStore } from '@washi/ui'

/** Sharing lands with sync; until then it opens Sync & sharing. */
export function ShareButton() {
  return (
    <button
      type="button"
      title="Sharing lands with sync — opens Sync & sharing"
      onClick={() => useViewStore.getState().openTab('view:settings')}
      className="h-8 rounded-lg bg-primary px-3 font-medium text-[13px] text-primary-foreground hover:opacity-90"
    >
      Share
    </button>
  )
}
