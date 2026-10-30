import { describe, expect, test } from 'bun:test'
import { hasErrors, parse, serialize, validate, type WsxElement } from '@washi/wsx'
import { paperRegistry } from '../../../registry'
import { freeSpot, fromWsx, nextId, toWsx } from '../lib'

const SOURCE = `<Sheet title="Ideas"><Canvas>
  <Node id="intake" x={0} y={0} tone="info">Intake</Node>
  <Node id="review" x={240} y={0} page="page-1">Review</Node>
  <Edge from="intake" to="review" label="approved" />
</Canvas></Sheet>`

const canvasOf = (source: string) => parse(source).children[0] as WsxElement

describe('a canvas is markup both ways', () => {
  test('nodes and edges come out of the markup', () => {
    const { nodes, edges } = fromWsx(canvasOf(SOURCE))
    expect(nodes.map((node) => [node.id, node.position, node.data])).toEqual([
      ['intake', { x: 0, y: 0 }, { label: 'Intake', tone: 'info', page: null }],
      ['review', { x: 240, y: 0 }, { label: 'Review', tone: null, page: 'page-1' }],
    ])
    expect(edges).toEqual([
      { id: 'intake->review', source: 'intake', target: 'review', label: 'approved' },
    ])
  })

  test('a moved node and a dropped node write back as valid WSX, edges to the dropped one go too', () => {
    const canvas = canvasOf(SOURCE)
    const { nodes, edges } = fromWsx(canvas)
    const [intake] = nodes
    if (!intake) throw new Error('no node')
    const moved = toWsx(canvas, [{ ...intake, position: { x: 12.4, y: 80.6 } }], edges)
    const source = serialize({ ...parse(SOURCE), children: [moved] })
    expect(source).toContain('<Node id="intake" x={12} y={81} tone="info">Intake</Node>')
    expect(source).not.toContain('<Edge')
    expect(hasErrors(validate(parse(source), paperRegistry))).toBe(false)
  })

  test('the markup a page or Washi writes is checked like any other', () => {
    expect(hasErrors(validate(parse(SOURCE), paperRegistry))).toBe(false)
    const stray = '<Sheet title="t"><Node id="a" x={0} y={0}>Lost</Node></Sheet>'
    expect(hasErrors(validate(parse(stray), paperRegistry))).toBe(true)
  })

  test('a new node never takes an id already in use', () => {
    const { nodes } = fromWsx(canvasOf(SOURCE))
    expect(nextId(nodes)).toBe('idea-3')
  })

  test('a new idea steps off the ones already where it would land', () => {
    const { nodes } = fromWsx(canvasOf(SOURCE))
    expect(freeSpot(nodes, 100, 100)).toEqual({ x: 100, y: 100 })
    expect(freeSpot(nodes, 0.4, -0.3)).toEqual({ x: 24.4, y: 23.7 })
    const stacked = fromWsx(
      canvasOf(
        '<Sheet title="t"><Canvas><Node id="a" x={331} y={170}>A</Node><Node id="b" x={355} y={194}>B</Node></Canvas></Sheet>',
      ),
    ).nodes
    expect(freeSpot(stacked, 331, 170)).toEqual({ x: 379, y: 218 })
  })
})
