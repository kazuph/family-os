import { logRpcFailure } from '../rpcErrors'
import { useState, useEffect } from 'react'
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { TooltipProvider, Toasty } from '@cloudflare/kumo'
import { RpcStub } from 'capnweb'
import { AuthenticatedApi, FamilyEntry, FamilyState, FAMILY_ADULT_PASSCODE_LENGTH, isFamilyAdultPasscode } from '@gadgets/workshop-shared/api'
import { useRpcStub, useConnectionLost } from '../RpcContext'
import { markConnectionRestored } from '../main'
import { useAuth, CF_ACCESS_MODE } from '../useAuth'
import { AuthProvider } from '../AuthContext'
import { applyFamilyRpcResult, handleFamilyRpcFailure, requireFamilyRpcResult } from '../familyRpc'
import { familyUi, isFamilyMode } from '../familyUi'
import { FeatureFlagsProvider } from '../FeatureFlagsContext'
import Header from '../components/Header'
import AppShell from '../components/AppShell/AppShell'
import LoginPage from '../LoginPage'
import OnboardingWizard from '../OnboardingWizard'
import AccountSelectionModal from '../components/billing/AccountSelectionModal'

function FamilyAvatarThumb({ avatarId, label }: { avatarId?: string; label: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-kumo-fill">
      {avatarId ? (
        <img src={`/family-avatars/${avatarId}.png`} alt="" className="h-full w-full object-contain" />
      ) : (
        <span className="text-sm font-medium text-kumo-subtle">{label.slice(0, 1)}</span>
      )}
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const rpcStub = useRpcStub()
  const connectionLost = useConnectionLost()
  const { isAuthenticated, authenticatedApi, familyEntry, isLoading, error, logout, login, setFamilyAuthenticatedApi } = useAuth(rpcStub)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // When authenticatedApi becomes available, the connection is proven alive.
  useEffect(() => {
    if (authenticatedApi) markConnectionRestored()
  }, [authenticatedApi])

  // Routes that don't require auth (public routes)
  const isSignup = pathname === '/signup'
  const isBlueprint = pathname.startsWith('/blueprint/')

  // A standalone (no app shell) render is used only for signed-out visitors of public routes.
  // Signed-in users get the full app chrome so public pages (esp. the blueprint detail) feel
  // native — sidebar and all — instead of floating on a bare page.
  const standalone = isSignup || (isBlueprint && !isAuthenticated)

  // The workspace editor renders fullscreen (no app chrome). /gadget/ is the legacy URL, kept
  // here so the chrome doesn't flash in during the redirect to /workspace/.
  const isWorkspaceEditor = pathname.startsWith('/workspace/') || pathname.startsWith('/gadget/')

  const handleLoginSuccess = () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      login(token)
    }
  }

  // Loading state
  if (isLoading && !standalone) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col gap-4 bg-kumo-base">
        <div className="w-8 h-8 border-2 border-kumo-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-kumo-subtle">
          {connectionLost
            ? (isFamilyMode ? 'サーバーを待っています…' : 'Waiting for server…')
            : (isFamilyMode ? '読み込み中…' : 'Loading...')}
        </p>
      </div>
    )
  }

  // Auth error
  if (error && !standalone) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col gap-4 bg-kumo-base p-6">
        <p className="text-sm text-kumo-danger">
          {isFamilyMode ? `認証エラー: ${error}` : `Authentication error: ${error}`}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-kumo-inverse bg-kumo-brand rounded-lg hover:bg-kumo-brand-hover transition-colors"
        >
          {isFamilyMode ? '再試行' : 'Retry'}
        </button>
      </div>
    )
  }

  if (!authenticatedApi && familyEntry && CF_ACCESS_MODE && !standalone) {
    return <FamilyProfileChooser familyEntry={familyEntry} onAuthenticated={setFamilyAuthenticatedApi} />
  }

  // CF Access mode: show spinner while the chooser capability resolves.
  if (!isAuthenticated && CF_ACCESS_MODE && !standalone) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col gap-4 bg-kumo-base">
        <div className="w-8 h-8 border-2 border-kumo-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-kumo-subtle">{isFamilyMode ? '認証中…' : 'Authenticating...'}</p>
      </div>
    )
  }

  // Not authenticated and not a public route — show login
  if (!isAuthenticated && !standalone) {
    return <LoginPage rpcStub={rpcStub} onLoginSuccess={handleLoginSuccess} />
  }

  // Signed-out visitors of public routes render without the auth wrapper / app shell.
  if (standalone) {
    const showHeader = !isSignup
    return (
      <TooltipProvider>
        <Toasty>
          <div className="flex h-full min-h-0 flex-col">
            {showHeader && <Header />}
            <main className="min-h-0 flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </Toasty>
      </TooltipProvider>
    )
  }

  // Authenticated — render the full shell (with onboarding gate)
  // authenticatedApi is guaranteed non-null here: isLoading, error, and
  // !isAuthenticated branches all return early above.
  if (!authenticatedApi) return null
  return (
    <AuthProvider authenticatedApi={authenticatedApi} familyEntry={familyEntry} activateFamilyProfile={setFamilyAuthenticatedApi} onLogout={logout}>
      <FeatureFlagsProvider>
        <TooltipProvider>
          <Toasty>
            <AuthenticatedShell
              authenticatedApi={authenticatedApi}
              isWorkspaceEditor={isWorkspaceEditor}
            />
          </Toasty>
        </TooltipProvider>
      </FeatureFlagsProvider>
    </AuthProvider>
  )
}

