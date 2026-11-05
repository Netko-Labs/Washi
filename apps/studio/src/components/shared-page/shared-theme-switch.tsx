import { useTheme } from '@/components/shared/theme'
import { SHARED_THEMES } from './lib'

/** Light, dark or the device's own for whoever reads the link — kept in their browser, nothing sent. */
export function SharedThemeSwitch() {
  const { theme, setTheme } = useTheme('system')
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
    >
      {SHARED_THEMES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          aria-label={label}
          title={label}
          onClick={() => setTheme(id)}
          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:text-foreground aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-sm"
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}
