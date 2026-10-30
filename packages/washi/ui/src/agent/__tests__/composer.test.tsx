import { describe, expect, test } from 'bun:test'
import type { AgentSession, SheetSummary } from '@washi/domain'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ATTACH_PAGE_ROWS,
  approvalsOf,
  COMPOSER_MIN_CAP_PX,
  composerCap,
  type InferenceView,
  isYoloOffered,
  nextApprovals,
  pagesMatching,
} from '../lib'
import { YoloChip, YoloNote } from '../yolo-chip'

const view = (patch: Partial<InferenceView> = {}): InferenceView => ({
  active: 'api_key',
  provider: 'anthropic',
  defaultModel: null,
  localModel: null,
  plan: null,
  enabledModels: null,
  approvalMode: 'ask',
  yoloAllowed: true,
  ...patch,
})

const chat = (approvals: AgentSession['approvals']): AgentSession => ({
  id: 's1',
  provider: 'claude',
  title: 'Chat',
  status: 'idle',
  costUsd: 0,
  model: null,
  effort: null,
  approvals,
  createdBy: 'ana',
  anchor: null,
  createdAt: '',
  updatedAt: '',
})

describe('the composer grows with its text', () => {
  test('up to four tenths of its room', () => {
    expect(composerCap(1000)).toBe(400)
    expect(composerCap(620)).toBe(248)
  })

  test('never under a few lines, however small the room', () => {
    expect(composerCap(100)).toBe(COMPOSER_MIN_CAP_PX)
  })
})

describe('the YOLO chip (D115)', () => {
  test('shows only where the workspace allows it and Washi is awake', () => {
    expect(isYoloOffered(view())).toBe(true)
    expect(isYoloOffered(view({ yoloAllowed: false }))).toBe(false)
    expect(isYoloOffered(view({ active: null }))).toBe(false)
    expect(isYoloOffered(null)).toBe(false)
    expect(renderToStaticMarkup(<YoloChip session={null} inference={view()} />)).toContain('YOLO')
    expect(
      renderToStaticMarkup(<YoloChip session={null} inference={view({ yoloAllowed: false })} />),
    ).toBe('')
  })

  test('off by default, on says so under the composer', () => {
    const off = renderToStaticMarkup(<YoloChip session={chat(null)} inference={view()} />)
    expect(off).toContain('aria-checked="false"')
    expect(renderToStaticMarkup(<YoloNote session={chat(null)} inference={view()} />)).toBe('')
    const on = renderToStaticMarkup(<YoloChip session={chat('auto')} inference={view()} />)
    expect(on).toContain('aria-checked="true"')
    expect(renderToStaticMarkup(<YoloNote session={chat('auto')} inference={view()} />)).toContain(
      'won’t ask',
    )
  })

  test('a conversation follows the workspace until it says otherwise; going back sends null', () => {
    expect(approvalsOf(chat(null), view({ approvalMode: 'auto' }))).toBe('auto')
    expect(nextApprovals(chat(null), view())).toBe('auto')
    expect(nextApprovals(chat('auto'), view())).toBeNull()
    expect(nextApprovals(chat(null), view({ approvalMode: 'auto' }))).toBe('ask')
  })
})

describe('the attach picker', () => {
  const page = (title: string) => ({ id: title, title }) as SheetSummary

  test('offers pages whose title holds the words, a screenful at most', () => {
    const sheets = [page('Roadmap'), page('Road trip'), page('Wiki')]
    expect(pagesMatching(sheets, ' road ').map((sheet) => sheet.id)).toEqual([
      'Roadmap',
      'Road trip',
    ])
    const many = Array.from({ length: 20 }, (_, index) => page(`Page ${index}`))
    expect(pagesMatching(many, '')).toHaveLength(ATTACH_PAGE_ROWS)
  })
})
