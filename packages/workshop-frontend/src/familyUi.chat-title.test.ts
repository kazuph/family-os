import { describe, expect, it } from 'vitest'
import { DEFAULT_CHAT_TITLE, INTERNAL_WORKSPACE_TITLE } from '@gadgets/workshop-shared/api'
import { chatTitle, familyLabel, familyUi, workspaceTitle } from './familyUi'

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

describe('workspaceTitle', () => {
  it('maps the internal home workspace title through familyLabel', () => {
    expect(workspaceTitle(INTERNAL_WORKSPACE_TITLE)).toBe(
      familyLabel(INTERNAL_WORKSPACE_TITLE, familyUi.homeDestination),
    )
  })
})
