import {
  DangerButton,
  SegmentedControl,
  SettingsCard,
  SettingsRow,
  StaticToggle,
} from './SettingsControls'

export function SettingsAgentsTab() {
  return (
    <div className="flex flex-col gap-[22px]">
      <SettingsCard>
        <SettingsRow title="Show authorship on blocks" sub="Marks which paragraphs an agent wrote">
          <StaticToggle on />
        </SettingsRow>
        <SettingsRow
          title="Edit autonomy"
          sub="Suggest means nothing lands without your accept"
          wrap
        >
          <SegmentedControl options={['Suggest', 'Write directly']} active="Suggest" />
        </SettingsRow>
        <SettingsRow
          title="Scheduled runs"
          sub="Daily at 06:00 · reviews specs for token conflicts"
          last
        >
          <span className="flex h-5 flex-none items-center rounded-full bg-[#16a34a]/10 px-2 font-medium text-[#16a34a] text-[11px]">
            On
          </span>
        </SettingsRow>
      </SettingsCard>
      <SettingsCard>
        <SettingsRow
          title="Revoke agent access"
          sub="Agents keep read access to published pages"
          last
        >
          <DangerButton>Revoke</DangerButton>
        </SettingsRow>
      </SettingsCard>
    </div>
  )
}
