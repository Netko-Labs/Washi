import { emojiCatalog } from '@/components/shared/emoji'
import { CATEGORY_ICONS, type CategoryBarProps } from './lib'

export function CategoryBar({ active, isDimmed, onChange }: CategoryBarProps) {
  return (
    <div className="mb-1 flex justify-between border-border border-b pb-1">
      {emojiCatalog().map((category) => {
        const Icon = CATEGORY_ICONS[category.id]
        const isActive = !isDimmed && active === category.id
        return (
          <button
            key={category.id}
            type="button"
            title={category.label}
            aria-label={category.label}
            aria-pressed={isActive}
            onClick={() => onChange(category.id)}
            className={`grid size-7 place-items-center rounded-md ${
              isActive
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
