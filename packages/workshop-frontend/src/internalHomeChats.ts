import { useEffect, useState } from 'react'
import type { AiChatMetadata } from '@gadgets/workshop-shared/api'
import { useAuthenticatedApi } from './AuthContext'
import { logRpcFailure } from './rpcErrors'

export const RECENT_CHAT_LIMIT = 8

export function sortInternalHomeChats(chats: AiChatMetadata[]): AiChatMetadata[] {
  return [...chats].toSorted(
    (a, b) => b.lastActive.getTime() - a.lastActive.getTime(),
  )
}

export function selectRecentInternalHomeChats(chats: AiChatMetadata[]): AiChatMetadata[] {
  return sortInternalHomeChats(chats).slice(0, RECENT_CHAT_LIMIT)
}

export function useInternalHomeChats() {
  const { authenticatedApi } = useAuthenticatedApi()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [chats, setChats] = useState<AiChatMetadata[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setWorkspaceId(null)
    setChats([])
    setLoading(true)
    authenticatedApi.getInternalWorkspaceId()
      .then(async (id) => {
        if (cancelled) return
        if (!id) {
          setLoading(false)
          return
        }
        using overseer = authenticatedApi.openGadget(id)
        const list = await overseer.listChats()
        if (cancelled) return
        setWorkspaceId(id)
        setChats(sortInternalHomeChats(list))
        setLoading(false)
      })
      .catch((err) => {
        logRpcFailure('Failed to load home chats:', err)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authenticatedApi])

  return { workspaceId, chats, loading }
}
