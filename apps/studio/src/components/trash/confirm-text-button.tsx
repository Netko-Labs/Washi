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
          : 'border border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10'
      }`}
    >
      {isArmed ? armed : idle}
    </button>
  )
}
