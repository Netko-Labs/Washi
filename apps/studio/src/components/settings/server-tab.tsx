import { SIGNUP_OPTIONS, useServerSettings } from './lib'
import { Segmented, SettingRow, SettingsCard } from './shared/card'

/** The server's own settings, not this workspace's: only its app admins see them. */
export function ServerTab() {
  const { signup, setSignup, error } = useServerSettings()
  const chosen = SIGNUP_OPTIONS.find((option) => option.id === signup)

  return (
    <div className="grid gap-4">
      <SettingsCard
        title="Who can create an account"
        desc="Applies to every workspace on this server."
      >
        <SettingRow label="Sign-up" hint={chosen?.desc}>
          {signup && (
            <Segmented
              value={signup}
              options={SIGNUP_OPTIONS}
              onChange={(mode) => void setSignup(mode)}
            />
          )}
        </SettingRow>
      </SettingsCard>
      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  )
}
