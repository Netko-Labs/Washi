import {
  RowButton,
  SegmentedControl,
  SettingsCard,
  SettingsRow,
  StaticToggle,
} from './SettingsControls'

export function SettingsGeneralTab() {
  return (
    <div className="flex flex-col gap-[22px]">
      <SettingsCard>
        <SettingsRow title="Theme" sub="Follows the system by default" wrap>
          <SegmentedControl options={['Light', 'Dark']} active="Light" />
        </SettingsRow>
        <SettingsRow title="Vault location" sub="~/Washi/personal-vault" mono>
          <RowButton>Move…</RowButton>
        </SettingsRow>
        <SettingsRow title="Spellcheck" sub="Underline unknown words while typing" last>
          <StaticToggle on />
        </SettingsRow>
      </SettingsCard>
    </div>
  )
}
