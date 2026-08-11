import { classifyRpcError, logRpcFailure } from "../rpcErrors";
import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useKumoToastManager } from "@cloudflare/kumo";
import { ChatInput } from "../ChatInterface";
import MeshBackground from "../components/MeshBackground";
import HomeTaskSuggestions from "../components/AppShell/HomeTaskSuggestions";
import HomeWorkspaceSelector from "../components/HomeWorkspaceSelector";
import HomeRecentInternalChats from "../components/HomeRecentInternalChats";
import { useAuthenticatedApi } from "../AuthContext";
import { RpcStub } from "capnweb";
import {
  Overseer,
  AiChatAuthorInfo,
  CapsuleSpecifier,
  ChatAttachmentHandle,
  MessageFormatRef,
  SlashCommandRequest,
} from "@gadgets/workshop-shared/api";
import type { HomeWorkspaceDestinationId } from "../homeWorkspaceTarget";
import {
  getStoredSelectedModel,
  persistSelectedModel,
} from "../modelSelection";
import { useDocumentTitle } from "../useDocumentTitle";
import { homePromptFromSearch } from "../homePrompt";
import { familyLabel, familyUi } from "../familyUi";
import { composerDraftStorageKey } from "../composerDraft";

type HomeSearch = { prompt?: string };

export const Route = createFileRoute("/")({
  component: HomePage,
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    prompt: homePromptFromSearch(search.prompt),
  }),
});

// The Home page is the "new workspace" launcher. Persistent navigation (recents, favorites) lives
// in the AppShell rail, so this page focuses on a single thing: composing the first message of a
// new gadget — a centered column with a hero, the prompt composer, and a few task suggestions.
function HomePage() {
  return <HomePageContent prompt={Route.useSearch().prompt} />;
}

