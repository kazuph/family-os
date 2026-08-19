// @vitest-environment jsdom
/* eslint-disable react/react-in-jsx-scope */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => {
  const listModels = vi.fn<() => Promise<never[]>>(async () => []);
  const newGadget = vi.fn<() => never>();
  const getOrCreateInternalWorkspace = vi.fn<() => never>();
  const getInternalWorkspaceId = vi.fn<() => Promise<string | null>>(async () => null);
  const listGadgets = vi.fn<() => Promise<never[]>>(async () => []);
  return {
    addToast: vi.fn<(toast: unknown) => void>(),
    authenticatedApi: {
      listModels,
      newGadget,
      getOrCreateInternalWorkspace,
      getInternalWorkspaceId,
      listGadgets,
    },
    listModels,
    navigate: vi.fn<(options: unknown) => void>(),
    newGadget,
    getOrCreateInternalWorkspace,
    seeds: [] as Array<{ text?: string; nonce?: number }>,
  };
});

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => testState.navigate,
}));

vi.mock("@cloudflare/kumo", () => ({
  useKumoToastManager: () => ({ add: testState.addToast }),
}));

vi.mock("./AuthContext", () => ({
  useAuthenticatedApi: () => ({
    authenticatedApi: testState.authenticatedApi,
  }),
}));

vi.mock("./ChatInterface", () => ({
  ChatInput: ({ seedText, seedNonce }: { seedText?: string; seedNonce?: number }) => {
    testState.seeds.push({ text: seedText, nonce: seedNonce });
    return <textarea aria-label="Prompt" readOnly value={seedText ?? ""} />;
  },
}));

vi.mock("./components/MeshBackground", () => ({ default: () => null }));
vi.mock("./components/AppShell/HomeTaskSuggestions", () => ({ default: () => null }));
vi.mock("./components/HomeRecentInternalChats", () => ({ default: () => null }));
vi.mock("./components/HomeWorkspaceSelector", () => ({ default: () => null }));
vi.mock("./useDocumentTitle", () => ({ useDocumentTitle: () => {} }));

import { HomePageContent } from "./routes/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Home prompt route flow", () => {
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;

  afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    localStorage.clear();
    testState.seeds.length = 0;
    vi.clearAllMocks();
  });

  it("seeds the composer once, clears route state, and does not create a workspace", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root!.render(<HomePageContent prompt="Create a daily brief." />));

    expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Prompt"]')?.value).toBe(
      "Create a daily brief.",
    );
    expect(Math.max(...testState.seeds.map(({ nonce }) => nonce ?? 0))).toBe(1);
    expect(testState.navigate).toHaveBeenCalledWith({ to: "/", search: {}, replace: true });
    expect(testState.newGadget).not.toHaveBeenCalled();
    expect(testState.getOrCreateInternalWorkspace).not.toHaveBeenCalled();
  });
});
