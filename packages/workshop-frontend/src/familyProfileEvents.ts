const FAMILY_PROFILE_CHANGED_KEY = 'family-os-profile-changed'

export function announceFamilyProfileChanged(): void {
  localStorage.setItem(FAMILY_PROFILE_CHANGED_KEY, crypto.randomUUID())
}

export function isFamilyProfileChangedEvent(event: StorageEvent): boolean {
  return event.key === FAMILY_PROFILE_CHANGED_KEY
}
