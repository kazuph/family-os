// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  BASE_SANDBOX_CSP,
  buildEgressGuardJs,
  buildEgressScope,
  buildSandboxCsp,
  hostMatchesAllowlist,
  isValidHostEntry,
  loadApprovedHosts,
  saveApprovedHosts,
  shouldAllowEgress,
} from './gadgetEgress'

describe('gadget egress approval', () => {
  it('keeps the current lockdown CSP when nothing is approved', () => {
    expect(buildSandboxCsp([])).toBe(BASE_SANDBOX_CSP)
    expect(BASE_SANDBOX_CSP).toContain("connect-src 'none'")
  })

  it('adds approved hosts to script, style, image, and connect sources only', () => {
    const csp = buildSandboxCsp(['unpkg.com', '*.tile.openstreetmap.org'])
    expect(csp).toContain("script-src data: 'unsafe-inline' https://unpkg.com https://*.tile.openstreetmap.org")
    expect(csp).toContain('https://*.tile.openstreetmap.org')
    expect(csp).not.toContain("connect-src 'none'")
    // Never opens frames, objects, or form targets, even with approvals.
    expect(csp).toContain("frame-src 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("form-action 'none'")
  })

  it('matches exact hosts and *.suffix wildcards', () => {
    expect(hostMatchesAllowlist('unpkg.com', ['unpkg.com'])).toBe(true)
    expect(hostMatchesAllowlist('a.tile.openstreetmap.org', ['*.tile.openstreetmap.org'])).toBe(true)
    expect(hostMatchesAllowlist('tile.openstreetmap.org', ['*.tile.openstreetmap.org'])).toBe(false)
    expect(hostMatchesAllowlist('evilunpkg.com', ['unpkg.com'])).toBe(false)
    expect(hostMatchesAllowlist('unpkg.com.evil.example', ['unpkg.com'])).toBe(false)
  })

  it('allows embedded schemes without approval and approved GET only', () => {
    expect(shouldAllowEgress('data:text/javascript,1', 'GET', [])).toBe(true)
    expect(shouldAllowEgress('blob:https://x/y', 'GET', [])).toBe(true)
    expect(shouldAllowEgress('https://unpkg.com/a.js', 'GET', ['unpkg.com'])).toBe(true)
    expect(shouldAllowEgress('https://unpkg.com/a.js', 'HEAD', ['unpkg.com'])).toBe(true)
    expect(shouldAllowEgress('https://unpkg.com/a.js', 'POST', ['unpkg.com'])).toBe(false)
    expect(shouldAllowEgress('https://unpkg.com/a.js', 'GET', [])).toBe(false)
    expect(shouldAllowEgress('https://other.example/a.png', 'GET', ['unpkg.com'])).toBe(false)
  })

  it('rejects malformed host entries', () => {
    expect(isValidHostEntry('unpkg.com')).toBe(true)
    expect(isValidHostEntry('*.tile.openstreetmap.org')).toBe(true)
    expect(isValidHostEntry('*.example.com')).toBe(true)
    expect(isValidHostEntry('*.com')).toBe(false)
    expect(isValidHostEntry('https://unpkg.com/x')).toBe(false)
    expect(isValidHostEntry('unpkg.com/path')).toBe(false)
    expect(isValidHostEntry('*')).toBe(false)
    expect(isValidHostEntry('')).toBe(false)
  })

  it('namespaces approval keys by workspace and fails closed without one', () => {
    const scoped = buildEgressScope('ws1', 0)
    expect(scoped.persistent).toBe(true)
    expect(scoped.key).toBe('gadget-egress-allow:workspace:ws1:gadget:0')
    expect(buildEgressScope('ws1', 0).key).not.toBe(buildEgressScope('ws2', 0).key)
    const ephemeral = buildEgressScope(null, 0)
    expect(ephemeral.persistent).toBe(false)
    // Ephemeral scopes never persist: approvals last only for the load.
    saveApprovedHosts(ephemeral, ['unpkg.com'])
    expect(loadApprovedHosts(ephemeral)).toEqual([])
  })

  it('covers the Kagoshima HTML external set once approved (CSP plus guard)', () => {
    // Scenario-only mapping: the Leaflet stylesheet/script host and the OSM
    // tile wildcard. Production code stays generic; this pins the goal.
    const approved = ['unpkg.com', '*.tile.openstreetmap.org']
    const csp = buildSandboxCsp(approved)
    expect(csp).toContain('img-src data: blob: https://unpkg.com https://*.tile.openstreetmap.org')
    expect(csp).toContain('connect-src https://unpkg.com https://*.tile.openstreetmap.org')
    expect(shouldAllowEgress('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'GET', approved)).toBe(true)
    expect(shouldAllowEgress('https://a.tile.openstreetmap.org/12/1234/1234.png', 'GET', approved)).toBe(true)
    expect(shouldAllowEgress('https://a.tile.openstreetmap.org/12/1234/1234.png', 'POST', approved)).toBe(false)
    const guard = buildEgressGuardJs(approved)
    expect(guard).toContain('"unpkg.com"')
    expect(guard).toContain('"*.tile.openstreetmap.org"')
    expect(guard).toContain('egress-blocked')
    // sendBeacon is always a POST, so the guard must cover it too.
    expect(guard).toContain('sendBeacon')
  })

  it('round-trips approved hosts per gadget key', () => {
    const scope = buildEgressScope(`test-${Date.now()}`, 7)
    expect(loadApprovedHosts(scope)).toEqual([])
    saveApprovedHosts(scope, ['unpkg.com', 'bogus entry', '*.tile.openstreetmap.org'])
    expect(loadApprovedHosts(scope)).toEqual(['unpkg.com', '*.tile.openstreetmap.org'])
  })
})
