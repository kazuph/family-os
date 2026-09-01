import { launch, type Page } from "@cloudflare/puppeteer";
import { RpcSession, RpcTarget, type RpcStub, type RpcTransport } from "capnweb";
import { createLogger } from "@gadgets/backend-utils/logger";
import BROWSER_EXPORT_RUNTIME from "./generated/browser-export-runtime.txt";
import { MAX_CHAT_ATTACHMENT_BYTES } from "./chat-attachment-validation";

type BrowserExportLogFields = {
  event?: string;
  error?: unknown;
};

/** Browser Run engine used to render a Gadget UI. */
export type GadgetBrowserEngine = "chromium" | "kitesurf";

/** Optional navigation and readiness conditions for a browser verification. */
export type GadgetUiVerificationOptions = {
  locationHash?: string;
  waitForSelector?: string;
};

/** Browser-observed state returned after rendering a Gadget UI. */
export type GadgetUiVerification = {
  engine: GadgetBrowserEngine;
  dom: {title: string; landmarks: {tag: string; text: string; id?: string; className?: string}[]};
  selectors: {selector: string; count?: number; error?: string}[];
  images: {total: number; loaded: number; failed: {src: string; alt: string}[]};
  console: {level: "error" | "warning"; text: string}[];
  pageErrors: string[];
  canvases: {width: number; height: number; hasPixels: boolean; frameChanged: boolean}[];
  screenshot: Uint8Array;
};

const logger = createLogger<BrowserExportLogFields>({ component: "workshop.browser-export" });

/** Wall-clock budget covering launch, rendering, and delivery of the entire export. */
const MAX_EXPORT_DURATION_MS = 30_000;
/** Largest export the Workshop will stream. Enforced while streaming, never buffered in full. */
const MAX_EXPORT_BYTES = 100 * 1024 * 1024;
/** Quiet period indicating that the client has finished its initial DOM updates. */
const DOM_SETTLE_MS = 250;
/** Budget for releasing the browser session once an export has settled. */
const BROWSER_CLOSE_TIMEOUT_MS = 10_000;
/** Maximum number of pending Worker-to-browser RPC messages. */
const MAX_PENDING_RPC_SENDS = 1024;
/** Maximum total string length across all pending Worker-to-browser RPC messages. */
const MAX_PENDING_RPC_SEND_CHARS = 32 * 1024 * 1024;
/** CSP ignores `sandbox` in a meta tag, so serve the document through interception with a header. */
const EXPORT_DOCUMENT_URL = "https://gadget-export.invalid/";
// TODO: CSP and request interception do not cover WebRTC/STUN. The same gap exists for Gadgets
// running inside an iframe in the user's browser. We should close the gap in both places. For now,
// extending the same gap to remotely-rendered gadgets is acceptable.
const EXPORT_DOCUMENT_CSP = "default-src 'none'; frame-src 'none'; script-src data:; " +
  "style-src data: 'unsafe-inline'; img-src data: blob:; media-src data: blob:; " +
  "font-src data:; object-src 'none'; base-uri 'none'; form-action 'none'; " +
  "connect-src 'none'; sandbox allow-scripts;";

function createDeadline(ms: number, message: string) {
  let expired = Promise.withResolvers<never>();
  let timer = setTimeout(() => expired.reject(new Error(message)), ms);
  expired.promise.catch(() => {});

  return {
    race<T>(work: Promise<T>): Promise<T> {
      return Promise.race([work, expired.promise]);
    },
    clear(): void {
      clearTimeout(timer);
    },
    onExpire(callback: () => Promise<void>): void {
      void expired.promise.catch(callback).catch(() => {});
    },
  };
}

