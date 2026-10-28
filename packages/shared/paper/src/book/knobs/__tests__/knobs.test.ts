import { describe, expect, test } from 'bun:test'
import { knobsFor } from '../utils'

describe('knobsFor', () => {
  test('reads enums, literals, numbers and booleans off the spec', () => {
    const title = Object.fromEntries(knobsFor('Title').map((knob) => [knob.key, knob]))
    expect(title.level).toMatchObject({ kind: 'enum', options: [1, 2, 3], required: false })
    expect(title.variant).toMatchObject({ kind: 'enum', styled: true })
    expect(title.span).toMatchObject({ kind: 'number', styled: true })
    expect(knobsFor('Item').find((k) => k.key === 'done')).toMatchObject({ kind: 'boolean' })
  })

  test('required props and structured props', () => {
    const chart = Object.fromEntries(knobsFor('Chart').map((knob) => [knob.key, knob]))
    expect(chart.kind).toMatchObject({ kind: 'enum', required: true })
    expect(chart.bind).toMatchObject({ kind: 'json', required: false })
    expect(knobsFor('Figure').find((k) => k.key === 'src')).toMatchObject({
      kind: 'text',
      required: true,
    })
  })

  test('unknown primitive has no knobs', () => {
    expect(knobsFor('Nope')).toEqual([])
  })
})
