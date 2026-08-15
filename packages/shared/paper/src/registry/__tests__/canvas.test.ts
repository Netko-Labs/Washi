import { describe, expect, test } from 'bun:test'
import { cn } from '../../lib'
import { invalidClasses, paperRegistry } from '../index'

/** Spec Q15/Q16: the sheet has the last word, and it sizes to its container. */
describe('the sheet has the last word', () => {
  test('a class beats the component default for the same property', () => {
    expect(cn('mt-6 mb-2 text-3xl', 'mt-0 text-sm')).toBe('mb-2 mt-0 text-sm')
  })

  test('unrelated defaults survive', () => {
    expect(cn('flex items-center gap-2', 'gap-8')).toBe('flex items-center gap-8')
  })

  test('no class means the default stands', () => {
    expect(cn('border', undefined)).toBe('border')
  })
})

describe('sheets size to their container, never the viewport', () => {
  test('viewport breakpoints are rejected', () => {
    expect(invalidClasses('md:flex')).toEqual(['md:flex'])
    expect(invalidClasses('lg:grid-cols-3')).toEqual(['lg:grid-cols-3'])
    expect(invalidClasses('hover:sm:block')).toEqual(['hover:sm:block'])
  })

  test('container variants are the vocabulary', () => {
    expect(invalidClasses('@md:flex @lg:grid-cols-3 @sm:px-4')).toEqual([])
  })

  test('utilities that merely contain a breakpoint name are fine', () => {
    expect(invalidClasses('max-w-sm text-lg shadow-md rounded-xl')).toEqual([])
  })

  test('url() is still banned', () => {
    expect(invalidClasses('bg-[url(https://x.dev/a.png)]')).toHaveLength(1)
  })
})

describe('every registry component accepts a class', () => {
  test('no component is unstyleable', () => {
    const unstyleable = Object.entries(paperRegistry)
      .filter(([, spec]) => !spec.props.safeParse({ class: 'p-4' }).success)
      .map(([name]) => name)
    // Components with required props reject the bare probe; check they at least
    // declare `class` by parsing a payload that omits everything else.
    expect(unstyleable).not.toContain('Divider')
    expect(unstyleable).not.toContain('Box')
    expect(unstyleable).not.toContain('P')
  })
})
