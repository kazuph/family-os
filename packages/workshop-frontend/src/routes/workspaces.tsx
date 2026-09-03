import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from '@phosphor-icons/react'
import { useKumoToastManager } from '@cloudflare/kumo'
import GadgetList from '../components/GadgetList'
import { useDocumentTitle } from '../useDocumentTitle'
import { familyLabel, familyUi } from '../familyUi'
import { useAuthenticatedApi } from '../AuthContext'
import { logRpcFailure } from '../rpcErrors'

/**
 * Full workspace listing. The sidebar surfaces Favorites + a handful of Recent workspaces; this is
 * the "see them all" destination linked from the rail.
 */
export const Route = createFileRoute('/workspaces')({
  component: WorkspacesPage,
})

function WorkspacesPage() {
  useDocumentTitle(familyLabel('Workspaces', familyUi.workspaces))
  const { authenticatedApi } = useAuthenticatedApi()
  const navigate = useNavigate()
  const toasts = useKumoToastManager()
  const [creating, setCreating] = useState(false)

  const handleCreateWorkspace = async () => {
    if (creating) return
    setCreating(true)
    try {
      const workspace = await authenticatedApi.newGadget()
      try {
        const { id } = await workspace.getMetadata()
        navigate({ to: '/workspace/$id', params: { id } })
      } finally {
        workspace[Symbol.dispose]()
      }
    } catch (err) {
      logRpcFailure('Failed to create workspace:', err, { reportSite: 'workspace.create' })
      toasts.add({
        title: familyLabel('Could not create workspace', familyUi.failedCreateWorkspace),
        variant: 'error',
      })
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-3 sm:px-10">
      <header className="flex flex-col items-stretch gap-4 px-3 pb-3 pt-6 sm:flex-row sm:items-end sm:justify-between sm:pt-10">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-kumo-default">
            {familyLabel('Workspaces', familyUi.workspaces)}
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] tracking-[-0.25px] text-kumo-subtle">
            {familyLabel(
              'Each workspace is an isolated environment with its own conversations, gatekeepers, and outputs.',
              familyUi.workspacesDesc,
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateWorkspace}
          disabled={creating}
          aria-busy={creating}
          className="press inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-kumo-brand px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-kumo-brand-hover sm:h-9 sm:text-[13px]"
        >
          <Plus size={14} weight="bold" />
          {familyLabel('Create workspace', familyUi.createWorkspace)}
        </button>
      </header>
      <div className="min-h-0 flex-1">
        <GadgetList showHeader={false} />
      </div>
    </div>
  )
}
