import { describe, expect, it } from 'vitest'
import { DEFAULT_CHAT_TITLE } from '@gadgets/workshop-shared/api'
import { chatTitle, familyLabel, familyUi } from './familyUi'

describe('chatTitle', () => {
  it('maps the default English placeholder through familyLabel', () => {
    expect(chatTitle(DEFAULT_CHAT_TITLE)).toBe(familyLabel(DEFAULT_CHAT_TITLE, familyUi.newChat))
    expect(chatTitle('')).toBe(familyLabel(DEFAULT_CHAT_TITLE, familyUi.newChat))
    expect(chatTitle(undefined)).toBe(familyLabel(DEFAULT_CHAT_TITLE, familyUi.newChat))
  })

  it('leaves a specific title unchanged', () => {
    expect(chatTitle('週末の遠足')).toBe('週末の遠足')
  })
})