function FamilyProfileChooser({ familyEntry, onAuthenticated }: {
  familyEntry: RpcStub<FamilyEntry>
  onAuthenticated: (api: RpcStub<AuthenticatedApi>) => void
}) {
  const [state, setState] = useState<FamilyState | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [childName, setChildName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setRestoring(false)
    familyEntry.getState().then(async (next) => {
      if (cancelled) return
      if (next.activeProfile.kind !== 'unselected' && !next.requiresAccessReauthentication) {
        setRestoring(true)
        try {
          let apiResult = await familyEntry.getAuthenticatedApi()
          if (cancelled) return
          if (!apiResult.ok) {
            handleFamilyRpcFailure(apiResult.error, setError)
            setState(next)
            setRestoring(false)
            return
          }
          onAuthenticated(requireFamilyRpcResult(apiResult))
        } catch (cause) {
          if (!cancelled) {
            setError(cause instanceof Error ? cause.message : familyUi.unableToRestore)
            setState(next)
            setRestoring(false)
          }
        }
        return
      }
      setState(next)
    }).catch((cause) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : familyUi.unableToLoad)
    })
    return () => { cancelled = true }
  }, [familyEntry, onAuthenticated])

  const activate = async (select: () => Promise<import('@gadgets/workshop-shared/api').FamilyRpcResult<void>>) => {
    try {
      let selection = await select()
      if (!selection.ok) {
        handleFamilyRpcFailure(selection.error, setError)
        return
      }
      let apiResult = await familyEntry.getAuthenticatedApi()
      onAuthenticated(requireFamilyRpcResult(apiResult))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : familyUi.unableToSelect)
    }
  }

  if (!state && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-kumo-base">
        <div className="w-8 h-8 border-2 border-kumo-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-kumo-subtle">{restoring ? familyUi.restoringProfile : familyUi.loadingProfiles}</p>
      </div>
    )
  }
  if (!state) return null
  return (
    <main className="min-h-screen flex items-center justify-center bg-kumo-base p-6">
      <section className="w-full max-w-xl space-y-4">
        <header><h1 className="text-2xl font-semibold">{familyUi.chooseProfile}</h1></header>
        <button type="button" className="flex w-full items-center gap-3 rounded-lg border p-4 text-left" onClick={() => {
          // Unknown/stale devices need the shared passcode unless Access loginIat is newer.
          void activate(() => familyEntry.selectAdultProfile(
            state.passcodeConfigured && passcode ? passcode : undefined,
          ))
        }}>
          <FamilyAvatarThumb
            avatarId={state.activeProfile.kind === 'adult'
              ? state.activeProfile.monsterAvatarId
              : state.adultMonsterAvatarId}
            label={familyUi.adultProfile}
          />
          <span className="font-medium">{familyUi.continueAsAdult}</span>
        </button>
        {state.passcodeConfigured && <input value={passcode} onChange={(event) => setPasscode(event.target.value)}
          inputMode="numeric" maxLength={FAMILY_ADULT_PASSCODE_LENGTH} placeholder={familyUi.adultPasscode}
          aria-label={familyUi.adultPasscode} className="w-full rounded border p-2" />}
        {state.childProfiles.map((profile) => (
          <button key={profile.id} type="button" className="flex w-full items-center gap-3 rounded-lg border p-4 text-left" onClick={() => {
            // Already-selected child cannot call selectChild again (chooser requires adult/unselected).
            if (state.activeProfile.kind === 'child' && state.activeProfile.id === profile.id) {
              void activate(async () => ({ ok: true as const, value: undefined }))
              return
            }
            void activate(() => familyEntry.selectChildProfile(profile.id))
          }}>
            <FamilyAvatarThumb avatarId={profile.monsterAvatarId} label={profile.name} />
            <span className="font-medium">{profile.name}</span>
          </button>
        ))}
        {!state.passcodeConfigured && <div className="space-y-2">
          <input value={passcode} onChange={(event) => setPasscode(event.target.value)} inputMode="numeric"
            maxLength={FAMILY_ADULT_PASSCODE_LENGTH} placeholder={familyUi.setPasscodePlaceholder}
            aria-label={familyUi.setPasscodePlaceholder} className="w-full rounded border p-2" />
          <button type="button" onClick={() => {
            if (!isFamilyAdultPasscode(passcode)) {
              setError(familyUi.passcodeMustBeDigits)
              return
            }
            void familyEntry.setHouseholdPasscode(passcode).then((result) => {
              applyFamilyRpcResult(result, setState, setError)
            })
          }}>
            {familyUi.setPasscode}
          </button>
        </div>}
        {state.passcodeConfigured && <div className="space-y-2">
          <input value={childName} onChange={(event) => setChildName(event.target.value)}
            placeholder={familyUi.childNamePlaceholder} aria-label={familyUi.childNamePlaceholder}
            className="w-full rounded border p-2" />
          <button type="button" onClick={() => {
            void familyEntry.createChildProfile(childName).then((result) => {
              applyFamilyRpcResult(result, setState, setError)
            })
          }}>
            {familyUi.addChild}
          </button>
        </div>}
        {error && <p className="text-kumo-danger">{error}</p>}
      </section>
    </main>
  )
}

