import { IconCheck } from '@tabler/icons-react'
import { STEPS, type StepperProps } from './lib'

export function Stepper({ current }: StepperProps) {
  const at = STEPS.findIndex((step) => step.id === current)

  return (
    <ol className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
      {STEPS.map((step, index) => (
        <li
          key={step.id}
          aria-current={index === at ? 'step' : undefined}
          className={`flex items-center gap-1.5 ${
            index === at ? 'font-semibold' : 'text-muted-foreground'
          }`}
        >
          {index < at ? (
            <IconCheck className="size-3.5" />
          ) : (
            <span
              className={`grid size-4 place-items-center rounded-full font-mono text-[10px] ${
                index === at ? 'bg-primary text-primary-foreground' : 'border border-border'
              }`}
            >
              {index + 1}
            </span>
          )}
          {step.label}
        </li>
      ))}
    </ol>
  )
}