async function closeBrowser(browser: Awaited<ReturnType<typeof launch>>): Promise<void> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    await Promise.race([
      browser.close(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Closing the export browser timed out.")),
            BROWSER_CLOSE_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    logger.warn("failed to close browser after gadget export", {
      event: "gadget.export.browser.close.failed",
      error,
    });
  } finally {
    clearTimeout(timer!);
  }
}

/** Ordered CDP transport for the RPC session between the Worker and remote browser. */
export class BrowserRpcTransport implements RpcTransport {
  #sendChain = Promise.resolve();
  #pendingSendCount = 0;
  #pendingSendChars = 0;
  #abortReason = Promise.withResolvers<Error>();

  constructor(private page: Page) {}

  send(message: string): Promise<void> {
    if (this.#pendingSendCount >= MAX_PENDING_RPC_SENDS ||
        message.length > MAX_PENDING_RPC_SEND_CHARS - this.#pendingSendChars) {
      let error = new Error("The Gadget export RPC send queue overflowed.");
      this.abort(error);
      return Promise.reject(error);
    }

    ++this.#pendingSendCount;
    this.#pendingSendChars += message.length;
    let delivered = this.#sendChain.then(() =>
      this.#untilAborted(this.page.evaluate(
        text => globalThis.__workshopExportSendToBrowser(text),
        message,
      )));
    let settled = delivered.finally(() => {
      --this.#pendingSendCount;
      this.#pendingSendChars -= message.length;
    });
    this.#sendChain = settled.catch(() => {});
    return settled;
  }

  async receive(): Promise<string> {
    let message = await this.#untilAborted(
      this.page.evaluate(() => globalThis.__workshopExportReceiveFromBrowser()),
    );
    if (typeof message !== "string") {
      throw new Error("The Gadget export RPC message from the browser was not a string.");
    }
    return message;
  }

  // Rejects in-flight and queued operations rather than only marking a flag, so a stalled page
  // cannot keep the RPC session alive after the export has settled.
  abort(reason: unknown): void {
    this.#abortReason.resolve(reason instanceof Error ? reason : new Error(String(reason)));
  }

  #untilAborted<T>(work: Promise<T>): Promise<T> {
    return Promise.race([
      work,
      this.#abortReason.promise.then(reason => { throw reason; }),
    ]);
  }
}

function scriptUrl(source: string): string {
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
}

