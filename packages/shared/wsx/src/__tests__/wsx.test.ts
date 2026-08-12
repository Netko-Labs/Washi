import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import {
  extractRefs,
  extractText,
  parse,
  serialize,
  validate,
  WsxParseError,
  type WsxRegistry,
} from '../index'

const SAMPLE = `
<Sheet title="Q3 Roadmap" icon="🗺️" tags={['planning']}>
  <H1>Q3 Roadmap</H1>
  <Callout tone="warning" class="mt-6">Dates aspirational.</Callout>
  <TaskList bind={{ table: 'tasks', where: [{ column: 'status', op: 'eq', value: 'todo' }] }} />
  <Ref sheet="0198c2f0">design doc</Ref>
</Sheet>
`

describe('parse', () => {
  test('parses elements, literal props, and text', () => {
    const root = parse(SAMPLE)
    expect(root.name).toBe('Sheet')
    expect(root.props.title).toBe('Q3 Roadmap')
    expect(root.props.tags).toEqual(['planning'])
    expect(root.children).toHaveLength(4)
    const taskList = root.children[2]
    expect(taskList?.kind === 'element' && taskList.props.bind).toEqual({
      table: 'tasks',
      where: [{ column: 'status', op: 'eq', value: 'todo' }],
    })
  })

  test('rejects executable content', () => {
    expect(() => parse('<Sheet title={window.alert("x")} />')).toThrow(WsxParseError)
    expect(() => parse('<Sheet onClick={() => 1} />')).toThrow(WsxParseError)
    expect(() => parse('<Sheet>{1 + 2}</Sheet>')).toThrow(WsxParseError)
  })

  test('rejects host elements, fragments, spreads', () => {
    expect(() => parse('<div>hi</div>')).toThrow(WsxParseError)
    expect(() => parse('<><Sheet /></>')).toThrow(WsxParseError)
    expect(() => parse('<Sheet {...props} />')).toThrow(WsxParseError)
  })

  test('reports syntax errors with location', () => {
    try {
      parse('<Sheet><H1>oops</Sheet>')
      throw new Error('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(WsxParseError)
      expect((error as WsxParseError).diagnostics[0]?.line).toBeDefined()
    }
  })
})

describe('serialize', () => {
  test('round-trips through parse', () => {
    const root = parse(SAMPLE)
    const text = serialize(root)
    expect(parse(text)).toEqual(root)
  })
})

describe('validate', () => {
  const registry: WsxRegistry = {
    Sheet: {
      props: z.object({ title: z.string(), icon: z.string().optional() }).strict(),
      children: 'nodes',
    },
    H1: { props: z.object({}).strict(), children: 'text' },
    Divider: { props: z.object({}).strict(), children: 'none' },
  }

  test('flags unknown components, bad props, child policy violations', () => {
    const root = parse('<Sheet title="t"><H1><Divider /></H1><Divider>x</Divider><Ghost /></Sheet>')
    const diagnostics = validate(root, registry)
    const messages = diagnostics.map((diagnostic) => diagnostic.message).join('\n')
    expect(messages).toContain('takes text children only')
    expect(messages).toContain('does not take children')
    expect(messages).toContain('<Ghost> is not a registry component')
  })

  test('requires Sheet root and clean props pass', () => {
    expect(validate(parse('<H1>x</H1>'), registry)[0]?.message).toContain('root element')
    expect(validate(parse('<Sheet title="ok"><H1>hi</H1></Sheet>'), registry)).toEqual([])
  })
})

describe('extract', () => {
  test('text and refs', () => {
    const root = parse(SAMPLE)
    expect(extractText(root)).toContain('Q3 Roadmap')
    expect(extractText(root)).toContain('Dates aspirational.')
    expect(extractRefs(root)).toEqual(['0198c2f0'])
  })
})
