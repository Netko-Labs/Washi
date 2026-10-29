import { useState } from 'react'
import { useProfileStore } from '@/stores/profile'
import { StepLocalFirst, StepSync, StepVault, StepWrapUp } from './OnboardingSteps'
import { StepProfile } from './StepProfile'
import type { OnboardingDraft, PatchDraft } from './types'

const INITIAL_DRAFT: OnboardingDraft = {
  step: 1,
  user: '',
  email: '',
  color: '#cf6b36',
  name: 'Personal vault',
  vault: 'journal',
  sync: 'offline',
  server: 'https://sync.hollowmoor.net',
  e2e: true,
  agent: true,
  nudge: false,
}

const STEPS = [1, 2, 3, 4, 5]

/** First-run flow ported 1:1 from the Washi.dc.html onboarding screen. */
export function Onboarding() {
  const { onboarding, finishOnboarding, setIdentity } = useProfileStore()
  const [draft, setDraft] = useState(INITIAL_DRAFT)
  if (!onboarding) return null

  const patch: PatchDraft = (p) => setDraft((d) => ({ ...d, ...p }))
  const { step } = draft
  const nextLabel =
    step === 1 ? 'Get started' : step === 5 ? `Open ${draft.name || 'vault'}` : 'Continue'

  const finish = () => {
    setIdentity({
      name: draft.user.trim() || 'Mira Kaneko',
      email: draft.email.trim(),
      color: draft.color,
    })
    finishOnboarding()
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center overflow-y-auto bg-background text-foreground"
      data-onboarding
    >
      <div className="m-auto flex w-full max-w-[560px] flex-col gap-[26px] px-8 pt-14 pb-10">
        {step === 1 && <StepLocalFirst />}
        {step === 2 && <StepProfile draft={draft} patch={patch} />}
        {step === 3 && <StepVault draft={draft} patch={patch} />}
        {step === 4 && <StepSync draft={draft} patch={patch} />}
        {step === 5 && <StepWrapUp draft={draft} patch={patch} />}
        <div className="flex items-center gap-3 pt-1.5">
          <div className="flex flex-1 gap-1.5">
            {STEPS.map((n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full ${n === step ? 'w-[22px]' : 'w-1.5'} ${n <= step ? 'bg-foreground' : 'bg-border'}`}
              />
            ))}
          </div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => patch({ step: step - 1 })}
              className="h-9 rounded-[10px] border border-border bg-background px-3.5 text-[13px] hover:bg-accent"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (step === 5 ? finish() : patch({ step: step + 1 }))}
            className="h-9 rounded-[10px] bg-primary px-4 font-medium text-[13px] text-primary-foreground hover:opacity-90"
          >
            {nextLabel}
          </button>
        </div>
        {step === 1 && (
          <button
            type="button"
            onClick={finishOnboarding}
            className="-mt-3.5 self-start text-[12.5px] text-muted-foreground underline underline-offset-[3px] hover:text-foreground"
          >
            Skip setup — open a vault with sample notes
          </button>
        )}
      </div>
    </div>
  )
}