function makeExportHtml(clientCode: string): string {
  let clientPrefix = String.raw`//# sourceURL=client.js
const { gadget, RpcStub, RpcTarget } = globalThis.__workshopExportRuntime;
delete globalThis.__workshopExportRuntime;
`;
  let clientUrl = scriptUrl(clientPrefix + clientCode);
  let runtimeUrl = scriptUrl(
      `globalThis.__workshopExportClientUrl = ${JSON.stringify(clientUrl)};\n` +
      BROWSER_EXPORT_RUNTIME);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <script src="${runtimeUrl}"></script>
</body>
</html>`;
}

function browserEndpoint(binding: BrowserRun, engine: GadgetBrowserEngine): BrowserRun {
  if (engine === "chromium") return binding;
  return {
    fetch(input: RequestInfo | URL, init?: RequestInit) {
      let request = new Request(input, init);
      let url = new URL(request.url);
      if (url.pathname === "/v1/devtools/browser") url.searchParams.set("browser", engine);
      return binding.fetch(new Request(url, request));
    },
  } as BrowserRun;
}

/** Limits the size of the exported file streamed back to the client. */
export function limitStream(
  source: ReadableStream<Uint8Array>,
  maxBytes: number,
): ReadableStream<Uint8Array> {
  let total = 0;
  let limiter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;
      if (total > maxBytes) {
        controller.error(new Error(`Gadget exports may not exceed ${maxBytes} bytes.`));
        return;
      }
      controller.enqueue(chunk);
    },
  });
  void source.pipeTo(limiter.writable).catch(() => {});
  return limiter.readable;
}

/** Releases the browser session once the export stream completes, fails, or is cancelled. */
function releaseWhenSettled(
  source: ReadableStream<Uint8Array>,
  release: () => Promise<void>,
): ReadableStream<Uint8Array> {
  let reader = source.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (error) {
        await release();
        throw error;
      }
      if (chunk.done) {
        await release();
        controller.close();
      } else {
        controller.enqueue(chunk.value);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => {});
      await release();
    },
  });
}

async function waitForDomSettled(page: Page): Promise<void> {
  await page.evaluate(async (quietMs: number) => {
    const browser = globalThis as unknown as {
      __workshopExportModulePromise: Promise<Record<string, unknown>>;
      document: { documentElement: unknown };
      MutationObserver: new(callback: () => void) => {
        observe(target: unknown, options: Record<string, boolean>): void;
        disconnect(): void;
      };
    };
    // Make sure that client module has been loaded before watching DOM.
    await browser.__workshopExportModulePromise;
    await new Promise<void>(resolve => {
      let timer: ReturnType<typeof setTimeout>;
      let observer = new browser.MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(finish, quietMs);
      });
      function finish() {
        observer.disconnect();
        resolve();
      }
      observer.observe(browser.document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
      timer = setTimeout(finish, quietMs);
    });
  }, DOM_SETTLE_MS);
}

type RenderedGadget = {
  page: Page;
  release(): Promise<void>;
};

async function openRenderedGadget(
  browserBinding: BrowserRun,
  clientCode: string,
  gadget: RpcStub<any>,
  engine: GadgetBrowserEngine,
  deadline: ReturnType<typeof createDeadline>,
  observePage?: (page: Page) => void,
  options: GadgetUiVerificationOptions = {},
): Promise<RenderedGadget> {
  let launchPromise = launch(browserEndpoint(browserBinding, engine));
  let browser: Awaited<ReturnType<typeof launch>>;
  try {
    browser = await deadline.race(launchPromise);
  } catch (error) {
    gadget[Symbol.dispose]();
    void launchPromise.then(closeBrowser, () => {});
    throw error;
  }

  let sessionCloser: RpcStub<any> | undefined;
  let releasePromise: Promise<void> | undefined;
  let release = () => releasePromise ??= (async () => {
    deadline.clear();
    if (sessionCloser) sessionCloser[Symbol.dispose]();
    gadget[Symbol.dispose]();
    await closeBrowser(browser);
  })();
  deadline.onExpire(release);

  try {
    let page = await deadline.race(browser.newPage());
    observePage?.(page);
    await deadline.race(page.setRequestInterception(true));
    page.on("request", request => {
      let url = request.url();
      if (url === EXPORT_DOCUMENT_URL && request.isNavigationRequest() &&
          request.frame() === page.mainFrame()) {
        void request.respond({
          status: 200,
          contentType: "text/html",
          headers: {"Content-Security-Policy": EXPORT_DOCUMENT_CSP},
          body: makeExportHtml(clientCode),
        });
      } else if (url === "about:blank" || url.startsWith("data:") || url.startsWith("blob:")) {
        void request.continue();
      } else {
        void request.abort();
      }
    });
    let documentUrl = new URL(EXPORT_DOCUMENT_URL);
    if (options.locationHash) documentUrl.hash = options.locationHash;
    await deadline.race(page.goto(documentUrl.href, {waitUntil: "load"}));
    let transport = new BrowserRpcTransport(page);
    page.on("close", () => transport.abort(new Error("Browser page closed.")));
    // Keep the browser session from taking ownership of the live facet stub as its local-main
    // payload. Forward through a target, matching the normal sandboxed-iframe path in GadgetUI,
    // and release each transport's capability independently.
    let forwardingTarget = new Proxy(new RpcTarget() as any, {
      get(target, property, receiver) {
        if (typeof property === "symbol" || property in target) {
          return Reflect.get(target, property, receiver);
        }
        return (gadget as any)[property];
      },
    });
    let rpcSession = new RpcSession(transport, forwardingTarget);
    sessionCloser = rpcSession.getRemoteMain();
    await deadline.race(waitForDomSettled(page));
    if (options.waitForSelector) {
      await deadline.race(page.waitForSelector(options.waitForSelector));
      await deadline.race(waitForDomSettled(page));
    }
    return {page, release};
  } catch (error) {
    await release();
    throw error;
  }
}

/** Renders a Gadget in Browser Run and returns diagnostics plus a PNG screenshot. */
export async function verifyGadgetUi(
  browserBinding: BrowserRun,
  clientCode: string,
  gadget: RpcStub<any>,
  selectors: string[],
  engine: GadgetBrowserEngine = "chromium",
  options: GadgetUiVerificationOptions = {},
): Promise<GadgetUiVerification> {
  let deadline = createDeadline(MAX_EXPORT_DURATION_MS, "Browser verification timed out.");
  let consoleMessages: GadgetUiVerification["console"] = [];
  let pageErrors: string[] = [];
  let opened: RenderedGadget | undefined;
  try {
    opened = await openRenderedGadget(browserBinding, clientCode, gadget, engine, deadline, page => {
      page.on("console", message => {
        let type = message.type();
        if (type === "error" || type === "warn") {
          consoleMessages.push({level: type === "warn" ? "warning" : type, text: message.text()});
        }
      });
      page.on("pageerror", error => pageErrors.push(error.message));
    }, options);
    let observed = await deadline.race(opened.page.evaluate(async requestedSelectors => {
      let browser = globalThis as unknown as {
        document: {
          title: string;
          images: ArrayLike<{
            complete: boolean; naturalWidth: number; currentSrc: string; src: string; alt: string;
            addEventListener(type: string, listener: () => void, options: {once: boolean}): void;
          }>;
          querySelectorAll(selector: string): ArrayLike<any>;
          createElement(tag: "canvas"): any;
        };
        requestAnimationFrame(callback: () => void): void;
      };
      let selectorCounts = requestedSelectors.map(selector => {
        try {
          return {selector, count: browser.document.querySelectorAll(selector).length};
        } catch (error) {
          return {selector, error: error instanceof Error ? error.message : String(error)};
        }
      });
      let images = Array.from(browser.document.images);
      await Promise.all(images.map(image => image.complete ? undefined : new Promise<void>(resolve => {
        image.addEventListener("load", resolve, {once: true});
        image.addEventListener("error", resolve, {once: true});
      })));
      let canvasElements = Array.from(browser.document.querySelectorAll("canvas"));
      let before = canvasElements.map(canvas => canvas.toDataURL());
      await new Promise<void>(resolve =>
        browser.requestAnimationFrame(() => browser.requestAnimationFrame(() => resolve())));
      return {
        dom: {
          title: browser.document.title,
          landmarks: Array.from(browser.document.querySelectorAll(
              "main,nav,header,footer,article,section,h1,h2,h3,h4,h5,h6,form,button"), element => ({
            tag: element.tagName.toLowerCase(),
            text: element.matches("h1,h2,h3,h4,h5,h6,button")
              ? (element.innerText || element.textContent || "").trim()
              : "",
            ...(element.id ? {id: element.id} : {}),
            ...(element.className ? {className: element.className} : {}),
          })),
        },
        selectors: selectorCounts,
        images: {
          total: images.length,
          loaded: images.filter(image => image.complete && image.naturalWidth > 0).length,
          failed: images.filter(image => !image.complete || image.naturalWidth === 0)
              .map(image => ({src: image.currentSrc || image.src, alt: image.alt})),
        },
        canvases: canvasElements.map((canvas, index) => {
          let blank = browser.document.createElement("canvas");
          blank.width = canvas.width;
          blank.height = canvas.height;
          let hasPixels = canvas.toDataURL() !== blank.toDataURL();
          return {width: canvas.width, height: canvas.height, hasPixels,
            frameChanged: before[index] !== canvas.toDataURL()};
        }),
      };
    }, selectors));
    let png = await deadline.race(opened.page.screenshot({type: "png"}));
    if (png.byteLength > MAX_CHAT_ATTACHMENT_BYTES) {
      throw new Error(`Gadget screenshots may not exceed ${MAX_CHAT_ATTACHMENT_BYTES} bytes.`);
    }
    return {...observed, engine, console: consoleMessages, pageErrors,
      screenshot: new Uint8Array(png)};
  } finally {
    if (opened) await opened.release();
    else deadline.clear();
  }
}

/**
 * Renders a Gadget's UI as PDF in a remote browser and streams the bytes back.
 *
 * Takes ownership of `gadget` and disposes it once the export settles. The
 * returned stream must be consumed or cancelled: the browser session stays open
 * until it settles or times out.
 */
export async function renderGadgetPdf(
  browserBinding: BrowserRun,
  clientCode: string,
  documentTitle: string,
  gadget: RpcStub<any>,
): Promise<ReadableStream<Uint8Array>> {
  let deadline = createDeadline(MAX_EXPORT_DURATION_MS, "Browser export timed out.");
  let opened: RenderedGadget;
  try {
    opened = await openRenderedGadget(browserBinding, clientCode, gadget, "chromium", deadline);
  } catch (error) {
    deadline.clear();
    logger.warn("failed to launch browser for gadget export", {
      event: "gadget.export.browser.launch.failed",
      error,
    });
    throw error;
  }

  try {
    let source = await deadline.race((async () => {
      await opened.page.emulateMediaType("print");
      await opened.page.evaluate(title => {
        let browser = globalThis as unknown as { document: { title: string } };
        browser.document.title = title;
      }, documentTitle);
      return opened.page.createPDFStream({
        preferCSSPageSize: true,
        printBackground: true,
        waitForFonts: true,
      });
    })());
    return releaseWhenSettled(limitStream(source, MAX_EXPORT_BYTES), opened.release);
  } catch (error) {
    // Deliberately omits the caught value: failures here can carry Gadget-authored exception text,
    // which must not reach logs or the external issue Reporter.
    logger.warn("failed to render gadget export", { event: "gadget.export.render.failed" });
    await opened.release();
    throw error;
  }
}
