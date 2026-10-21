import { describe, expect, test } from 'bun:test'
import { paperRegistry } from '@washi/paper/registry'
import { parse, validate } from '@washi/wsx'
import { knobsFor } from '../../knobs'
import { matrixAxes, matrixSource, specimenSource } from '../utils'
import { SPECIMENS } from '../values'

const NAMES = Object.keys(paperRegistry.components).filter((name) => name !== 'Sheet')
const FRAME = { theme: 'washi' as const, feel: 'note' as const, accent: 'accent' as const }

function errors(source: string): string[] {
  return validate(parse(source), paperRegistry)
    .filter((d) => d.severity === 'error')
    .map((d) => `${d.path ?? ''}: ${d.message}`)
}

describe('specimens', () => {
  test('every primitive but Sheet has one', () => {
    expect(NAMES.filter((name) => !(name in SPECIMENS))).toEqual([])
    expect(Object.keys(SPECIMENS).filter((name) => !NAMES.includes(name))).toEqual([])
  })

  for (const name of NAMES) {
    test(`${name} renders a valid page`, () => {
      const source = specimenSource({ ...FRAME, name, knobs: {}, childrenText: null })
      expect(errors(source)).toEqual([])
    })
  }

  test('a required prop every specimen supplies', () => {
    for (const name of NAMES) {
      const missing = knobsFor(name)
        .filter((knob) => knob.required && !(knob.key in (SPECIMENS[name]?.props ?? {})))
        .map((knob) => `${name}.${knob.key}`)
      expect(missing).toEqual([])
    }
  })

  test('knobs override and null clears', () => {
    const source = specimenSource({
      ...FRAME,
      name: 'Card',
      knobs: { variant: 'tape', title: null },
      childrenText: 'Just text.',
    })
    expect(source).toContain('<Card variant="tape">')
    expect(source).not.toContain('title="Outline"')
  })

  test('the matrix stays inside the budget for every primitive that has one', () => {
    for (const name of NAMES) {
      const source = matrixSource({ ...FRAME, name, knobs: {}, childrenText: null })
      if (matrixAxes(name) === null) {
        expect(source).toBeNull()
        continue
      }
      expect(source).not.toBeNull()
      expect(errors(source as string)).toEqual([])
    }
  })
})
