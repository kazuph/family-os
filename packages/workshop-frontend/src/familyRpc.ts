import {
  FAMILY_ERROR_CODES,
  FAMILY_ERROR_MESSAGES,
  type FamilyErrorCode,
  type FamilyRpcResult,
  unwrapFamilyRpcResult,
} from '@gadgets/workshop-shared/api'

export { unwrapFamilyRpcResult }

/** Maps a Family OS RPC failure to a user-visible message. */
export function familyRpcErrorMessage(code: FamilyErrorCode): string {
  return FAMILY_ERROR_MESSAGES[code]
}

/** Handles a Family OS RPC failure, redirecting to Access logout when OTP recovery is required. */
export function handleFamilyRpcFailure(code: FamilyErrorCode, onMessage: (message: string) => void): void {
  if (code === FAMILY_ERROR_CODES.passcodeReauthenticationRequired) {
    window.location.assign('/cdn-cgi/access/logout')
    return
  }
  onMessage(familyRpcErrorMessage(code))
}

/** Unwraps a Family OS RPC result or routes the coded failure through `handleFamilyRpcFailure`. */
export function applyFamilyRpcResult<T>(
  result: FamilyRpcResult<T>,
  onSuccess: (value: T) => void,
  onMessage: (message: string) => void,
): void {
  if (!result.ok) {
    handleFamilyRpcFailure(result.error, onMessage)
    return
  }
  onSuccess(result.value)
}

/** Unwraps a Family OS RPC result or throws a coded error for unexpected failure handling. */
export function requireFamilyRpcResult<T>(result: FamilyRpcResult<T>): T {
  return unwrapFamilyRpcResult(result)
}
