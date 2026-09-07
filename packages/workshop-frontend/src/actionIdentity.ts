import type { ActionLogEntry, ActionReference } from '@gadgets/workshop-shared/api'

export function actionKey(record: Pick<ActionLogEntry, 'sourceWorkspaceId' | 'id'>): string {
  return `${record.sourceWorkspaceId}:${record.id}`
}

/** Compare updates to the same action; unversioned local entries preserve arrival ordering. */
export function isStaleAction(incoming: ActionLogEntry, current?: ActionLogEntry): boolean {
  return current !== undefined && (incoming.sourceVersion ?? 0) < (current.sourceVersion ?? 0)
}

export function actionReference(record: Pick<ActionLogEntry, 'sourceWorkspaceId' | 'id'>): ActionReference {
  return { sourceWorkspaceId: record.sourceWorkspaceId, actionId: record.id }
}

export function actionProcessingKey(reference: number | ActionReference): number | string {
  return typeof reference === 'number' ? reference : `${reference.sourceWorkspaceId}:${reference.actionId}`
}

export function compareActionOrder(a: ActionLogEntry, b: ActionLogEntry): number {
  return a.createdAt.getTime() - b.createdAt.getTime()
    || a.sourceWorkspaceId.localeCompare(b.sourceWorkspaceId)
    || a.id - b.id
}
