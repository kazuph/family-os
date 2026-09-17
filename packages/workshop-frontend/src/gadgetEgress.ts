// Per-gadget external-reference approval ("egress approval").
//
// Gadget UIs run in a fully sandboxed iframe whose document policy blocks every
// external host. This module holds the pure policy used by GadgetUI: how the
// document policy is rebuilt when the user approves hosts for one gadget, how a
// request is judged at runtime, and where approvals are kept. It is generic on
// purpose -- no map, tile, or library host is special-cased here.
//
// Server-side execution is intentionally untouched: the gadget worker keeps
// `globalOutbound: null`, so this only ever relaxes the browser preview.

/** Document policy served to the sandboxed iframe when nothing is approved. */
export const BASE_SANDBOX_CSP =
  "default-src 'none'; frame-src 'none'; script-src data: 'unsafe-inline'; " +
  "style-src data: 'unsafe-inline'; img-src data:; media-src data:; " +
  "object-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none';"

/** localStorage namespace for per-gadget approvals (browser preview only). */
const STORAGE_PREFIX = 'gadget-egress-allow:'

/** Storage key for one gadget's approved hosts. */
export function storageKey(gadgetKey: string): string {
  return `${STORAGE_PREFIX}${gadgetKey}`
}

/**
 * Whether a raw approval entry is a bare hostname or a `*.suffix` wildcard.
 * URLs, paths, ports, bare `*`, and empty strings are rejected so an approval
 * can never smuggle in more authority than "this host, fetched without
 * credentials from an opaque origin". Wildcards must cover a full domain
 * (`*.example.com`), never a bare public suffix (`*.com`).
 */
export function isValidHostEntry(entry: string): boolean {
  if (!/^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)*$/i.test(entry)) return false
  if (entry.startsWith('*.') && entry.split('.').length < 3) return false
  return true
}

export type EgressScope =
  | {persistent: true, key: string}
  | {persistent: false, key: string}

/**
 * Build the storage scope for one gadget's approvals. The gadget id restarts
 * at zero in every workspace, so the workspace id is always part of a
 * persistent key -- without it approvals would leak into the same-numbered
 * gadget of another workspace sharing this origin's storage. When either
 * identifier is missing the scope is ephemeral: nothing is loaded or saved
 * (fail closed to the current lockdown).
 */
export function buildEgressScope(
  workspaceId: string | null | undefined,
  gadgetId: string | number | null | undefined,
): EgressScope {
  if (workspaceId && (gadgetId === 0 || gadgetId)) {
    return {persistent: true, key: `${STORAGE_PREFIX}workspace:${workspaceId}:gadget:${gadgetId}`}
  }
  let nonce = ''
  try {
    nonce = globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2)
  } catch {
    nonce = String(Math.random()).slice(2)
  }
  return {persistent: false, key: `${STORAGE_PREFIX}session:${nonce}`}
}

/** Whether `host` is covered by the allowlist (exact or `*.suffix` match). */
export function hostMatchesAllowlist(host: string, allowlist: readonly string[]): boolean {
  const lower = host.toLowerCase()
  return allowlist.some(entry => {
    const candidate = entry.toLowerCase()
    if (candidate.startsWith('*.')) {
      const suffix = candidate.slice(2)
      return lower.length > suffix.length &&
        lower.endsWith(suffix) &&
        lower[lower.length - suffix.length - 1] === '.'
    }
    return lower === candidate
  })
}

/**
 * Rebuild the sandboxed-iframe document policy with approved hosts added to
 * the script, style, image, media, font, and connection sources. Frames,
 * objects, and form targets stay closed however many hosts are approved.
 */
export function buildSandboxCsp(approvedHosts: readonly string[]): string {
  const valid = approvedHosts.filter(isValidHostEntry)
  if (valid.length === 0) return BASE_SANDBOX_CSP
  const sources = valid.map(host => `https://${host}`).join(' ')
  return (
    "default-src 'none'; frame-src 'none'; " +
    `script-src data: 'unsafe-inline' ${sources}; ` +
    `style-src data: 'unsafe-inline' ${sources}; ` +
    `img-src data: blob: ${sources}; ` +
    `media-src data: blob: ${sources}; ` +
    `font-src data: ${sources}; ` +
    "object-src 'none'; base-uri 'none'; form-action 'none'; " +
    `connect-src ${sources};`
  )
}

/**
 * Decide whether a request from inside the gadget sandbox may proceed.
 * Embedded `data:`/`blob:` payloads always pass; anything else must be an
 * `https:` GET or HEAD to an approved host. The document policy cannot limit
 * HTTP methods, so callers must enforce this alongside the policy.
 */
export function shouldAllowEgress(
  url: string, method: string, approvedHosts: readonly string[]): boolean {
  if (url.startsWith('data:') || url.startsWith('blob:')) return true
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  const upper = method.toUpperCase()
  if (upper !== 'GET' && upper !== 'HEAD') return false
  return hostMatchesAllowlist(parsed.hostname, approvedHosts)
}

