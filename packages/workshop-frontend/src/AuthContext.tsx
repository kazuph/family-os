import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { RpcStub } from 'capnweb'
import { AuthenticatedApi, AiChatAuthorInfo, FamilyEntry } from '@gadgets/workshop-shared/api'

interface AuthContextType {
  authenticatedApi: RpcStub<AuthenticatedApi>
  familyEntry: RpcStub<FamilyEntry> | null
  /** Swaps the session to a newly selected Family OS profile capability. */
  activateFamilyProfile: (api: RpcStub<AuthenticatedApi>) => void
  logout: () => void
  /** Current user info, fetched once on mount. Null while loading. */
  currentUser: AiChatAuthorInfo | null
  /** Whether the current user is a deployment admin. False while loading / for non-admins. */
  isAdmin: boolean
  /** True while the active Family OS profile is a child. False outside Family mode. */
  isFamilyChild: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
  authenticatedApi: RpcStub<AuthenticatedApi>
  familyEntry: RpcStub<FamilyEntry> | null
  activateFamilyProfile: (api: RpcStub<AuthenticatedApi>) => void
  onLogout: () => void
}

export function AuthProvider({ children, authenticatedApi, familyEntry, activateFamilyProfile, onLogout }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AiChatAuthorInfo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isFamilyChild, setIsFamilyChild] = useState(false)

  useEffect(() => {
    let cancelled = false
    authenticatedApi.whoami().then((info) => {
      if (!cancelled) setCurrentUser(info)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [authenticatedApi])

  useEffect(() => {
    let cancelled = false
    authenticatedApi.amIAdmin().then((admin) => {
      if (!cancelled) setIsAdmin(admin)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [authenticatedApi])

  useEffect(() => {
    if (!familyEntry) {
      setIsFamilyChild(false)
      return
    }
    let cancelled = false
    familyEntry.getState().then((state) => {
      if (!cancelled) setIsFamilyChild(state.activeProfile.kind === 'child')
    }).catch(() => {
      if (!cancelled) setIsFamilyChild(false)
    })
    return () => { cancelled = true }
  }, [familyEntry, authenticatedApi])

  return (
    <AuthContext.Provider value={{
      authenticatedApi, familyEntry, activateFamilyProfile, logout: onLogout,
      currentUser, isAdmin, isFamilyChild,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthenticatedApi() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthenticatedApi must be used within an AuthProvider')
  }
  return context
}

/** Returns the auth context when inside an AuthProvider, or null on public pages. */
export function useOptionalAuthenticatedApi(): AuthContextType | null {
  return useContext(AuthContext)
}
