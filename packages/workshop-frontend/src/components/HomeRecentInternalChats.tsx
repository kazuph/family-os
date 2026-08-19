import { Link } from "@tanstack/react-router";
import { chatTitle, familyLabel, familyRelativeTime, familyUi } from "../familyUi";
import { selectRecentInternalHomeChats, useInternalHomeChats } from "../internalHomeChats";

export default function HomeRecentInternalChats() {
  const { workspaceId, chats } = useInternalHomeChats();
  const recentChats = selectRecentInternalHomeChats(chats);

  if (!workspaceId || recentChats.length === 0) return null;

  return (
    <section className="w-full" aria-label={familyLabel("Recent chats", familyUi.recentHomeChats)}>
      <h2 className="mb-2 text-[13px] font-medium tracking-[-0.25px] text-kumo-subtle">
        {familyLabel("Recent chats", familyUi.recentHomeChats)}
      </h2>
      <ul className="flex flex-col gap-0.5">
        {recentChats.map((chat) => (
          <li key={chat.id}>
            <Link
              to="/workspace/$id"
              params={{ id: workspaceId }}
              search={{ chat: chat.id }}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ease-out hover:bg-kumo-tint"
            >
              <span className="min-w-0 truncate text-[13px] leading-5 text-kumo-default">
                {chatTitle(chat.title)}
              </span>
              <span className="flex-shrink-0 text-[11px] leading-4 text-kumo-inactive">
                {familyRelativeTime(chat.lastActive)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
