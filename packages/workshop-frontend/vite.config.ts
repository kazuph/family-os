import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const backendHost = env.VITE_BACKEND_PROXY_HOST?.trim() || env.VITE_BACKEND_HOST?.trim() || 'localhost:8787'
  const frontendErrorReporting = env.VITE_FRONTEND_ERROR_REPORTING === 'true'
  return {
    plugins: [
      TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: `http://${backendHost}`,
          changeOrigin: true,
          ws: true,
          configure: (proxy) => {
            proxy.on('proxyReqWs', (proxyReq, req) => {
              let jwt = process.env.FAMILY_DEV_ACCESS_JWT;
              if (jwt) proxyReq.setHeader('cf-access-jwt-assertion', jwt);
              let cookie = req.headers.cookie;
              if (cookie) proxyReq.setHeader('cookie', cookie);
              // Access mode rejects cross-origin WS when the page is on Vite but the Worker sees
              // localhost:8787; align Origin with the proxied backend host.
              proxyReq.setHeader('origin', `http://${backendHost}`);
            });
            proxy.on('proxyReq', (proxyReq) => {
              let jwt = process.env.FAMILY_DEV_ACCESS_JWT;
              if (jwt) proxyReq.setHeader('cf-access-jwt-assertion', jwt);
              proxyReq.setHeader('origin', `http://${backendHost}`);
            });
          },
        },
        '/api/client-errors': `http://${backendHost}`,
        '/blueprint-screenshot': `http://${backendHost}`,
        '/api/site-logo': `http://${backendHost}`,
      },
    },
    build: {
      // Production reporting uploads these separately; hidden maps never reveal a map URL to users.
      sourcemap: frontendErrorReporting ? 'hidden' : false,
    },
  }
})
