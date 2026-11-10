import type { LookPart } from '@washi/paper'
import { SheetIcon, useWorkspaceLookStore } from '@washi/ui'
import { CoverPicker, IconPicker } from '@/components/page-chrome'
import { SettingRow, SettingsCard } from '../shared/card'
import { useWorkspaceLookEdit, type WorkspaceLookCardProps } from './lib'

const BUTTON =
  'flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-[13px] hover:bg-accent disabled:opacity-60 disabled:hover:bg-transparent'

/**
 * What a page with no icon or cover of its own wears (D139). A page's own always wins, and none is
 * rewritten: the default is drawn, never saved into a page.
 */
export function WorkspaceLookCard({ canChange }: WorkspaceLookCardProps) {
  const look = useWorkspaceLookStore()
  const edit = useWorkspaceLookEdit()
  const button = (part: LookPart, label: string) => (
    <button
      type="button"
      disabled={!canChange}
      onClick={(event) => edit.show(part, event.currentTarget)}
      className={BUTTON}
    >
      {label}
    </button>
  )

  return (
    <SettingsCard
      title="Default look"
      desc={
        canChange
          ? 'A page with no icon or cover of its own wears these. Its own always wins.'
          : 'A page with no icon or cover of its own wears these. Only an owner or admin changes them.'
      }
    >
      <SettingRow label="Icon" hint={look.icon ? undefined : 'None: pages show a page glyph.'}>
        {look.icon && <SheetIcon name={look.icon} className="size-6" />}
        {button('icon', look.icon ? 'Change' : 'Choose')}
      </SettingRow>
      <SettingRow label="Cover" hint={look.cover ?? 'None: pages show no cover.'}>
        {button('cover', look.cover ? 'Change' : 'Choose')}
      </SettingRow>
      {edit.error && <p className="px-5 pb-4 text-[12.5px] text-destructive">{edit.error}</p>}
      {edit.open?.part === 'icon' && (
        <IconPicker
          anchor={edit.open.anchor}
          current={look.icon}
          onClose={edit.close}
          onPick={(icon) => edit.pick('icon', icon)}
        />
      )}
      {edit.open?.part === 'cover' && (
        <CoverPicker
          anchor={edit.open.anchor}
          current={look.cover}
          onClose={edit.close}
          onPick={(cover) => edit.pick('cover', cover)}
        />
      )}
    </SettingsCard>
  )
}
