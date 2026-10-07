import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { RpcStub } from 'capnweb'
import { PublicApi, ServerConfig } from '@gadgets/workshop-shared/api'
import { RpcContext } from './RpcContext'
import { createWebSocketRpcConnection } from './rpcConnection'
import { ServerConfigContext, ServerConfigErrorContext } from './ServerConfigContext'
import { ThemeProvider } from './ThemeContext'
import { createRouter } from './router'
import AnnouncementBanner from './components/AnnouncementBanner'
import { applyAccentColor, applyStoredThemeMode } from './theme'
import './styles.css'
import FrontendErrorBoundary from './FrontendErrorBoundary'
import { installWorkshopErrorReporting, reportIssue } from './errorReporting'
import { applySiteFavicon, cacheBustSiteLogoUrl } from './siteLogoUtils'

// ---------------------------------------------------------------------------
// Dev auto-login: if VITE_DEV_AUTO_LOGIN=true, automatically create/login
// with the dev account before React renders, so you never see the login page.
// ---------------------------------------------------------------------------
async function devAutoLogin(stub: RpcStub<PublicApi>): Promise<void> {
  if (import.meta.env.VITE_DEV_AUTO_LOGIN !== 'true') return
  if (localStorage.getItem('authToken')) return  // already logged in

  const username = import.meta.env.VITE_DEV_USERNAME ?? 'dev'
  const password = import.meta.env.VITE_DEV_PASSWORD ?? 'devpassword'

  // Derive the passwordHash the same way the app does (argon2id via hashPassword),
  // but here we use the same SERVICE_SALT + SHA-256 shortcut that wrangler dev accepts
  // in local mode. We import hashPassword from the existing util.
  const { hashPassword } = await import('./passwordHash')
  const passwordHash = await hashPassword(username, password)

  // Try createAccount first — works on a fresh backend. Returns null if already exists.
  let token = await stub.createAccount(username, username, passwordHash)

  // If null, account already exists — just log in.
  if (!token) {
    token = await stub.login(username, passwordHash)
  }

  if (token) {
    localStorage.setItem('authToken', token)
  }
}

// WebSocket RPC connection management lives in rpcConnection.ts — including the idle disconnect
// that closes the socket after 15 continuous hidden minutes and reconnects on `visible`.
installWorkshopErrorReporting()
const rpcConnection = createWebSocketRpcConnection();

const router = createRouter()
applyStoredThemeMode()

function AppWithConnection() {
  const [rpcState, setRpcState] = useState<{stub: RpcStub<PublicApi>; connectionLost: boolean}>(
    rpcConnection.getState,
  );
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [serverConfigError, setServerConfigError] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    const updateHeight = () => {
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      document.documentElement.style.setProperty('--app-height', `${height}px`);
      document.documentElement.style.setProperty('--app-top', `${top}px`);
      document.documentElement.style.setProperty(
        '--app-bottom',
        `${Math.max(0, window.innerHeight - top - height)}px`,
      );
    };
    updateHeight();
    viewport?.addEventListener('resize', updateHeight);
    viewport?.addEventListener('scroll', updateHeight);
    window.addEventListener('resize', updateHeight);
    return () => {
      viewport?.removeEventListener('resize', updateHeight);
      viewport?.removeEventListener('scroll', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    const cb = () => setRpcState(rpcConnection.getState());
    rpcConnection.subscribers.add(cb);
    return () => { rpcConnection.subscribers.delete(cb); };
  }, []);

  // Fetch deployment config once the (re)connected stub is available. Re-fetch on reconnect so a
  // server restart with changed config is picked up.
  useEffect(() => {
    let cancelled = false;
    setServerConfigError(false);
    rpcState.stub.getServerConfig()
      .then((cfg) => {
        if (!cancelled) {
          setServerConfig(cfg.siteLogo ? {
            ...cfg,
            siteLogo: { url: cacheBustSiteLogoUrl(cfg.siteLogo.url) },
          } : cfg);
        }
      })
      .catch(() => { if (!cancelled) setServerConfigError(true); });
    return () => { cancelled = true; };
  }, [rpcState.stub]);

  // Apply the deployment's admin-chosen accent color (overrides brand CSS vars at runtime).
  useEffect(() => {
    applyAccentColor(serverConfig?.accentColor ?? '');
  }, [serverConfig?.accentColor]);

  useEffect(() => {
    return applySiteFavicon(serverConfig?.siteLogo?.url);
  }, [serverConfig]);

  return (
    <ThemeProvider>
      <RpcContext.Provider value={rpcState}>
        <ServerConfigErrorContext.Provider value={serverConfigError}>
          <ServerConfigContext.Provider value={serverConfig}>
            <div className="app-viewport flex min-w-0 flex-col overflow-hidden">
              <AnnouncementBanner />
              <div className="h-full min-h-0 flex-1">
                <RouterProvider router={router} />
              </div>
            </div>
          </ServerConfigContext.Provider>
        </ServerConfigErrorContext.Provider>
      </RpcContext.Provider>
    </ThemeProvider>
  );
}

const root = createRoot(document.getElementById('root')!, {
  onUncaughtError: (error) => reportIssue('workshop.react-root', error, {
    handled: false, severity: 'fatal', captureMechanism: 'react',
  }),
})

// Kick off dev auto-login in the background. If it completes before
// useAuth checks the token, the user skips the login page. If the backend
// is unreachable, the app still renders immediately (showing a connection
// banner or login page) instead of hanging on a blank screen.
devAutoLogin(rpcConnection.getState().stub).catch(() => {})

root.render(
  <StrictMode>
    <FrontendErrorBoundary>
      <AppWithConnection />
    </FrontendErrorBoundary>
  </StrictMode>
)
