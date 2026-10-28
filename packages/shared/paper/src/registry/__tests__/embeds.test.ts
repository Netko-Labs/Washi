import { describe, expect, test } from 'bun:test'
import { parse, validate } from '@washi/wsx'
import { embedHost, knownEmbed, paperRegistry } from '../index'

const player = (src: string) => knownEmbed(src)?.player ?? null

describe('embeds', () => {
  test('a built-in provider turns its page into its player', () => {
    expect(player('https://www.youtube.com/watch?v=jNQXAC9IVRw')).toBe(
      'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw',
    )
    expect(player('https://youtu.be/jNQXAC9IVRw')).toContain('/embed/jNQXAC9IVRw')
    expect(player('https://open.spotify.com/intl-es/track/4uLU6hMCjMI75M1A2tKUQC')).toBe(
      'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
    )
    expect(player('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871')
    expect(player('https://www.loom.com/share/abc123')).toBe('https://www.loom.com/embed/abc123')
  })

  test('an unknown site, a page a provider cannot play, or http is no built-in', () => {
    expect(knownEmbed('https://example.com/widget')).toBeNull()
    expect(knownEmbed('https://www.google.com/search?q=x')).toBeNull()
    expect(knownEmbed('http://www.youtube.com/watch?v=x')).toBeNull()
  })

  test('the page refuses http before anything renders', () => {
    const errors = (src: string) =>
      validate(parse(`<Sheet title="t"><Embed src="${src}" /></Sheet>`), paperRegistry)
    expect(errors('https://example.com/a')).toEqual([])
    expect(errors('http://example.com/a').length).toBeGreaterThan(0)
  })

  test('a listed host is a bare name, whatever was pasted', () => {
    expect(embedHost('https://Docs.Example.com/path')).toBe('docs.example.com')
    expect(embedHost('localhost')).toBeNull()
    expect(embedHost('not a host')).toBeNull()
  })
})
