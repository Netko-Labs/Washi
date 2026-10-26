import { styled } from '../lib'
import type { RedactProps } from '../lib/types'

/**
 * What a shared link must not show (D65). Members read it inside a hatched frame; the link's copy
 * of the page arrives with the contents already stripped server-side, so it draws the bar.
 */
export function Redact({ reason, children, ...rest }: RedactProps) {
  const hidden = !children || (Array.isArray(children) && children.length === 0)
  if (hidden) {
    return (
      <div {...styled(rest, 'wsx-redacted')} role="note">
        <span className="wsx-redacted-bar" aria-hidden />
        <span className="wsx-redacted-label">Redacted{reason ? ` · ${reason}` : ''}</span>
      </div>
    )
  }
  return (
    <div {...styled(rest, 'wsx-redact')}>
      <span className="wsx-redact-label">Hidden when shared{reason ? ` · ${reason}` : ''}</span>
      <div className="wsx-redact-body">{children}</div>
    </div>
  )
}
