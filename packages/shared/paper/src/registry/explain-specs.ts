import type { ComponentSpec } from '@washi/wsx'
import { z } from 'zod'
import { p } from './spec-kit'
import { widthSchema } from './surface'

const WALL_MOMENT = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):[0-5]\d)?$/

function isOnCalendar(moment: string): boolean {
  const [year = 0, month = 0, day = 0] = moment.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDate() === day
}

const title = z.string().min(1).max(120)

/** A Step inside Steps: the number is drawn for it, the title is what the step is. */
export const STEPS_STEP_PROPS = p(
  { marker: z.string().min(1).max(8).optional(), title },
  'nodes',
).props

/** What a knowledge-base page explains with (D107): a how-to, a choice, the questions, a date. */
export const EXPLAIN_SPECS: Record<string, ComponentSpec> = {
  Steps: p({}, 'nodes', {
    hints: { steps: 'one <Step title> per step; Steps numbers them', start: 'Steps counts from 1' },
  }),
  Compare: p({ width: widthSchema.optional() }, 'nodes', {
    hints: { options: 'one <Option title> per choice, 2–4; pick marks the recommended one' },
  }),
  Option: p({ title, pick: z.boolean().optional() }, 'nodes', {
    within: ['Compare'],
    hints: { recommended: 'use pick', label: 'use title' },
  }),
  Faq: p({}, 'nodes', {
    hints: { items: 'one <Question title> per question; its children are the answer' },
  }),
  Question: p({ title }, 'nodes', {
    within: ['Faq'],
    hints: { answer: 'the answer is the Question’s children', label: 'use title' },
  }),
  Countdown: p(
    {
      to: z
        .string()
        .regex(WALL_MOMENT, 'to reads like 2026-12-24 or 2026-12-24T18:00, on the reader’s clock')
        .refine(isOnCalendar, 'that day is not on the calendar'),
      label: z.string().min(1).max(80).optional(),
    },
    'none',
    { hints: { date: 'use to', until: 'use to', title: 'use label' } },
  ),
}
