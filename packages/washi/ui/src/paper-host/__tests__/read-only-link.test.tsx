import { describe, expect, test } from 'bun:test'
import { type PaperHost, PaperProvider, WsxView } from '@washi/paper'
import { parse } from '@washi/wsx'
import { renderToStaticMarkup } from 'react-dom/server'

const PAGE = parse(`<Sheet title="Book a call">
  <Agenda bind={{ table: "appts" }} date="when" add={["title"]} />
  <Form table="appts" fields={["title"]} />
  <Form table="appts" fields={["title"]} trigger="Add an idea" />
</Sheet>`)

const base: PaperHost = {
  runQuery: async () => ({ rows: [], total: 0 }),
  runAction: async () => undefined,
  resolveSheet: async () => null,
  openSheet: () => undefined,
  toggleTask: async () => undefined,
  describeTable: async () => null,
}
const LINK: PaperHost = { ...base, isReadOnly: true }
const SUGGESTING: PaperHost = { ...LINK, suggestRow: async () => undefined }

const draw = (host: PaperHost) =>
  renderToStaticMarkup(
    <PaperProvider host={host}>
      <WsxView root={PAGE} />
    </PaperProvider>,
  )

describe('a read-only link draws no way to add (D120)', () => {
  test('no day +, no form, no form button', () => {
    const html = draw(LINK)
    expect(html).not.toContain('wsx-agenda-add')
    expect(html).not.toContain('Add an idea')
    expect(html).not.toContain('Loading…')
  })

  test('a link that takes suggestions draws them again, as a member sees them', () => {
    for (const host of [SUGGESTING, base]) {
      const html = draw(host)
      expect(html).toContain('wsx-agenda-add')
      expect(html).toContain('Add an idea')
    }
  })
})
