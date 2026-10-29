import type { Specimen } from '../types'
import { WELCOME } from './shared'

export const TEXT_SPECIMENS: Record<string, Specimen> = {
  Title: { props: { level: 1 }, children: 'Weekly review' },
  Text: {
    children: 'The format is the argument: a page that reads like paper and runs like a program.',
  },
  List: {
    props: { marker: 'bullet' },
    children:
      '<Item>Cut the release branch</Item><Item>Notarize the build</Item><Item>Write the notes</Item>',
  },
  Item: {
    props: { done: true },
    children: 'Cut the release branch',
    wrap: '<List marker="check"><Here /><Item>Notarize the build</Item></List>',
  },
  Quote: { children: 'Nothing here names a colour, a size in px or a margin.' },
  Code: { props: { lang: 'json' }, children: '{ "ok": true }' },
  Pair: { props: { term: 'Measure' }, children: 'The width the feel gives the page.' },
  Note: { children: 'A footnote, numbered by the renderer.' },
  Source: { children: 'washi.md, 2026' },
  Money: { props: { value: 1234.5, currency: 'EUR' } },
  Mark: { children: 'the point', wrap: '<Text>Read <Here /> and move on.</Text>' },
  Kbd: { children: '⌘J', wrap: '<Text>Press <Here /> to open the palette.</Text>' },
  Ref: {
    props: { sheet: WELCOME },
    children: 'the welcome page',
    wrap: '<Text>See <Here />.</Text>',
  },
  Tag: { children: 'spec', wrap: '<Text>Filed under <Here />.</Text>' },

  Card: {
    props: { title: 'Outline' },
    children: '<Text size="sm">Hairline border, the default.</Text>',
  },
  Callout: {
    props: { tone: 'info', title: 'Binds refresh on open' },
    children: 'Every bound block refetches when the page opens.',
  },
  Redact: {
    props: { reason: 'client names' },
    children: '<Text>Signed with Acme and Kōbō this quarter.</Text>',
  },
  Hero: { props: { title: 'Q3 board', subtitle: 'Drag to move. Changes save.' } },
  Figure: {
    props: {
      src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=70',
      alt: 'Mountains under a night sky',
      caption: 'Aspect is held before the bytes arrive.',
      ratio: '16:9',
    },
  },
}
