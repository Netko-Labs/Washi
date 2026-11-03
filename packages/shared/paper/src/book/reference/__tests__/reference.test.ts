import { describe, expect, test } from 'bun:test'
import { domDiagnostics, hasErrors, parse, validate } from '@washi/wsx'
import { paperRegistry } from '../../../registry'
import { wsxDetails, wsxIndex } from '..'

describe('the WSX reference an agent reads', () => {
  test('lists every primitive, with its required props starred', () => {
    const index = wsxIndex()
    expect(index.primitives.map((each) => each.name)).toEqual(Object.keys(paperRegistry.components))
    const callout = index.primitives.find((each) => each.name === 'Callout')
    expect(callout?.props).toContain('title')
    expect(index.primitives.find((each) => each.name === 'Figure')?.props).toContain('src*')
    expect(index.looks.tone).toContain('warning')
  })

  test('each example passes the server’s check, inside a Sheet', () => {
    const names = Object.keys(paperRegistry.components).filter((name) => name !== 'Sheet')
    const blocks = wsxDetails(names).primitives.flatMap((detail) =>
      [detail.example, ...(detail.also ?? [])].map((block) => ({ ...detail, block })),
    )
    for (const detail of blocks) {
      const source = `${detail.code ? `${detail.code}\n` : ''}<Sheet title="Example">${detail.block.replace('<page id>', 'p1')}</Sheet>`
      const root = parse(source)
      const errors = [...validate(root, paperRegistry), ...domDiagnostics(root)].filter(
        (each) => each.severity === 'error',
      )
      expect({ name: detail.name, errors }).toEqual({ name: detail.name, errors: [] })
      expect(hasErrors(errors)).toBe(false)
    }
  })

  test('a name the registry lacks comes back with the nearest it has', () => {
    const details = wsxDetails(['Heading', 'Table', 'Checklist'])
    expect(details.primitives.map((each) => each.name)).toEqual(['Table'])
    expect(details.unknown?.map((each) => each.name)).toEqual(['Heading', 'Checklist'])
    expect(details.primitives[0]?.props.map((each) => each.key)).toEqual(
      expect.arrayContaining(['bind', 'rows', 'columns']),
    )
  })

  test('the index stays small enough to read in one call', () => {
    expect(JSON.stringify(wsxIndex()).length).toBeLessThan(40_000)
  })
})
