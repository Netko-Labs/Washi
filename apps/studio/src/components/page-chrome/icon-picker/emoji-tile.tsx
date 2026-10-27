import type { EmojiTileProps } from './lib'

export function EmojiTile({ value, label, isCurrent, onPick, children }: EmojiTileProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={`Use ${label}`}
      onClick={() => onPick(value)}
      className={`grid h-9 place-items-center rounded-lg text-[20px] leading-none hover:bg-accent ${
        isCurrent ? 'bg-accent' : ''
      }`}
    >
      {children}
    </button>
  )
}
