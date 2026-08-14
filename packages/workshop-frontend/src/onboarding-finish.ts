/** Resolves the preferred model to persist when finishing the adult setup wizard. */
export function resolveOnboardingPreferredModel(
  selectedModelId: string | null,
  listedIds: readonly string[],
): string | null {
  if (selectedModelId && listedIds.includes(selectedModelId)) return selectedModelId;
  return listedIds[0] ?? null;
}

/** Photo avatars are adult-password-mode only. Family OS Access deployments use monster avatars. */
export function shouldUploadPhotoAvatar(accessMode: boolean): boolean {
  return !accessMode;
}
