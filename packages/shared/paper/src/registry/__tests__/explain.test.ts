import { describe, expect, test } from 'bun:test'
import { parse, validate } from '@washi/wsx'
import { paperRegistry } from '../index'

const messages = (body: string) =>
  validate(parse(`<Sheet title="t">${body}</Sheet>`), paperRegistry)
    .map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`)
    .join('\n')

describe('steps', () => {
  test('a step of Steps is numbered for it; a Timeline step still names its marker', () => {
    expect(
      messages(
        '<Steps><Step title="Install"><Text>a</Text></Step><Step title="Run" marker="✓" /></Steps><Timeline><Step marker="1">b</Step></Timeline>',
      ),
    ).toBe('')
    expect(messages('<Timeline><Step title="x">b</Step></Timeline>')).toContain('prop marker')
    expect(messages('<Steps><Step>no title</Step></Steps>')).toContain('prop title')
    expect(messages('<Step title="alone" />')).toContain('only legal inside <Timeline> or <Steps>')
    expect(messages('<Steps start={3}><Step title="x" /></Steps>')).toContain('Steps counts from 1')
  })
})

describe('compare', () => {
  test('options sit inside a Compare, one may be picked, a tone and width are styled', () => {
    expect(
      messages(
        '<Compare width="wide"><Option title="A"><List><Item>fast</Item></List></Option><Option title="B" pick tone="success"><Text>b</Text></Option></Compare>',
      ),
    ).toBe('')
    expect(messages('<Option title="loose" />')).toContain('only legal inside <Compare>')
    expect(messages('<Compare><Option><Text>a</Text></Option></Compare>')).toContain('prop title')
    expect(messages('<Compare><Option title="A" recommended /></Compare>')).toContain('use pick')
    expect(messages('<Compare><Option title="A" pick="yes" /></Compare>')).toContain('prop pick')
  })
})

describe('faq', () => {
  test('questions sit inside a Faq and answer with their children', () => {
    expect(messages('<Faq><Question title="Why?"><Text>Because.</Text></Question></Faq>')).toBe('')
    expect(messages('<Question title="Why?" />')).toContain('only legal inside <Faq>')
    expect(messages('<Faq><Question answer="no" title="Why?" /></Faq>')).toContain(
      'the answer is the Question’s children',
    )
  })
})

describe('countdown', () => {
  test('a day or a wall-clock moment, nothing else', () => {
    expect(messages('<Countdown to="2026-12-24" label="Break" />')).toBe('')
    expect(messages('<Countdown to="2026-12-24T18:00" />')).toBe('')
    expect(messages('<Countdown to="2026-12-24T18:00Z" />')).toContain('reads like 2026-12-24')
    expect(messages('<Countdown to="Dec 24" />')).toContain('reads like 2026-12-24')
    expect(messages('<Countdown to="2026-02-30" />')).toContain('not on the calendar')
    expect(messages('<Countdown />')).toContain('prop to')
    expect(messages('<Countdown date="2026-12-24" to="2026-12-24" />')).toContain('use to')
    expect(messages('<Countdown to="2026-12-24">soon</Countdown>')).toContain(
      'does not take children',
    )
  })
})
