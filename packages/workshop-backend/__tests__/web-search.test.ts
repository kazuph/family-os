import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatWebSearchResults, webSearch } from "../src/web-search.js";

// Fixture markup mirrors the real DuckDuckGo HTML search surface (verified live against
// https://duckduckgo.com/html/?q=... on 2026-08-17): a `<title>{query} at DuckDuckGo</title>`,
// an `id="links"` results container, and per-result `a.result__a` / `a.result__snippet` anchors
// whose href wraps the real target in `//duckduckgo.com/l/?uddg=<url-encoded>&rut=...`.
function ddgResultsPage(query: string, resultsHtml: string): string {
  return `<!DOCTYPE html><html><head><title>${query} at DuckDuckGo</title></head><body>` +
    `<div id="links" class="results">${resultsHtml}</div>` +
    `</body></html>`;
}

function ddgResult(opts: { title: string; targetUrl: string; snippetHtml: string }): string {
  const href = `//duckduckgo.com/l/?uddg=${encodeURIComponent(opts.targetUrl)}&amp;rut=stub`;
  return (
    `<div class="result results_links results_links_deep web-result">` +
      `<div class="links_main links_deep result__body">` +
        `<h2 class="result__title">` +
          `<a rel="nofollow" class="result__a" href="${href}">${opts.title}</a>` +
        `</h2>` +
        `<div class="result__extras"><div class="result__extras__url">` +
          `<a class="result__url" href="${href}">${opts.targetUrl}</a>` +
        `</div></div>` +
        `<a class="result__snippet" href="${href}">${opts.snippetHtml}</a>` +
      `</div>` +
    `</div>`
  );
}

describe("webSearch", () => {
  let originalFetch: typeof globalThis.fetch;
  let capturedUrl: string | undefined;
  let capturedHeaders: Headers | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    capturedUrl = undefined;
    capturedHeaders = undefined;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockDdgResponse(body: string, status = 200) {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = typeof input === "string" ? input : input.toString();
      capturedHeaders = new Headers(init?.headers);
      return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
    }) as unknown as typeof fetch;
  }

  it("parses organic results (title, resolved url, snippet) in page order", async () => {
    const html = ddgResultsPage("cloudflare durable objects", [
      ddgResult({
        title: "Overview - Cloudflare Durable Objects docs",
        targetUrl: "https://developers.cloudflare.com/durable-objects/",
        snippetHtml: "Build stateful serverless applications with <b>Durable</b> <b>Objects</b>.",
      }),
      ddgResult({
        title: "Second Result Title",
        targetUrl: "https://example.com/page2",
        snippetHtml: "A plain snippet with no highlighted terms.",
      }),
    ].join(""));
    mockDdgResponse(html);

    const results = await webSearch("cloudflare durable objects");

    expect(results).toEqual([
      {
        title: "Overview - Cloudflare Durable Objects docs",
        url: "https://developers.cloudflare.com/durable-objects/",
        snippet: "Build stateful serverless applications with Durable Objects.",
      },
      {
        title: "Second Result Title",
        url: "https://example.com/page2",
        snippet: "A plain snippet with no highlighted terms.",
      },
    ]);
  });

  it("URL-encodes the query and identifies the request as a search request", async () => {
    mockDdgResponse(ddgResultsPage("c++ vs rust?", ""));

    await webSearch("c++ vs rust?");

    expect(capturedUrl).toBeDefined();
    const requestUrl = new URL(capturedUrl!);
    expect(requestUrl.origin + requestUrl.pathname).toBe("https://duckduckgo.com/html/");
    expect(requestUrl.searchParams.get("q")).toBe("c++ vs rust?");
    expect(capturedHeaders?.get("accept")).toBe("text/html");
  });

  it("trims the query before searching and rejects an empty one without any request", async () => {
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch;

    await expect(webSearch("   ")).rejects.toThrow("A search query is required.");
    expect(fetchCalled).toBe(false);
  });

  it("returns an empty array (not an error) for a genuine zero-result DuckDuckGo page", async () => {
    mockDdgResponse(ddgResultsPage("zzznonexistentqueryxyzabc", ""));

    const results = await webSearch("zzznonexistentqueryxyzabc");
    expect(results).toEqual([]);
    expect(formatWebSearchResults("zzznonexistentqueryxyzabc", results)).toBe(
      'DuckDuckGo web search for "zzznonexistentqueryxyzabc" returned no organic results.',
    );
  });

  it("throws a descriptive error when the response isn't a recognizable DuckDuckGo results page", async () => {
    // Simulates an upstream markup change or a bot-challenge/block page: no
    // "<title>... at DuckDuckGo</title>" and no #links container.
    mockDdgResponse("<html><head><title>Unavailable</title></head><body>Please try again.</body></html>");

    await expect(webSearch("anything")).rejects.toThrow(/doesn't recognize/);
  });

  it("surfaces a clear error on a non-2xx response", async () => {
    mockDdgResponse("", 503);
    await expect(webSearch("anything")).rejects.toThrow("DuckDuckGo search failed with HTTP 503.");
  });

  it("wraps an aborted fetch as a timeout error", async () => {
    globalThis.fetch = (async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    }) as unknown as typeof fetch;

    await expect(webSearch("anything")).rejects.toThrow(/timed out/);
  });

  it("caps the number of returned results", async () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      ddgResult({
        title: `Result ${i}`,
        targetUrl: `https://example.com/${i}`,
        snippetHtml: `Snippet ${i}`,
      }),
    ).join("");
    mockDdgResponse(ddgResultsPage("many results", many));

    const results = await webSearch("many results");
    expect(results).toHaveLength(10);
    expect(results[0].title).toBe("Result 0");
    expect(results[9].title).toBe("Result 9");
  });
});

describe("formatWebSearchResults", () => {
  it("clearly labels results as DuckDuckGo's and numbers them", () => {
    const out = formatWebSearchResults("test query", [
      { title: "Title One", url: "https://example.com/one", snippet: "Snippet one." },
      { title: "Title Two", url: "https://example.com/two", snippet: "" },
    ]);

    expect(out).toContain('DuckDuckGo web search results for "test query":');
    expect(out).toContain("1. Title One");
    expect(out).toContain("https://example.com/one");
    expect(out).toContain("Snippet one.");
    expect(out).toContain("2. Title Two");
    expect(out).toContain("https://example.com/two");
  });
});
