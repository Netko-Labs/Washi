import { useTheme } from '@/components/shared/theme'
import { THEME_CHOICES } from './lib'

export function ThemeChoice() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex h-8 items-center gap-2.5 px-2 text-[13px]">
      Theme
      <div role="group" aria-label="Theme" className="ml-auto flex rounded-lg bg-muted p-0.5">
        {THEME_CHOICES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="menuitemradio"
            aria-checked={theme === id}
            aria-label={label}
            title={label}
            onClick={() => setTheme(id)}
            className={`grid size-6 place-items-center rounded-md ${
              theme === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" />
          </button>
        ))}
      </div>
    </div>
  )
}
