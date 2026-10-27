import { useTheme } from '@/components/shared/theme'
import { THEME_OPTIONS } from './lib'
import { Segmented, SettingRow, SettingsCard } from './shared/card'

/** Choices that are yours and this device's alone; nothing here reaches the team. */
export function PreferencesSection() {
  const { theme, setTheme } = useTheme()
  return (
    <SettingsCard title="Appearance" desc="Kept in this browser.">
      <SettingRow label="Theme" hint="Paper by day, ink by night — the pages keep their own looks.">
        <Segmented value={theme} options={THEME_OPTIONS} onChange={setTheme} />
      </SettingRow>
    </SettingsCard>
  )
}
