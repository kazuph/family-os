// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { announceFamilyProfileChanged, isFamilyProfileChangedEvent } from './familyProfileEvents'

describe('Family profile tab events', () => {
  afterEach(() => localStorage.clear())

  it('writes a fresh token that other tabs recognize', () => {
    announceFamilyProfileChanged()
    const key = localStorage.key(0)
    const firstToken = key ? localStorage.getItem(key) : null

    expect(key).not.toBeNull()
    expect(firstToken).not.toBeNull()
    expect(isFamilyProfileChangedEvent(new StorageEvent('storage', { key }))).toBe(true)

    announceFamilyProfileChanged()
    expect(localStorage.getItem(key!)).not.toBe(firstToken)
  })

  it('ignores unrelated storage changes', () => {
    expect(isFamilyProfileChangedEvent(new StorageEvent('storage', { key: 'other' }))).toBe(false)
  })
})
