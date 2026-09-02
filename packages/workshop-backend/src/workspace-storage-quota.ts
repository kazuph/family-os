/** Workspace storage usage at which writes emit an observability warning. */
export const WORKSPACE_STORAGE_WARNING_BYTES = 512 * 1024 * 1024;

/** Hard SQLite size ceiling for one workspace Durable Object. */
export const WORKSPACE_STORAGE_HARD_BYTES = 1024 * 1024 * 1024;

/** Browser verification screenshots remain available in chat for this long. */
export const BROWSER_VERIFY_SCREENSHOT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type WorkspaceStorageQuota = {warningBytes: number; hardBytes: number};

/** Evaluate a write against the workspace quota before mutating storage. */
export function checkWorkspaceStorageWrite(
  usedBytes: number,
  incomingBytes: number,
  quota: WorkspaceStorageQuota = {
    warningBytes: WORKSPACE_STORAGE_WARNING_BYTES,
    hardBytes: WORKSPACE_STORAGE_HARD_BYTES,
  },
): {usedBytes: number; projectedBytes: number; warning: boolean} {
  let projectedBytes = usedBytes + incomingBytes;
  if (projectedBytes > quota.hardBytes) {
    throw new Error(
      `Workspace storage quota exceeded (${projectedBytes}/${quota.hardBytes} bytes). ` +
      "Delete unused chats or attachments before writing more data.",
    );
  }
  return {usedBytes, projectedBytes, warning: projectedBytes >= quota.warningBytes};
}
