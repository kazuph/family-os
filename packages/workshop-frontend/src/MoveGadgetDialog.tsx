import { useEffect, useRef, useState } from 'react'
import { Dialog, useKumoToastManager } from '@cloudflare/kumo'
import { RpcStub } from 'capnweb'
import {
  AuthenticatedApi,
  GadgetClient,
  GadgetMetadataWithTimestamps,
  INTERNAL_WORKSPACE_TITLE,
} from '@gadgets/workshop-shared/api'
import { WorkshopButton } from './components/WorkshopControls'

type MoveGadgetDialogProps = {
  open: boolean
  currentWorkspaceId: string
  gadget: RpcStub<GadgetClient> | null
  gadgetTitle: string
  authenticatedApi: RpcStub<AuthenticatedApi>
  onOpenChange: (open: boolean) => void
  onMoved: (workspaceId: string, gadgetId: number) => void
}

type MoveTarget = Pick<GadgetMetadataWithTimestamps, 'id' | 'title'>

export default function MoveGadgetDialog({
  open,
  currentWorkspaceId,
  gadget,
  gadgetTitle,
  authenticatedApi,
  onOpenChange,
  onMoved,
}: MoveGadgetDialogProps) {
  const toasts = useKumoToastManager()
  const toastsRef = useRef(toasts)
  toastsRef.current = toasts
  const [targets, setTargets] = useState<MoveTarget[]>([])
  const [targetId, setTargetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setTargets([])
    setTargetId('')
    Promise.all([
      authenticatedApi.listGadgets(),
      authenticatedApi.getInternalWorkspaceId(),
    ]).then(([workspaces, internalWorkspaceId]) => {
      if (cancelled) return
      const next: MoveTarget[] = workspaces
        .filter(workspace => workspace.id !== currentWorkspaceId && workspace.owner === undefined)
        .map(({ id, title }) => ({ id, title }))
      if (internalWorkspaceId && internalWorkspaceId !== currentWorkspaceId) {
        next.unshift({ id: internalWorkspaceId, title: INTERNAL_WORKSPACE_TITLE })
      }
      setTargets(next)
    }).catch(error => {
      if (!cancelled) {
        console.error('Failed to load move destinations:', error)
        toastsRef.current.add({ title: 'Failed to load destination workspaces', variant: 'error' })
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [open, currentWorkspaceId, authenticatedApi])

  const handleMove = async () => {
    if (!gadget || !targetId || moving) return
    setMoving(true)
    try {
      const location = await gadget.moveToWorkspace(targetId)
      onOpenChange(false)
      onMoved(location.workspaceId, location.gadgetId)
    } catch (error) {
      console.error('Failed to move gadget:', error)
      toasts.add({
        title: error instanceof Error ? error.message : 'Failed to move gadget',
        variant: 'error',
      })
    } finally {
      setMoving(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        // Keep the in-flight gadget and destination fixed until the move settles. This also
        // prevents an outside click or Escape from closing into a different selected Gadget.
        if (!moving) onOpenChange(nextOpen)
      }}
    >
      <Dialog className="responsive-dialog !w-[min(480px,calc(100vw-32px))] bg-kumo-base p-6">
        <Dialog.Title className="text-[18px] leading-6 font-medium text-kumo-default">
          Move {gadgetTitle}
        </Dialog.Title>
        <Dialog.Description className="mt-1 text-[13px] leading-[18px] text-kumo-subtle">
          保存したデータと接続を保ったまま、選んだワークスペースへ移動します。
        </Dialog.Description>

        <label className="mt-5 block text-[13px] font-medium text-kumo-default" htmlFor="move-target-workspace">
          Destination workspace
        </label>
        {loading ? (
          <p className="mt-2 text-[13px] text-kumo-subtle">Loading workspaces…</p>
        ) : targets.length === 0 ? (
          <p className="mt-2 text-[13px] text-kumo-subtle">
            There is no other workspace available.
          </p>
        ) : (
          <select
            id="move-target-workspace"
            value={targetId}
            onChange={event => setTargetId(event.target.value)}
            disabled={loading || moving}
            className="mt-2 h-10 w-full rounded-lg border border-kumo-line bg-kumo-base px-3 text-[13px] text-kumo-default"
          >
            <option value="" disabled>移動先を選択してください</option>
            {targets.map(target => (
              <option key={target.id} value={target.id}>{target.title}</option>
            ))}
          </select>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Dialog.Close
            render={props => <WorkshopButton {...props} disabled={moving}>Cancel</WorkshopButton>}
          />
          <WorkshopButton
            tone="primary"
            disabled={loading || moving || !targetId}
            onClick={handleMove}
          >
            {moving ? 'Moving…' : 'Move Gadget'}
          </WorkshopButton>
        </div>
      </Dialog>
    </Dialog.Root>
  )
}
