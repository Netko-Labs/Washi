import { describe, expect, test } from 'bun:test'
import { mayGiveKey } from '../utils'

describe('who the first run offers the key form', () => {
  test('owners and admins, as ownerProcedure lets them save it', () => {
    expect(mayGiveKey('owner')).toBe(true)
    expect(mayGiveKey('admin')).toBe(true)
  })

  test('never a member, whose save would be refused', () => {
    expect(mayGiveKey('member')).toBe(false)
  })
})
