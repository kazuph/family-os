import { describe, expect, it } from 'vitest'
import {
  resolveOnboardingPreferredModel,
  shouldUploadPhotoAvatar,
} from './onboarding-finish'

describe('resolveOnboardingPreferredModel', () => {
  it('keeps a selected model that is still in the catalog', () => {
    expect(resolveOnboardingPreferredModel('deepseek-v4-flash', [
      'deepseek-v4-flash',
      'claude-sonnet-4-5',
    ])).toBe('deepseek-v4-flash')
  })

  it('falls back to the first listed model when the selection is missing or stale', () => {
    expect(resolveOnboardingPreferredModel(null, ['deepseek-v4-flash'])).toBe('deepseek-v4-flash')
    expect(resolveOnboardingPreferredModel('gone', ['deepseek-v4-flash'])).toBe('deepseek-v4-flash')
  })

  it('stores no preference when the catalog is empty', () => {
    expect(resolveOnboardingPreferredModel('deepseek-v4-flash', [])).toBeNull()
    expect(resolveOnboardingPreferredModel(null, [])).toBeNull()
  })
})

describe('shouldUploadPhotoAvatar', () => {
  it('never uploads a photo avatar on Family OS Access deployments', () => {
    expect(shouldUploadPhotoAvatar(true)).toBe(false)
    expect(shouldUploadPhotoAvatar(false)).toBe(true)
  })
})
