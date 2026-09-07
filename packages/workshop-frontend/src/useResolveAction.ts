import { actionProcessingKey } from './actionIdentity'
import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import { useKumoToastManager } from '@cloudflare/kumo'
import type { RpcStub } from 'capnweb'
import type { ActionState, ActionReference, Overseer } from '@gadgets/workshop-shared/api'

type ActionDecision = 'approve' | 'deny'

export function useResolveAction(
  overseer: RpcStub<Overseer>,
  setProcessing: Dispatch<SetStateAction<Set<number | string>>>,
  onResolved?: (actionId: number | ActionReference, state: Extract<ActionState, 'approved' | 'rejected'>) => void,
) {
  const toasts = useKumoToastManager()
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  return useCallback(async (actionId: number | ActionReference, decision: ActionDecision) => {
    setProcessing(previous => new Set(previous).add(actionProcessingKey(actionId)))
    try {
      if (decision === 'approve') await overseer.approveAction(actionId)
      else await overseer.rejectAction(actionId)
      onResolvedRef.current?.(actionId, decision === 'approve' ? 'approved' : 'rejected')
    } catch (error) {
      console.error(`Failed to ${decision} action:`, error)
      toasts.add({ title: `Failed to ${decision} action`, variant: 'error' })
    } finally {
      setProcessing(previous => {
        const next = new Set(previous)
        next.delete(actionProcessingKey(actionId))
        return next
      })
    }
  }, [overseer, setProcessing, toasts])
}
