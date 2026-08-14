import { useState, useEffect, useRef, useCallback } from 'react'
import { RpcStub } from 'capnweb'
import { PublicApi, AuthenticatedApi, FamilyEntry } from '@gadgets/workshop-shared/api'

const CF_ACCESS_MODE = import.meta.env.VITE_CF_ACCESS_MODE === 'true'

interface AuthState {
  token: string | null
  authenticatedApi: RpcStub<AuthenticatedApi> | null
  familyEntry: RpcStub<FamilyEntry> | null
  isLoading: boolean
  error: string | null
}

export { CF_ACCESS_MODE }

export function useAuth(publicApi: RpcStub<PublicApi>) {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    authenticatedApi: null,
    familyEntry: null,
    isLoading: true,
    error: null
  })

  // Track current authenticated API stub for cleanup on unmount.
  // State closures go stale in cleanup functions, so we use a ref.
  const authenticatedApiRef = useRef<RpcStub<AuthenticatedApi> | null>(null)
  authenticatedApiRef.current = authState.authenticatedApi
  const familyEntryRef = useRef<RpcStub<FamilyEntry> | null>(null)
  familyEntryRef.current = authState.familyEntry

  useEffect(() => {
    if (CF_ACCESS_MODE) {
      authenticateWithCfAccess()
    } else {
      const storedToken = localStorage.getItem('authToken')
      if (storedToken) {
        authenticateWithToken(storedToken)
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }
    return () => {
      // The authenticateWithXxx functions also dispose the old stub via their setAuthState
      // updater, so this may double-dispose on reconnect. That's fine — dispose is idempotent.
      authenticatedApiRef.current?.[Symbol.dispose]()
      familyEntryRef.current?.[Symbol.dispose]()
    }
  }, [publicApi])

  const authenticateWithCfAccess = () => {
    setAuthState(prev => {
      if (prev.authenticatedApi) {
        prev.authenticatedApi[Symbol.dispose]()
      }
      if (prev.familyEntry) {
        prev.familyEntry[Symbol.dispose]()
      }
      return { ...prev, authenticatedApi: null, familyEntry: null, isLoading: true, error: null }
    })

    // Access authentication yields only a chooser capability until a server-backed profile is selected.
    const familyEntry = publicApi.authenticateFromCfAccess()
    setAuthState({
      token: null,
      authenticatedApi: null,
      familyEntry,
      isLoading: false,
      error: null
    })
  }

  const authenticateWithToken = (token: string) => {
    setAuthState(prev => {
      // Dispose the previous authenticated API stub if it exists
      if (prev.authenticatedApi) {
        prev.authenticatedApi[Symbol.dispose]()
      }
      if (prev.familyEntry) {
        prev.familyEntry[Symbol.dispose]()
      }
      return {
        ...prev,
        authenticatedApi: null, // Clear the disposed stub
        familyEntry: null,
        isLoading: true,
        error: null
      }
    })

    // Use promise pipelining - we can use the returned promise as a stub immediately
    // without awaiting. Authentication errors will be handled when the stub is actually used.
    const authenticatedApi = publicApi.authenticate(token)
    setAuthState({
        token,
        authenticatedApi,
        familyEntry: null,
      isLoading: false,
      error: null
    })
  }

  const login = (token: string) => {
    authenticateWithToken(token)
  }

  const logout = () => {
    if (CF_ACCESS_MODE) {
      window.location.assign('/cdn-cgi/access/logout')
      return
    }

    // Use functional updater to read current state (avoids stale closure).
    setAuthState(prev => {
      if (prev.authenticatedApi) {
        prev.authenticatedApi[Symbol.dispose]()
      }
      if (prev.familyEntry) {
        prev.familyEntry[Symbol.dispose]()
      }
      return {
        token: null,
        authenticatedApi: null,
        familyEntry: null,
        isLoading: false,
        error: null
      }
    })

    localStorage.removeItem('authToken')
  }

  const setFamilyAuthenticatedApi = useCallback((authenticatedApi: RpcStub<AuthenticatedApi>) => {
    setAuthState(previous => {
      previous.authenticatedApi?.[Symbol.dispose]()
      return { ...previous, authenticatedApi, error: null }
    })
  }, [])

  return {
    ...authState,
    login,
    logout,
    setFamilyAuthenticatedApi,
    isAuthenticated: !!authState.authenticatedApi
  }
}
