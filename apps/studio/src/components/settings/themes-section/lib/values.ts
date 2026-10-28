import type { ThemeMode } from '@washi/paper/registry'
import type { Option } from '../../lib'
import type { TokenGroup } from './types'

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    label: 'Paper',
    tokens: [
      { key: 'bg', label: 'Page' },
      { key: 'card', label: 'Card' },
      { key: 'mutedBg', label: 'Quiet fill' },
      { key: 'border', label: 'Hairline' },
    ],
  },
  {
    label: 'Ink',
    tokens: [
      { key: 'ink', label: 'Ink' },
      { key: 'muted', label: 'Quiet ink' },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { key: 'accent', label: 'Accent' },
      { key: 'accentInk', label: 'On accent' },
    ],
  },
]

export const MODE_OPTIONS: readonly Option<ThemeMode>[] = [
  { id: 'light', label: 'Light', desc: 'The colours a light page wears' },
  { id: 'dark', label: 'Dark', desc: 'The colours a dark page wears' },
]

/** What the preview draws: a little of everything a theme colours. */
export const PREVIEW_SOURCE = `<Sheet title="Preview" theme="ws:preview">
  <Title>Weekly review</Title>
  <Text>Three things shipped, one slipped. <Mark>Read this first.</Mark></Text>
  <Row gap="tight"><Badge tone="accent">accent</Badge><Badge tone="success">done</Badge><Badge tone="warning">blocked</Badge><Badge>draft</Badge></Row>
  <Callout tone="accent" title="Next up">The board moves to Thursday.</Callout>
  <Grid class="grid-2"><Stat label="Open" value="12" /><Stat label="Closed" value="31" trend="up" /></Grid>
  <List marker="check"><Item done>Covers ship</Item><Item>Themes land</Item></List>
</Sheet>`
