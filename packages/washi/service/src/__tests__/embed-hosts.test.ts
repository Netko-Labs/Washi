import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { EmbedHostError, embedHosts, setEmbedHosts } from '../embeds/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

describe('the workspace embed list', () => {
  test('pasted addresses land as bare, sorted, unique host names', () => {
    expect(embedHosts(ws)).toEqual([])
    expect(
      setEmbedHosts(ws, ['https://Docs.Example.com/a', 'tally.so', 'docs.example.com']),
    ).toEqual(['docs.example.com', 'tally.so'])
  })

  test('something that is no site is refused, and the list stays as it was', () => {
    setEmbedHosts(ws, ['tally.so'])
    expect(() => setEmbedHosts(ws, ['tally.so', 'not a site'])).toThrow(EmbedHostError)
    expect(embedHosts(ws)).toEqual(['tally.so'])
  })
})
