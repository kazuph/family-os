import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { AiChatMetadata } from "@gadgets/workshop-shared/api";
import { useAuthenticatedApi } from "../AuthContext";
import { chatTitle, familyLabel, familyRelativeTime, familyUi } from "../familyUi";
import { logRpcFailure } from "../rpcErrors";

const RECENT_CHAT_LIMIT = 8;

export default function HomeRecentInternalChats() {
  const { authenticatedApi } = useAuthenticatedApi();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [chats, setChats] = useState<AiChatMetadata[]>([]);

  useEffect(() => {
    let cancelled = false;
    let overseer: ReturnType<typeof authenticatedApi.openGadget> | undefined;
    authenticatedApi.getInternalWorkspaceId()
      .then(async (id) => {
        if (cancelled || !id) return;
        overseer = authenticatedApi.openGadget(id);
        const list = await overseer.listChats();
        if (cancelled) return;
        const sorted = [...list].toSorted(
          (a, b) => b.lastActive.getTime() - a.lastActive.getTime(),
        );
        setWorkspaceId(id);
        setChats(sorted.slice(0, RECENT_CHAT_LIMIT));
      })
      .catch((err) => {
        logRpcFailure("Failed to load home chats:", err);
      });
    return () => {
      cancelled = true;
      overseer?.[Symbol.dispose]();
    };
  }, [authenticatedApi]);

  if (!workspaceId || chats.length === 0) return null;

  return (
    <section className="w-full" aria-label={familyLabel("Recent chats", familyUi.recentHomeChats)}>
      <h2 className="mb-2 text-[13px] font-medium tracking-[-0.25px] text-kumo-subtle">
        {familyLabel("Recent chats", familyUi.recentHomeChats)}
      </h2>
      <ul className="flex flex-col gap-0.5">
        {chats.map((chat) => (
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
