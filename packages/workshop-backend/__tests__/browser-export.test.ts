import { beforeEach, describe, expect, it, vi } from "vitest";

const launch = vi.hoisted(() => vi.fn());
vi.mock("@cloudflare/puppeteer", () => ({ launch }));

const { BrowserRpcTransport, limitStream, renderGadgetPdf, verifyGadgetUi } =
    await import("../src/browser-export.js");

type Harness = {
  browserClosed: () => boolean;
  clientResponseHeaders: () => Record<string, string> | undefined;
  clientResponseBody: () => string | undefined;
  clientInitialized: () => boolean;
  documentResponseBody: () => string | undefined;
  gadgetDisposed: () => boolean;
  navigatedUrl: () => string | undefined;
  pdfRequested: () => boolean;
  renderSettled: () => boolean;
  waitedSelector: () => string | undefined;
};

function makeHarness(pdfChunks = ["%PDF-1.4"], closePdf = true) {
  let browserClosed = false;
  let clientResponseHeaders: Record<string, string> | undefined;
  let clientResponseBody: string | undefined;
  let clientInitialized = false;
  let documentResponseBody: string | undefined;
  let documentTitle: string | undefined;
  let gadgetDisposed = false;
  let navigatedUrl: string | undefined;
  let pdfRequested = false;
  let renderSettled = false;
  let waitedSelector: string | undefined;

  let listeners = new Map<string, ((value: any) => void)[]>();
  let mainFrame = {};
  let page = {
    setRequestInterception: async () => {},
    on: (name: string, listener: (value: any) => void) => {
      listeners.set(name, [...(listeners.get(name) ?? []), listener]);
    },
    goto: async (url: string) => {
      navigatedUrl = url;
      let request = listeners.get("request")?.[0];
      let documentRequestUrl = new URL(url);
      documentRequestUrl.hash = "";
      request?.({
        url: () => documentRequestUrl.href,
        isNavigationRequest: () => true,
        frame: () => mainFrame,
        respond: ({body}: {body: string}) => { documentResponseBody = body; },
      });
      request?.({
        url: () => "https://gadget-export.invalid/client.js",
        isNavigationRequest: () => false,
        frame: () => mainFrame,
        respond: ({body, headers}: {body: string; headers?: Record<string, string>}) => {
          clientResponseBody = body;
          clientResponseHeaders = headers;
        },
      });
    },
    waitForSelector: async (selector: string) => { waitedSelector = selector; },
    mainFrame: () => mainFrame,
    emulateMediaType: async () => {},
    evaluate: (fn: (...args: never[]) => unknown, ...args: unknown[]) => {
      if (fn.toString().includes("__workshopExportModulePromise")) {
        clientInitialized = true;
        renderSettled = fn.toString().includes("MutationObserver");
        return Promise.resolve();
      }
      if (fn.toString().includes("requestedSelectors")) {
        listeners.get("console")?.forEach(listener => listener({
          type: () => "warn",
          text: () => "layout warning",
        }));
        return Promise.resolve({
          dom: {title: "Rendered Gadget", landmarks: [{tag: "main", text: "Hello"}]},
          selectors: [{selector: "canvas", count: 1}],
          images: {total: 1, loaded: 1, failed: []},
          canvases: [{width: 300, height: 150, hasPixels: true, frameChanged: true}],
        });
      }
      if (fn.toString().includes("document.title")) {
        documentTitle = typeof args[0] === "string" ? args[0] : undefined;
        return Promise.resolve();
      }
      // The RPC transport polls this; the fake page never has a message to deliver.
      return new Promise(() => {});
    },
    createPDFStream: async () => {
      expect(clientInitialized).toBe(true);
      expect(renderSettled).toBe(true);
      expect(documentTitle).toBe("Test Gadget");
      pdfRequested = true;
      return new ReadableStream<Uint8Array>({
        start(controller) {
          for (let chunk of pdfChunks) controller.enqueue(new TextEncoder().encode(chunk));
          if (closePdf) controller.close();
        },
      });
    },
    screenshot: async () => new Uint8Array([137, 80, 78, 71]),
  };

  let browser = {
    newPage: async () => page,
    close: async () => {
      browserClosed = true;
    },
  };
  launch.mockResolvedValue(browser);

  let gadget = {
    [Symbol.dispose]: () => {
      gadgetDisposed = true;
    },
  };

  let harness: Harness = {
    browserClosed: () => browserClosed,
    clientResponseHeaders: () => clientResponseHeaders,
    clientResponseBody: () => clientResponseBody,
    clientInitialized: () => clientInitialized,
    documentResponseBody: () => documentResponseBody,
    gadgetDisposed: () => gadgetDisposed,
    navigatedUrl: () => navigatedUrl,
    pdfRequested: () => pdfRequested,
    renderSettled: () => renderSettled,
    waitedSelector: () => waitedSelector,
  };
  return { gadget, harness, browser };
}

