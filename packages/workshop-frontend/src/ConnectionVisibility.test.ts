import { describe, expect, it } from 'vitest'
import { ConnectionVisibility } from './ConnectionVisibility'

class VisibilitySource extends EventTarget {
  visibilityState: DocumentVisibilityState = 'visible'

  setVisibility(state: DocumentVisibilityState): void {
    this.visibilityState = state
    this.dispatchEvent(new Event('visibilitychange'))
  }
}

describe('ConnectionVisibility', () => {
  it('suspends once while hidden and resumes waiters when visible', async () => {
    const source = new VisibilitySource()
    let hiddenCount = 0
    const visibility = new ConnectionVisibility(source, () => { hiddenCount++ })

    source.setVisibility('hidden')
    source.setVisibility('hidden')
    expect(visibility.isHidden).toBe(true)
    expect(hiddenCount).toBe(1)

    let resumed = false
    const waiting = visibility.waitUntilVisible().then(() => { resumed = true })
    await Promise.resolve()
    expect(resumed).toBe(false)

    source.setVisibility('visible')
    await waiting
    expect(visibility.isHidden).toBe(false)
    expect(resumed).toBe(true)
    visibility.dispose()
  })

  it('starts suspended without opening a connection for an initially hidden document', async () => {
    const source = new VisibilitySource()
    source.visibilityState = 'hidden'
    const visibility = new ConnectionVisibility(source, () => {})

    let resumed = false
    const waiting = visibility.waitUntilVisible().then(() => { resumed = true })
    await Promise.resolve()
    expect(visibility.isHidden).toBe(true)
    expect(resumed).toBe(false)

    source.setVisibility('visible')
    await waiting
    expect(resumed).toBe(true)
    visibility.dispose()
  })
})
