import { EMAIL_HINT, type FormVisitorProps, fieldAria, REQUIRED_HINT } from './lib'

/**
 * Who sends a suggestion through a link (D120): shown to the member who decides it, never written
 * into the table. The last input is a trap no person sees — off screen, out of the tab order.
 */
export function FormVisitor({ id, visitor, onChange, missing }: FormVisitorProps) {
  const nameId = `${id}-visitor:name`
  const emailId = `${id}-visitor:email`
  const nameError = missing.includes('name') ? REQUIRED_HINT : undefined
  const emailError = missing.includes('email')
    ? visitor.email.trim()
      ? EMAIL_HINT
      : REQUIRED_HINT
    : undefined
  return (
    <>
      <div className="wsx-field" data-kind="text" data-required>
        <label className="wsx-field-label" htmlFor={nameId}>
          Your name
          <span className="wsx-field-required" aria-hidden>
            *
          </span>
        </label>
        <input
          id={nameId}
          {...fieldAria(nameId, true, nameError)}
          className="wsx-field-input"
          autoComplete="name"
          maxLength={100}
          value={visitor.name}
          onChange={(event) => onChange('name', event.currentTarget.value)}
        />
        {nameError && (
          <span id={`${nameId}-error`} className="wsx-field-error">
            {nameError}
          </span>
        )}
      </div>
      <div className="wsx-field" data-kind="text" data-required>
        <label className="wsx-field-label" htmlFor={emailId}>
          Your email
          <span className="wsx-field-required" aria-hidden>
            *
          </span>
        </label>
        <input
          id={emailId}
          {...fieldAria(emailId, true, emailError)}
          className="wsx-field-input"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={visitor.email}
          onChange={(event) => onChange('email', event.currentTarget.value)}
        />
        {emailError && (
          <span id={`${emailId}-error`} className="wsx-field-error">
            {emailError}
          </span>
        )}
      </div>
      <input
        className="wsx-form-trap"
        aria-hidden
        tabIndex={-1}
        autoComplete="off"
        name="website"
        value={visitor.trap ?? ''}
        onChange={(event) => onChange('trap', event.currentTarget.value)}
      />
    </>
  )
}
