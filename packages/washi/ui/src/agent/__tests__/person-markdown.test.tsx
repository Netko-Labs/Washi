import { describe, expect, test } from 'bun:test'
import type { TranscriptEntry } from '@washi/domain'
import { renderToStaticMarkup } from 'react-dom/server'
import { TranscriptView } from '../transcript-view'

const asked = (text: string) =>
  ({ id: 'u', update: { kind: 'user_message', text } }) as unknown as TranscriptEntry

describe('what the person sent reads as markdown (D115)', () => {
  test('bold, lists and code are elements; their line breaks are kept', () => {
    const out = renderToStaticMarkup(
      <TranscriptView
        transcript={[asked('Make **two** pages:\n\n- a\n- b\n\n```\nlong()\n```')]}
      />,
    )
    expect(out).toContain('two</strong>')
    expect(out.match(/<li/g)?.length).toBe(2)
    expect(out).toContain('<pre')
    expect(out).toContain('[&amp;_p]:whitespace-pre-wrap')
  })
})
