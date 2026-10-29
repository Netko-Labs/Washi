import { AgentMascot } from '@washi/ui'
import { type AuthFieldProps, type AuthScreenProps, PITCH, useAuthForm } from './lib'

/**
 * Sign-in and the first half of onboarding, which on the web are the same
 * screen. The second half — naming a workspace — only makes sense once there
 * is an account to own it, so it lives in the workspace picker.
 */
export function AuthScreen({ onDone }: AuthScreenProps) {
  const { state, patch, setMode, submit } = useAuthForm(onDone)
  const signingUp = state.mode === 'sign-up'

  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <section className="paper-canvas hidden flex-col justify-between border-border border-r bg-muted px-12 py-14 lg:flex">
        <p className="font-semibold text-[15px] tracking-[0.18em] uppercase">washi</p>
        <div className="max-w-md">
          <AgentMascot state="writing" size={88} className="mb-8" />
          <h1 className="font-serif font-semibold text-5xl leading-[1.1] tracking-[-0.02em]">
            {PITCH.headline}
          </h1>
          <p className="mt-5 text-[17px] text-muted-foreground leading-relaxed">{PITCH.sub}</p>
          <dl className="mt-10 grid gap-5">
            {PITCH.points.map(([term, detail]) => (
              <div key={term}>
                <dt className="font-semibold text-[14px]">{term}</dt>
                <dd className="mt-1 text-[14px] text-muted-foreground leading-relaxed">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-[13px] text-muted-foreground">Open source</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form
          className="w-full max-w-sm"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="flex items-center gap-2.5 lg:hidden">
            <AgentMascot state="idle" size={36} />
            <p className="font-semibold text-[15px] tracking-[0.18em] uppercase">washi</p>
          </div>
          <h2 className="mt-6 font-semibold text-[26px] tracking-[-0.02em] lg:mt-0">
            {signingUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {signingUp
              ? 'One account, then a workspace to put pages in.'
              : 'Sign in to your workspace.'}
          </p>

          <div className="mt-8 grid gap-3">
            {signingUp && (
              <Field
                label="Name"
                type="text"
                value={state.name}
                autoComplete="name"
                onChange={(name) => patch({ name })}
              />
            )}
            <Field
              label="Email"
              type="email"
              value={state.email}
              autoComplete="email"
              onChange={(email) => patch({ email })}
            />
            <Field
              label="Password"
              type="password"
              value={state.password}
              autoComplete={signingUp ? 'new-password' : 'current-password'}
              onChange={(password) => patch({ password })}
            />
          </div>

          {state.error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={state.busy || !state.email || !state.password}
            className="mt-6 h-11 w-full rounded-xl bg-primary font-semibold text-[14px] text-primary-foreground disabled:opacity-50"
          >
            {state.busy ? 'One moment…' : signingUp ? 'Create account' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => setMode(signingUp ? 'sign-in' : 'sign-up')}
            className="mt-4 h-11 w-full text-[13px] text-muted-foreground underline-offset-4 hover:underline"
          >
            {signingUp ? 'I already have an account' : 'Create an account instead'}
          </button>
        </form>
      </section>
    </main>
  )
}

function Field({ label, type, value, autoComplete, onChange }: AuthFieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="font-semibold text-[13px]">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus-visible:border-primary"
      />
    </label>
  )
}
