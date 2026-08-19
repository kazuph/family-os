import { createFileRoute, Link } from '@tanstack/react-router'
import { ChatCircleText } from '@phosphor-icons/react'
import { chatTitle, familyLabel, familyRelativeTime, familyUi } from '../familyUi'
import { useInternalHomeChats } from '../internalHomeChats'
import { useDocumentTitle } from '../useDocumentTitle'

export const Route = createFileRoute('/chats')({
  component: AllHomeChatsPage,
})

function AllHomeChatsPage() {
  const { workspaceId, chats, loading } = useInternalHomeChats()
  useDocumentTitle(familyLabel('All chats', familyUi.allHomeChats))

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-6 sm:px-10">
      <header className="px-3 pb-3 pt-10">
        <h1 className="text-2xl font-semibold tracking-tight text-kumo-default">
          {familyLabel('All chats', familyUi.allHomeChats)}
        </h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-10">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-kumo-elevated" />
            ))}
          </div>
        ) : !workspaceId || chats.length === 0 ? (
          <p className="py-6 text-[13px] text-kumo-inactive">
            {familyLabel('No chats yet.', familyUi.noHomeChats)}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  to="/workspace/$id"
                  params={{ id: workspaceId }}
                  search={{ chat: chat.id }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-kumo-default transition-colors hover:bg-kumo-tint"
                >
                  <ChatCircleText size={16} className="shrink-0 text-kumo-subtle" />
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                    {chatTitle(chat.title)}
                  </span>
                  <span className="shrink-0 text-[11px] text-kumo-inactive">
                    {familyRelativeTime(chat.lastActive)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
