// Built-in DuckDuckGo-backed keyword web search for the agent.
//
// DuckDuckGo has no official organic-results API: its "Instant Answer" API only covers a narrow
// set of structured/knowledge-panel queries (calculators, definitions, disambiguation pages),
// not general web search, so it is not a substitute here. Instead this reads and parses
// DuckDuckGo's own HTML search surface (https://duckduckgo.com/html/) -- the same
// no-JavaScript-required page DuckDuckGo serves to browsers with scripting disabled -- using the
// Workers runtime's HTMLRewriter for resilient streaming parsing rather than string matching.
// (Markup verified live against https://duckduckgo.com/html/?q=... on 2026-08-17: each result is
// an `a.result__a` title link -- href `//duckduckgo.com/l/?uddg=<url-encoded target>&rut=...` --
// followed by an `a.result__snippet` link with the same redirect href.)
//
// The caller's search query leaves Family OS and is sent to DuckDuckGo; see the `webSearch` tool
// description in agent.ts for the user-facing disclosure. Reading a specific result further goes
// through the existing `webFetch` tool, not this module.
//
// This module only ever fetches a fixed https://duckduckgo.com/html/ URL of our own construction
// (the query is a URL-encoded parameter, never a caller-supplied URL), so there is no
// attacker-controlled fetch destination here to protect against with URL validation. The same
// `global_fetch_strictly_public` compatibility flag documented in web-fetch.ts still governs every
// fetch() call at the runtime level.

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

const DDG_HTML_ENDPOINT = "https://duckduckgo.com/html/";
const FETCH_TIMEOUT_MS = 15_000;
// DuckDuckGo's HTML endpoint serves a bot-challenge/degraded page to some non-browser-like user
// agents; a realistic desktop UA string reliably gets the real results page instead (verified
// against the live endpoint).
const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/128.0.0.0 Safari/537.36";
// The results page itself is a few hundred KB; cap well above that so parsing stays bounded
// without truncating a legitimate page.
const HARD_MAX_BYTES = 2 * 1024 * 1024;
const MAX_RESULTS = 10;

// Resolves a DuckDuckGo result anchor's href to the real target URL. DuckDuckGo's HTML surface
// wraps every result link in a same-site redirect (`//duckduckgo.com/l/?uddg=<encoded>&rut=...`)
// for click tracking; the real destination is the `uddg` query parameter. Falls back to the href
// itself (resolved against DuckDuckGo's origin) for any link that isn't wrapped this way.
function resolveDdgTargetUrl(href: string | null): string | undefined {
  if (!href) return undefined;
  let resolved: URL;
  try {
    resolved = new URL(href, DDG_HTML_ENDPOINT);
  } catch {
    return undefined;
  }
  const uddg = resolved.searchParams.get("uddg");
  return uddg || resolved.toString();
}

// Reads a stream up to `maxBytes`, discarding the bytes (this module only cares about
// HTMLRewriter's handler side effects, driven by reading its transformed output). Cancels the
// underlying stream once the cap is hit, mirroring web-fetch.ts's readBodyCapped.
async function drainCapped(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<void> {
  if (!body) return;
  const reader = body.getReader();
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Run a DuckDuckGo keyword search and return organic results (title, url, snippet), in the order
 * DuckDuckGo returned them. Throws a descriptive error if the request fails, times out, or the
 * response doesn't look like a DuckDuckGo results page (upstream markup change or a block page) --
 * never silently returns an empty array in that case, so callers can tell "no results" apart from
 * "couldn't parse the response".
 */
export async function webSearch(query: string): Promise<WebSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("A search query is required.");

  const url = new URL(DDG_HTML_ENDPOINT);
  url.searchParams.set("q", trimmed);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": USER_AGENT, "accept": "text/html" },
      signal: abortController.signal,
    });
  } catch (err) {
    if (err instanceof Error && (err.name === "AbortError" || /abort/i.test(err.message))) {
      throw new Error(`DuckDuckGo search timed out after ${FETCH_TIMEOUT_MS}ms`, { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed with HTTP ${response.status}.`);
  }

  const results: WebSearchResult[] = [];
  let sawResultsContainer = false;
  let sawDuckDuckGoTitle = false;

  let current: { url?: string; titleParts: string[]; snippetParts: string[] } | null = null;
  let capturing: "title" | "snippet" | null = null;

  const finishCurrent = () => {
    if (current?.url && current.titleParts.length > 0) {
      const title = current.titleParts.join("").trim();
      if (title) {
        results.push({ title, url: current.url, snippet: current.snippetParts.join("").trim() });
      }
    }
    current = null;
  };

  const rewriter = new HTMLRewriter()
    .on("title", {
      text(text) {
        if (/DuckDuckGo/i.test(text.text)) sawDuckDuckGoTitle = true;
      },
    })
    .on("#links", {
      element() {
        sawResultsContainer = true;
      },
    })
    .on("a.result__a", {
      element(el) {
        // A previous result's title link should always have closed via onEndTag before the next
        // one starts, but finish defensively in case a malformed page nests them.
        finishCurrent();
        current = { url: resolveDdgTargetUrl(el.getAttribute("href")), titleParts: [], snippetParts: [] };
        capturing = "title";
        el.onEndTag(() => {
          capturing = null;
        });
      },
      text(text) {
        if (capturing === "title" && current) current.titleParts.push(text.text);
      },
    })
    .on("a.result__snippet", {
      element(el) {
        capturing = "snippet";
        el.onEndTag(() => {
          capturing = null;
        });
      },
      text(text) {
        if (capturing === "snippet" && current) current.snippetParts.push(text.text);
      },
    });

  await drainCapped(rewriter.transform(response).body, HARD_MAX_BYTES);
  finishCurrent();

  if (!sawDuckDuckGoTitle || !sawResultsContainer) {
    throw new Error(
      "DuckDuckGo returned a page this tool doesn't recognize as search results (its HTML " +
      "markup may have changed, or the request may have been blocked). Try again, rephrase the " +
      "query, or use webFetch on a specific URL instead.",
    );
  }

  return results.slice(0, MAX_RESULTS);
}

/** Format search results as a single string for the agent, clearly labeled as DuckDuckGo's. */
export function formatWebSearchResults(query: string, results: WebSearchResult[]): string {
  if (results.length === 0) {
    return `DuckDuckGo web search for "${query}" returned no organic results.`;
  }
  const lines = [`DuckDuckGo web search results for "${query}":`, ""];
  results.forEach((result, index) => {
    lines.push(`${index + 1}. ${result.title}`);
    lines.push(`   ${result.url}`);
    if (result.snippet) lines.push(`   ${result.snippet}`);
    lines.push("");
  });
  return lines.join("\n").trimEnd();
}
