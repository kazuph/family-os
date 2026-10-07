// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SOURCE = readFileSync(
  resolve(process.cwd(), "blueprints/workspace-book/files/client.js"),
  "utf8",
);

const FILES = {
  "content/toc.json": JSON.stringify({
    title: "検証の本",
    parts: [{
      title: "第一部",
      chapters: [
        { id: "one", title: "一章", file: "one.md", chapter: 1 },
        { id: "two", title: "二章", file: "two.md", chapter: 2 },
      ],
    }],
  }),
  // 数式・脚注・画像・未知アニメ記法を同時に含む本文。$$ は段落単独で書く必要がある。
  "content/one.md": [
    "# 一章",
    "",
    "脚注[^n]つき本文と画像 ![図](/img/a.png)。",
    "",
    "$$x^2 + y^2 = z^2$$",
    "",
    "[^n]: 脚注の中身",
    "",
    '::anim{id="wave-sum"}',
  ].join("\n"),
  "content/two.md": "# 二章\n\ntwo の本文",
};

type Message = { role: string; content: string };

interface FakeGadget {
  calls: { getState: (string | undefined)[]; askTutor: { message: string; chapterId: string }[] };
  getState(chapterId?: string): Promise<{ messages: Message[]; progress: Record<string, boolean>; lastChapter?: string }>;
  getBookFiles(): Promise<Record<string, string>>;
  askTutor(args: { message: string; chapterId: string }): Promise<unknown>;
  setChapterComplete(chapterId: string, completed: boolean): Promise<Record<string, boolean>>;
}

function makeGadget(store: { messages: Record<string, Message[]>; progress?: Record<string, boolean>; lastChapter?: string }): FakeGadget {
  const calls: FakeGadget["calls"] = { getState: [], askTutor: [] };
  const progress = store.progress ?? {};
  return {
    calls,
    getState(chapterId) {
      calls.getState.push(chapterId);
      return Promise.resolve({
        messages: chapterId ? store.messages[chapterId] ?? [] : [],
        progress,
        lastChapter: store.lastChapter,
      });
    },
    getBookFiles: () => Promise.resolve(FILES),
    async askTutor(args) {
      calls.askTutor.push(args);
      store.messages[args.chapterId] = [
        ...store.messages[args.chapterId] ?? [],
        { role: "user", content: args.message },
        { role: "assistant", content: `${args.chapterId} の返答` },
      ];
      return this.getState(args.chapterId);
    },
    setChapterComplete(chapterId, completed) {
      progress[chapterId] = completed;
      return Promise.resolve(progress);
    },
  };
}

// client.js is a self-contained bundle: it reads the global `gadget` RPC stub injected by
// the iframe prefix and `__gadgetAssets`, then drives the real DOM. Evaluating it against
// jsdom exercises the exact artifact that ships to browsers instead of a reimplemented copy.
function load(gadget: FakeGadget) {
  Object.assign(globalThis, {
    gadget,
    __gadgetAssets: { "/img/a.png": "data:image/png;base64,iVBORw0KGgo=" },
  });
  // oxlint-disable-next-line no-new-func -- intentionally executing the shipped bundle.
  new Function(SOURCE)();
}

async function waitFor(condition: () => void) {
  await vi.waitFor(condition, { interval: 10, timeout: 2000 });
}

const messageTexts = () =>
  [...document.querySelectorAll(".messages .message")].map(item => item.textContent);

