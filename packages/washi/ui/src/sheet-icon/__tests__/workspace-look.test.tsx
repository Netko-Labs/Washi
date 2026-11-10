import { describe, expect, test } from 'bun:test'
import { SheetFrame, SheetLookProvider } from '@washi/paper'
import { renderToStaticMarkup } from 'react-dom/server'
import { SheetIcon } from '../sheet-icon'

describe('a page with no icon or cover wears the workspace’s (D139)', () => {
  test('the frame draws the defaults only where the page has none of its own', () => {
    const lent = (frame: Parameters<typeof SheetFrame>[0]) =>
      renderToStaticMarkup(
        <SheetLookProvider
          value={{ defaults: { cover: 'preset:sage', icon: '🍜' }, drawIcon: (name) => name }}
        >
          <SheetFrame {...frame} />
        </SheetLookProvider>,
      )
    const bare = lent({})
    expect(bare).toContain('wsx-cover')
    expect(bare).toContain('🍜')
    const own = lent({ icon: '🌱', cover: 'preset:ink' })
    expect(own).toContain('🌱')
    expect(own).not.toContain('🍜')
    expect(renderToStaticMarkup(<SheetFrame />)).not.toContain('wsx-cover')
  })

  test('an icon of the page’s own draws as it is, whatever the workspace lends', () => {
    expect(renderToStaticMarkup(<SheetIcon name="🌱" />)).toContain('🌱')
  })
})