export function HomePageContent({ prompt }: HomeSearch) {
  useDocumentTitle(familyLabel("Home", familyUi.home));

  const { authenticatedApi, currentUser } = useAuthenticatedApi();
  const navigate = useNavigate();
  const toasts = useKumoToastManager();

  const [models, setModels] = useState<AiChatAuthorInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<HomeWorkspaceDestinationId>(null);
  const [draftText, setDraftText] = useState("");
  // Bumped each time a task suggestion is picked; the composer re-seeds its text off the nonce.
  const [seedNonce, setSeedNonce] = useState(0);

  useEffect(() => {
    if (!prompt) return;
    setDraftText(prompt);
    setSeedNonce((previous) => previous + 1);
    navigate({ to: "/", search: {}, replace: true });
  }, [navigate, prompt]);

  useEffect(() => {
    let cancelled = false;
    authenticatedApi.listModels()
      .then((list) => {
        if (cancelled) return;
        setModels(list);
        setSelectedModel(getStoredSelectedModel(list));
      })
      .catch((err) => {
        logRpcFailure("Failed to fetch models:", err);
        // Toast unless it's a connection error (reconnect refetches); a do-reset here already
        // survived the Worker's same-colo retry, so the user should hear about it.
        if (classifyRpcError(err) !== "connection") {
          toasts.add({
            title: familyLabel("Couldn't load AI models", familyUi.failedLoadModels),
            variant: "error",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authenticatedApi]);

  const handleModelChange = useCallback((value: string | null) => {
    setSelectedModel(value);
    persistSelectedModel(value);
  }, []);

  const handleDestinationChange = useCallback((id: HomeWorkspaceDestinationId) => {
    setDestinationId(id);
  }, []);

  // Reuse one overseer stub for the current destination so attach/capsule setup and submit share
  // the same workspace. Default is the per-profile internal home workspace; a selected id opens
  // that existing visible workspace.
  const overseerRef = useRef<{ stub: RpcStub<Overseer>; key: string } | null>(null);
  const destinationKey = destinationId ?? "internal";

  const ensureOverseer = useCallback(() => {
    if (overseerRef.current?.key === destinationKey) {
      return overseerRef.current.stub;
    }
    overseerRef.current?.stub[Symbol.dispose]();
    const stub = destinationId
      ? authenticatedApi.openGadget(destinationId)
      : authenticatedApi.getOrCreateInternalWorkspace();
    overseerRef.current = { stub, key: destinationKey };
    return stub;
  }, [authenticatedApi, destinationId, destinationKey]);

  useEffect(() => {
    return () => {
      overseerRef.current?.stub[Symbol.dispose]();
      overseerRef.current = null;
    };
  }, []);

  const handleSend = useCallback(
    async (
      message: string | SlashCommandRequest,
      modelId: string | null,
      capsules?: CapsuleSpecifier[],
      attachments?: ChatAttachmentHandle[],
      formats?: MessageFormatRef[],
    ) => {
      try {
        const overseer = ensureOverseer();
        // Pipeline both independent calls in one batch, but settle both before releasing the stub.
        const [chat, {id}] = await Promise.all([
          overseer.newChat(message, modelId, capsules, attachments, formats),
          overseer.getMetadata(),
        ]);
        overseerRef.current?.stub[Symbol.dispose]();
        overseerRef.current = null;
        navigate({ to: "/workspace/$id", params: { id }, search: { chat } });
      } catch (err) {
        const transient = logRpcFailure("Failed to start chat:", err,
            { reportSite: "workspace.create" });
        if (!attachments?.length && !capsules?.length) {
          overseerRef.current?.stub[Symbol.dispose]();
          overseerRef.current = null;
        }
        if (!transient) {
          toasts.add({
            title: familyLabel("Couldn't start chat", familyUi.failedStartChat),
            variant: "error",
          });
        }
        throw err;
      }
    },
    [ensureOverseer, navigate, toasts],
  );

  const getOverseer = useCallback((): RpcStub<Overseer> => {
    return ensureOverseer();
  }, [ensureOverseer]);

  const createCapsuleGatekeeper = useCallback(
    (accountId: number, url: string) => {
      return ensureOverseer().newGatekeeper(accountId, url);
    },
    [ensureOverseer],
  );

  return (
    // Flat enterprise treatment: no mesh, no watermark hexagon, no prompt-glow. The AppShell's
    // <main> already supplies a faint dotted grid as the page background.
    <div className="relative isolate flex min-h-full w-full flex-col items-center justify-start px-4 pb-16 pt-10 sm:px-8 sm:pt-16 lg:pt-24">
      {/* The brand hex mesh, restored and de-warmed for the new system: a gentle perspective hex
          grid receding upward. Masked to fade out before the composer so it stays a quiet backdrop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
        }}
      >
        <MeshBackground />
      </div>
      <div className="flex w-full max-w-2xl flex-col items-stretch gap-8">
        {/* Hero */}
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight text-kumo-default sm:text-4xl">
            {familyLabel('What are we working on?', familyUi.homeHeading)}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-5 tracking-[-0.25px] text-kumo-subtle">
            {familyLabel(
              'Ask a question, create an output, or create an app that works with your tools and data.',
              familyUi.homeSubheading,
            )}
          </p>
        </header>

        {/* Composer */}
        <ChatInput
          key={destinationKey}
          createCapsuleGatekeeper={createCapsuleGatekeeper}
          getOverseer={getOverseer}
          onSend={handleSend}
          isAgentActive={false}
          models={models}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          newChat
          offerFormats
          autoFocus
          minRows={3}
          seedText={draftText}
          seedNonce={seedNonce}
          onDraftChange={setDraftText}
          draftStorageKey={currentUser
            ? composerDraftStorageKey(currentUser.id, "home")
            : undefined}
          beforeAttach={
            <HomeWorkspaceSelector
              selectedId={destinationId}
              onChange={handleDestinationChange}
            />
          }
        />

        <HomeRecentInternalChats />

        {/* A few example work tasks to spark ideas. Picking one seeds the composer above. */}
        <HomeTaskSuggestions
          onPick={(suggestion) => {
            setDraftText(suggestion);
            setSeedNonce((previous) => previous + 1);
          }}
        />
      </div>
    </div>
  );
}