// TODO(gadget-egress-approval): persist approvals in the overseer (per-gadget,
// owner-authorized, with cleanup on gadget removal) so preview and verification
// share one source of truth instead of this browser-local bridge.
/** Approved hosts kept for one gadget; empty when nothing was approved. */
export function loadApprovedHosts(scope: EgressScope): string[] {
  if (!scope.persistent) return []
  try {
    const raw = globalThis.localStorage?.getItem(scope.key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string =>
      typeof entry === 'string' && isValidHostEntry(entry))
  } catch {
    return []
  }
}

/** Persist one gadget's approved hosts, dropping anything malformed. */
export function saveApprovedHosts(scope: EgressScope, hosts: readonly string[]): void {
  if (!scope.persistent) return
  try {
    globalThis.localStorage?.setItem(
      scope.key, JSON.stringify(hosts.filter(isValidHostEntry)))
  } catch {
    // Storage is best-effort (private mode, SSR); the approval simply will
    // not survive a reload, which fails closed to the current lockdown.
  }
}

/**
 * Runtime guard prepended to the gadget bundle before it is embedded. It
 * reports blocked external traffic to the parent frame (`egress-blocked`
 * with host, kind, and method -- never the full URL, so query parameters
 * cannot leak into the notice) and only lets approved GET/HEAD through.
 * Document-policy violations (images, styles, scripts) are reported through
 * the `securitypolicyviolation` event, which the same guard forwards.
 */
export function buildEgressGuardJs(approvedHosts: readonly string[]): string {
  const allowlist = JSON.stringify(approvedHosts.filter(isValidHostEntry))
  return String.raw`
{
  const __egressAllow = ${allowlist};
  const __egressMatch = (host) => {
    const lower = String(host).toLowerCase();
    return __egressAllow.some((entry) => {
      const candidate = String(entry).toLowerCase();
      if (candidate.startsWith('*.')) {
        const suffix = candidate.slice(2);
        return lower.length > suffix.length && lower.endsWith(suffix) &&
          lower[lower.length - suffix.length - 1] === '.';
      }
      return lower === candidate;
    });
  };
  const __egressReport = (host, kind, method) => {
    try {
      window.parent.postMessage({type: 'egress-blocked', host, kind, method}, '*');
    } catch {}
  };
  const __egressCheck = (urlText, method, kind) => {
    try {
      const url = new URL(urlText, location.href);
      if (url.protocol === 'data:' || url.protocol === 'blob:') return true;
      const upper = String(method || 'GET').toUpperCase();
      if (url.protocol === 'https:' && (upper === 'GET' || upper === 'HEAD') &&
          __egressMatch(url.hostname)) return true;
      __egressReport(url.hostname, kind, upper);
    } catch {
      __egressReport('', kind, String(method || 'GET').toUpperCase());
    }
    return false;
  };
  const __egressFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const urlText = typeof input === 'string' ? input : input?.url;
    const method = init?.method || (typeof input !== 'string' && input?.method) || 'GET';
    if (__egressCheck(String(urlText), method, 'fetch')) return __egressFetch(input, init);
    return Promise.reject(new Error('Blocked: this gadget has not approved external access.'));
  };
  const __egressOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__egressUrl = String(url);
    this.__egressMethod = String(method);
    return __egressOpen.apply(this, arguments);
  };
  const __egressSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (__egressCheck(this.__egressUrl || '', this.__egressMethod || 'GET', 'xhr')) {
      return __egressSend.apply(this, arguments);
    }
    throw new Error('Blocked: this gadget has not approved external access.');
  };
  // sendBeacon is always a POST, so it never satisfies the GET/HEAD-only
  // rule: block it and report like any other egress attempt.
  try {
    const __egressBeacon = Navigator.prototype.sendBeacon;
    Navigator.prototype.sendBeacon = function (url, data) {
      if (__egressCheck(String(url), 'POST', 'beacon')) {
        return __egressBeacon.call(this, url, data);
      }
      return false;
    };
  } catch {}
  document.addEventListener('securitypolicyviolation', (event) => {
    try {
      const blocked = String(event.blockedURI || '');
      if (blocked.startsWith('data:') || blocked.startsWith('blob:')) return;
      const url = new URL(blocked, location.href);
      const directive = String(event.violatedDirective || '');
      const kind = directive.startsWith('img') ? 'image'
        : directive.startsWith('script') ? 'script'
        : directive.startsWith('style') ? 'style'
        : directive.startsWith('connect') ? 'fetch'
        : directive.startsWith('font') ? 'font'
        : directive.startsWith('media') ? 'media' : 'other';
      __egressReport(url.hostname, kind, 'GET');
    } catch {}
  });
}
`
}
