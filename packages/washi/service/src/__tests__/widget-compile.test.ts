import { describe, expect, test } from 'bun:test'
import { PAGE_HOOKS, WIDGET_FRAME, WIDGET_HOOKS, WIDGET_WORDS } from '@washi/paper/registry'
import { compilePage, compileWidget } from '../pages'
import { loadEngine } from '../scripts/engine'
import { checkSource } from '../sheets/service'

const PAGE = `import { useNow, useRef, useRows } from 'washi'
import { format } from 'date-fns'
import { tick } from 'page:lib-1'

function Clock({ size = 40 }) {
  const face = useRef(null)
  return <div ref={face} style={{ fontSize: size }}>{tick(format(useNow(), 'HH:mm'))}</div>
}

const rows = useRows({ table: 'tasks' })

<Sheet title="Ops">
  <Stat label="Open" value={rows.length} />
  <Widget title="Clock" height={120}><Clock size={rows.length * 10} /></Widget>
</Sheet>`

const LIB = `export const tick = (time: string) => \`\${time} ·\`\n<Sheet title="Lib" />`
const pages = (id: string) => (id === 'lib-1' ? LIB : null)

const errors = (source: string) =>
  checkSource(source)
    .diagnostics.filter((each) => each.severity === 'error')
    .map((each) => each.message)

/** The page's own run, as the reader's sandbox draws it: a widget's component is never called. */
async function draw(js: string): Promise<unknown> {
  const vm = (await loadEngine()).newContext()
  const prelude = `
globalThis.h = (name, props, ...children) => typeof name === 'function'
  ? name({ ...props, children })
  : { name, props: props || {}, children: children.flat() }
globalThis.Stat = 'Stat'; globalThis.Sheet = 'Sheet'; globalThis.Widget = 'Widget'
globalThis.__washi = { useRows: () => [{ id: 'a' }, { id: 'b' }] }`
  const result = vm.evalCode(`${prelude};\n${js}\nJSON.stringify(globalThis.__page.view())`)
  const value = result.error ? vm.dump(result.error) : JSON.parse(vm.dump(result.value))
  ;(result.error ?? result.value).dispose()
  vm.dispose()
  return value
}

describe('a widget is JSX (D113)', () => {
  test('the page draws its Widget with the component named and its props evaluated', async () => {
    const compiled = await compilePage(PAGE, pages)
    if (!compiled.ok) throw new Error(compiled.error)
    expect(await draw(compiled.js)).toEqual({
      name: 'Sheet',
      props: { title: 'Ops' },
      children: [
        { name: 'Stat', props: { label: 'Open', value: 2 }, children: [] },
        {
          name: 'Widget',
          props: { title: 'Clock', height: 120 },
          children: [{ name: 'Clock', props: { size: 20 }, children: [] }],
        },
      ],
    })
  })

  test('its component bundles with React, the frame’s washi and the page’s own imports', async () => {
    const compiled = await compileWidget(PAGE, 'Clock', pages)
    if (!compiled.ok) throw new Error(compiled.error)
    expect(compiled.js.length).toBeGreaterThan(100_000)
    expect(compiled.js).toContain('This widget stopped')
    expect(compiled.js).not.toContain('globalThis.__washi')
  })

  test('only a component of the page, and only imports off the page’s list', async () => {
    expect(await compileWidget(PAGE, 'Stat', pages)).toMatchObject({
      ok: false,
      error: expect.stringContaining("not one of this page's components"),
    })
    for (const path of ['react', 'react-dom/client', 'node:fs']) {
      const source = `import x from '${path}'\nfunction Clock() { return <div /> }\n<Sheet title="t"><Widget><Clock /></Widget></Sheet>`
      expect(await compileWidget(source, 'Clock', pages)).toMatchObject({
        ok: false,
        error: expect.stringContaining(`cannot import "${path}"`),
      })
    }
    const hidden = `import { Clock } from 'page:secret'\n<Sheet title="t"><Widget><Clock /></Widget></Sheet>`
    expect(await compileWidget(hidden, 'Clock', pages)).toMatchObject({
      ok: false,
      error: expect.stringContaining('page:secret'),
    })
  })

  test('the frame lends every name page code imports, and React’s own hooks', () => {
    const lent = new Bun.Transpiler({ loader: 'js' }).scan(WIDGET_FRAME).exports
    for (const name of [...PAGE_HOOKS, ...WIDGET_HOOKS]) expect(lent).toContain(name)
  })
})

describe('saving a page with a widget', () => {
  test('a component child is taken; text, as HTML was, is refused in words', () => {
    expect(errors(PAGE)).toEqual([])
    expect(errors('<Sheet title="t"><Widget>{`<div id="x"></div>`}</Widget></Sheet>')).toEqual([
      WIDGET_WORDS,
    ])
  })

  test('DOM elements outside a widget’s component are refused', () => {
    const stray = `function Panel() { return <div>hi</div> }\n<Sheet title="t"><Panel /></Sheet>`
    expect(errors(stray)[0]).toContain('<div> is the DOM')
  })
})
