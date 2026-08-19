import { describe, expect, it } from 'vitest'
import type { AiChatMetadata } from '@gadgets/workshop-shared/api'
import {
  RECENT_CHAT_LIMIT,
  selectRecentInternalHomeChats,
  sortInternalHomeChats,
} from './internalHomeChats'

function chat(id: number, lastActive: number): AiChatMetadata {
  return {
    id,
    title: `Chat ${id}`,
    started: new Date(lastActive),
    lastActive: new Date(lastActive),
  }
}

describe('internal home chat discovery', () => {
  const chats = Array.from({ length: RECENT_CHAT_LIMIT + 1 }, (_, index) =>
    chat(index + 1, index + 1),
  )
  const newestFirst = chats.map(({ id }) => id).toReversed()

  it('keeps the sidebar and Home recent surface on the shared limit', () => {
    expect(selectRecentInternalHomeChats(chats).map(({ id }) => id)).toEqual(
      newestFirst.slice(0, RECENT_CHAT_LIMIT),
    )
  })

  it('keeps every chat available for the all-chats route', () => {
    expect(sortInternalHomeChats(chats).map(({ id }) => id)).toEqual(newestFirst)
  })
})
