import { describe, expect, test } from 'bun:test'
import { compilePage } from '../pages'
import { pageCodeDiagnostics } from '../pages/check'
import { loadEngine } from '../scripts/engine'

const PAGE = `import { useRows } from 'washi'
import { sumBy } from 'lodash-es'
import { formatISO } from 'date-fns'
import { z } from 'zod'
import { Badge as Pill } from 'washi/ui'
import { label } from 'page:lib-1'

function Kpi({ title, value }: { title: string; value: number }) {
  return <Stat label={label(title)} value={value} />
}

const rows = useRows({ table: 'tasks' })
const points = z.number().parse(sumBy(rows, 'points'))

<Sheet title="Tasks">
  <Kpi title="points" value={points} />
  <Pill>{formatISO(0, { representation: 'date' }).slice(0, 2)}</Pill>
</Sheet>`

const LIB = `export function label(text: string) { return text.toUpperCase() }
<Sheet title="Lib" />`

const pages = (id: string) => (id === 'lib-1' ? LIB : null)

/** Runs a bundle the way a reader's sandbox will: `h` builds plain data, hooks answer from here. */
async function run(js: string): Promise<unknown> {
  const vm = (await loadEngine()).newContext()
  const prelude = `
globalThis.h = (name, props, ...children) => typeof name === 'function'
  ? name({ ...props, children })
  : { name, props: props || {}, children: children.flat() }
globalThis.Stat = 'Stat'; globalThis.Sheet = 'Sheet'
globalThis.__washi = { useRows: () => [{ points: 2 }, { points: 3 }] }`
  const result = vm.evalCode(`${prelude};\n${js}\nJSON.stringify(globalThis.__page.view())`)
  const value = result.error ? vm.dump(result.error) : JSON.parse(vm.dump(result.value))
  ;(result.error ?? result.value).dispose()
  vm.dispose()
  return value
}

describe('a page compiled for the sandbox (D100)', () => {
  test('its libraries, hooks, registry names and imported pages bundle and run', async () => {
    const compiled = await compilePage(PAGE, pages)
    if (!compiled.ok) throw new Error(compiled.error)
    expect(await run(compiled.js)).toEqual({
      name: 'Sheet',
      props: { title: 'Tasks' },
      children: [
        { name: 'Stat', props: { label: 'POINTS', value: 5 }, children: [] },
        { name: 'Badge', props: {}, children: ['19'] },
      ],
    })
  })

  test('an import off the list, or a page the reader cannot read, is refused in words', async () => {
    const fs = await compilePage(`import { readFileSync } from 'fs'\n<Sheet title="t" />`, pages)
    expect(fs).toMatchObject({ ok: false, error: expect.stringContaining('cannot import "fs"') })
    const hidden = await compilePage(`import { x } from 'page:secret'\n<Sheet title="t" />`, pages)
    expect(hidden).toMatchObject({ ok: false, error: expect.stringContaining('page:secret') })
  })

  test('a library path that climbs out of its folder is refused, at save and at compile', async () => {
    for (const path of [
      'lodash-es/../../package.json',
      'zod/../../../etc/hosts',
      'date-fns/.hidden',
    ]) {
      const source = `import x from '${path}'\n<Sheet title="t" />`
      expect(pageCodeDiagnostics(source)[0]?.message).toContain('cannot import')
      expect(await compilePage(source, pages)).toMatchObject({ ok: false })
    }
    const sub = await compilePage(
      `import { z } from 'zod/mini'\nconst n = z.number().parse(1)\n<Sheet title="t" />`,
      pages,
    )
    expect(sub.ok).toBe(true)
  })

  test('the save check catches a bad import and code that does not compile', () => {
    expect(pageCodeDiagnostics(PAGE)).toEqual([])
    const net = pageCodeDiagnostics(`import x from 'node:http'\n<Sheet title="t" />`)
    expect(net[0]?.message).toContain('cannot import "node:http"')
    const broken = pageCodeDiagnostics(`const a = (\n<Sheet title="t" />`)
    expect(broken.length).toBeGreaterThan(0)
  })
})

describe('an export that calls a hook', () => {
  test('is refused at save; one that exports a function calling it is not', () => {
    const eager = pageCodeDiagnostics(
      `import { useRows } from 'washi'\nexport const open = useRows({ table: 'tasks' })\n<Sheet title="t" />`,
    )
    expect(eager[0]?.message).toContain('an export calls useRows() as the page loads')
    const lent = [
      `import { useRows } from 'washi'\nexport function useOpen() { return useRows({ table: 'tasks' }) }\n<Sheet title="t" />`,
      `import { useRows } from 'washi'\nexport const useOpen = () => useRows({ table: 'tasks' })\n<Sheet title="t" />`,
      `import { useRows } from 'washi'\nconst open = useRows({ table: 'tasks' })\n<Sheet title="t" />`,
    ]
    for (const source of lent) expect(pageCodeDiagnostics(source)).toEqual([])
  })
})