function render(pdfChunks?: string[], closePdf = true) {
  let { gadget, harness } = makeHarness(pdfChunks, closePdf);
  let stream = renderGadgetPdf(
    {} as BrowserRun,
    "export default {}",
    "Test Gadget",
    gadget as never,
  );
  return { stream, harness };
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<string> {
  let reader = stream.getReader();
  let text = "";
  let decoder = new TextDecoder();
  for (;;) {
    let { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });
}

beforeEach(() => {
  launch.mockReset();
});

describe("BrowserRpcTransport", () => {
  it("aborts all queued sends when stalled browser delivery exceeds the count limit", async () => {
    let transport = new BrowserRpcTransport({
      evaluate: () => new Promise(() => {}),
    } as never);
    let pending = Array.from({ length: 1024 }, () => transport.send("message"));
    let pendingResults = Promise.allSettled(pending);

    await expect(transport.send("overflow")).rejects.toThrow("send queue overflowed");
    expect((await pendingResults).every(result => result.status === "rejected")).toBe(true);
  });
});

describe("limitStream", () => {
  it("passes through output that stays within the cap", async () => {
    expect(await collect(limitStream(streamOf(["abc", "de"]), 5))).toBe("abcde");
  });

  it("fails as soon as the cap is exceeded rather than buffering the whole export", async () => {
    let reader = limitStream(streamOf(["abcd", "efgh"]), 6).getReader();
    await expect(reader.read()).resolves.toMatchObject({ done: false });
    await expect(reader.read()).rejects.toThrow("may not exceed 6 bytes");
  });
});

describe("renderGadgetPdf", () => {
  it("settles the client render, streams a PDF, and releases the browser", async () => {
    let { stream, harness } = render();

    expect(await collect(await stream)).toBe("%PDF-1.4");
    expect(harness.clientInitialized()).toBe(true);
    expect(harness.renderSettled()).toBe(true);
    expect(harness.pdfRequested()).toBe(true);
    expect(harness.browserClosed()).toBe(true);
  });

  it("releases the browser when the consumer cancels the stream", async () => {
    let { stream, harness } = render(["first", "second"]);

    let reader = (await stream).getReader();
    await reader.read();
    await reader.cancel("no longer needed");

    expect(harness.browserClosed()).toBe(true);
  });

  it("releases the browser when the export stream exceeds its deadline", async () => {
    vi.useFakeTimers();
    try {
      let { stream, harness } = render(["first"], false);
      let reader = (await stream).getReader();
      await expect(reader.read()).resolves.toMatchObject({ done: false });

      await vi.advanceTimersByTimeAsync(30_000);

      expect(harness.browserClosed()).toBe(true);
      await reader.cancel();
    } finally {
      vi.useRealTimers();
    }
  });

  it("disposes the Gadget and closes a browser that launches after the deadline", async () => {
    vi.useFakeTimers();
    try {
      let pendingLaunch = Promise.withResolvers<{ close(): Promise<void> }>();
      let browserClosed = false;
      let gadgetDisposed = false;
      launch.mockReturnValue(pendingLaunch.promise);
      let result = renderGadgetPdf(
        {} as BrowserRun,
        "export default {}",
        "Test Gadget",
        { [Symbol.dispose]: () => { gadgetDisposed = true; } } as never,
      );
      let rejection = expect(result).rejects.toThrow("Browser export timed out.");

      await vi.advanceTimersByTimeAsync(30_000);
      await rejection;
      expect(gadgetDisposed).toBe(true);

      pendingLaunch.resolve({
        close: async () => { browserClosed = true; },
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(browserClosed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("releases the browser and disposes the Gadget when launching fails", async () => {
    let gadgetDisposed = false;
    launch.mockRejectedValue(new Error("no browser available"));

    await expect(renderGadgetPdf(
      {} as BrowserRun,
      "export default {}",
      "Test Gadget",
      { [Symbol.dispose]: () => { gadgetDisposed = true; } } as never,
    )).rejects.toThrow("no browser available");
    expect(gadgetDisposed).toBe(true);
  });
});

describe("verifyGadgetUi", () => {
  it("serves client.js separately instead of nesting it in the HTML data URL", async () => {
    let {gadget, harness} = makeHarness();
    let source = "export default { marker: 'large-readable-client' }";

    await verifyGadgetUi({} as BrowserRun, source, gadget as never, [], "chromium");

    expect(harness.clientResponseBody()).toContain(source);
    expect(harness.clientResponseHeaders()).toEqual({"Access-Control-Allow-Origin": "*"});
    expect(harness.documentResponseBody()).not.toContain("large-readable-client");
    expect(harness.documentResponseBody()).toContain("https%3A%2F%2Fgadget-export.invalid%2Fclient.js");
  });

  it("returns browser diagnostics and a PNG while releasing the browser", async () => {
    let {gadget, harness} = makeHarness();

    let result = await verifyGadgetUi(
      {} as BrowserRun,
      "export default {}",
      gadget as never,
      ["canvas"],
      "chromium",
    );

    expect(result).toMatchObject({
      engine: "chromium",
      selectors: [{selector: "canvas", count: 1}],
      images: {total: 1, loaded: 1, failed: []},
      console: [{level: "warning", text: "layout warning"}],
      pageErrors: [],
      canvases: [{hasPixels: true, frameChanged: true}],
    });
    expect(result.screenshot).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(harness.browserClosed()).toBe(true);
    expect(harness.gadgetDisposed()).toBe(true);
  });

  it("opts Kitesurf sessions in without changing Chromium requests", async () => {
    let requestedUrl = "";
    let binding = {
      fetch(input: RequestInfo | URL) {
        requestedUrl = new Request(input).url;
        return Promise.resolve(new Response(JSON.stringify({sessionId: "test"})));
      },
    } as BrowserRun;
    let {gadget, browser} = makeHarness();
    launch.mockImplementationOnce(async (endpoint: {fetch: typeof fetch}) => {
      await endpoint.fetch("https://fake.host/v1/devtools/browser?keep_alive=10000");
      return browser;
    });

    await verifyGadgetUi(binding, "export default {}", gadget as never, [], "kitesurf");
    expect(requestedUrl).toContain("browser=kitesurf");
  });

  it("navigates to a hash route and waits for an explicit readiness selector", async () => {
    let {gadget, harness} = makeHarness();

    await verifyGadgetUi(
      {} as BrowserRun,
      "export default {}",
      gadget as never,
      [],
      "chromium",
      {locationHash: "chapter-42", waitForSelector: "canvas"},
    );

    expect(harness.navigatedUrl()).toBe("https://gadget-export.invalid/#chapter-42");
    expect(harness.waitedSelector()).toBe("canvas");
  });
});
