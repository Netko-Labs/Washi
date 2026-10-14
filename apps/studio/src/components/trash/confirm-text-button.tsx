import { type ConfirmTextButtonProps, useArmed } from './lib'

export function ConfirmTextButton({ idle, armed, onConfirm }: ConfirmTextButtonProps) {
  const { isArmed, arm, disarm } = useArmed()

  return (
    <button
      type="button"
      onClick={isArmed ? onConfirm : arm}
      onMouseLeave={disarm}
      className={`h-7 shrink-0 rounded-lg px-2.5 font-medium text-[12px] ${
        isArmed
          ? 'bg-destructive text-white'
          : 'border border-border text-muted-foreground hover:border-destructive hover:text-destructive'
      }`}
    >
      {isArmed ? armed : idle}
    </button>
  )
}