const chapterText = (id: string) => document.querySelector(`[data-chapter="${id}"]`);

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("workspace-book client", () => {
  it("shows each chapter's own conversation when opening and switching chapters", async () => {
    const gadget = makeGadget({
      messages: {
        one: [{ role: "user", content: "一章の質問" }, { role: "assistant", content: "一章の返答" }],
        two: [{ role: "user", content: "二章の質問" }],
      },
    });
    load(gadget);
    await waitFor(() => expect(messageTexts()).toEqual(["一章の質問", "一章の返答"]));
    expect(gadget.calls.getState).toEqual([undefined, "one"]);
    (chapterText("two") as HTMLButtonElement).click();
    await waitFor(() => expect(messageTexts()).toEqual(["二章の質問"]));
    (chapterText("one") as HTMLButtonElement).click();
    await waitFor(() => expect(messageTexts()).toEqual(["一章の質問", "一章の返答"]));
    expect(gadget.calls.getState).toEqual([undefined, "one", "two", "one"]);
  });

  it("asks the tutor with only the chapter id and renders the reply", async () => {
    const gadget = makeGadget({ messages: {} });
    load(gadget);
    await waitFor(() => expect(gadget.calls.getState).toContain("one"));
    const textarea = document.querySelector<HTMLTextAreaElement>(".composer textarea")!;
    textarea.value = "この章について質問";
    (document.querySelector(".composer .send") as HTMLButtonElement).click();
    await waitFor(() => expect(gadget.calls.askTutor).toHaveLength(1));
    expect(gadget.calls.askTutor[0]).toEqual({ message: "この章について質問", chapterId: "one" });
    expect("chapterText" in (gadget.calls.askTutor[0] as object)).toBe(false);
    await waitFor(() => expect(messageTexts()).toEqual(["この章について質問", "one の返答"]));
  });

  it("renders formulas, footnotes, image assets, the toc, and the unknown-animation placeholder", async () => {
    load(makeGadget({ messages: {} }));
    await waitFor(() => expect(document.querySelector(".katex")).not.toBeNull());
    expect(document.querySelector(".footnote-ref, a.footnote-ref, sup a") ?? document.querySelector("[class*=footnote]")).not.toBeNull();
    const image = document.querySelector<HTMLImageElement>("article img")!;
    expect(image.src).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect([...document.querySelectorAll(".chapter-link")].map(item => item.textContent))
      .toEqual(["第1章　一章 ", "第2章　二章 "]);
    const anim = document.querySelector(".anim")!;
    expect(anim.textContent).toContain("未実装のアニメーション");
    expect(anim.textContent).toContain("wave-sum");
    // モバイル切替タブは従来どおり三つのビューを持つ。
    expect([...document.querySelectorAll(".mobile-tabs button")].map(item => item.getAttribute("data-view")))
      .toEqual(["contents", "reader", "chat"]);
  });
});

function extractCanvasLoop(): (host: unknown, w: number, h: number, draw: (ctx: null, t: number) => void) => void {
  const match = SOURCE.match(/function canvasLoop\(host, w, h, draw\) \{[\s\S]*?\n  \}\n/);
  if (!match) throw new Error("canvasLoop not found in client.js");
  // The bundle wraps helpers in `__name(...)`; stub it while evaluating the shipped
  // function verbatim.
  // oxlint-disable-next-line no-new-func -- evaluating the shipped function verbatim.
  return new Function("__name", `return (${match[0].trim()});`)(
    (target: unknown) => target) as ReturnType<typeof extractCanvasLoop>;
}

describe("canvasLoop", () => {

  it("stops requesting frames once the canvas leaves the DOM", () => {
    const canvasLoop = extractCanvasLoop();
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    const observers: { disconnect: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal("IntersectionObserver", class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect = vi.fn();
      constructor() {
        observers.push(this);
      }
    });
    const canvas = {
      width: 0, height: 0, isConnected: true,
      style: {} as { width: string; height: string; aspectRatio: string },
      getContext: () => ({ scale: () => {} }),
    };
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
      tag === "canvas" ? canvas as unknown as HTMLElement : realCreate(tag));
    const host = { appendChild: (element: unknown) => element };
    const draw = vi.fn();
    canvasLoop(host, 100, 50, draw);
    expect(canvas.width).toBe(100);
    expect(frames).toHaveLength(1);
    frames.shift()!(16);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(1);
    canvas.isConnected = false;
    frames.shift()!(32);
    expect(frames).toHaveLength(0);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(observers[0]?.disconnect).toHaveBeenCalledTimes(1);
  });
});
