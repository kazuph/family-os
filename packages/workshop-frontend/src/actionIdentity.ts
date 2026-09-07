import type { ActionLogEntry, ActionReference } from '@gadgets/workshop-shared/api'

export function actionKey(record: Pick<ActionLogEntry, 'sourceWorkspaceId' | 'id'>): string {
  return `${record.sourceWorkspaceId}:${record.id}`
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