/**
 * Inner shell that checks onboarding status and either shows the wizard
 * or the normal app chrome. Lives inside AuthProvider so the wizard can
 * use useAuthenticatedApi().
 */
function AuthenticatedShell({
  authenticatedApi,
  isWorkspaceEditor,
}: {
  authenticatedApi: RpcStub<AuthenticatedApi>
  isWorkspaceEditor: boolean
}) {
  // null = still checking, true = needs onboarding, false = onboarding done
  const [onboardingNeeded, setOnboardingNeeded] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    authenticatedApi.isOnboardingCompleted().then((completed) => {
      if (!cancelled) setOnboardingNeeded(!completed)
    }).catch((err) => {
      logRpcFailure('Failed to check onboarding status:', err)
      // If the check fails, skip onboarding to avoid blocking the user
      if (!cancelled) setOnboardingNeeded(false)
    })
    return () => { cancelled = true }
  }, [authenticatedApi])

  // Still checking onboarding status
  if (onboardingNeeded === null) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col gap-4 bg-kumo-base">
        <div className="w-8 h-8 border-2 border-kumo-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Show onboarding wizard
  if (onboardingNeeded) {
    return <OnboardingWizard onComplete={() => setOnboardingNeeded(false)} />
  }

  // Normal app shell. The workspace editor is rendered fullscreen (no chrome); everything else
  // gets the persistent left-rail AppShell. Connection loss is surfaced by a chip in whichever of
  // those two top bars is showing, never by a banner that reflows the page (see ReconnectingChip).
  const fullscreen = isWorkspaceEditor
  return (
    <>
      <AccountSelectionModal />
      {fullscreen ? (
        <main className="h-full min-h-0">
          <Outlet />
        </main>
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}
    </>
  )
}
