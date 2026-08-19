import { familyLabel, familyUi, workspaceTitle } from "./familyUi";

export type ListedHomeWorkspace = {
  id: string;
  title: string;
};

/** Null means the per-profile internal home workspace. */
export type HomeWorkspaceDestinationId = string | null;

export function defaultHomeDestinationLabel(): string {
  return familyLabel("Home", familyUi.homeDestination);
}

export function homeWorkspaceMenuDefaultLabel(): string {
  return familyLabel("Home (default)", familyUi.homeDestinationDefault);
}

export function homeWorkspaceSelectorValueLabel(
  selectedId: HomeWorkspaceDestinationId,
  workspaces: ListedHomeWorkspace[],
): string {
  if (selectedId === null) return defaultHomeDestinationLabel();
  const match = workspaces.find((workspace) => workspace.id === selectedId);
  return match ? workspaceTitle(match.title) : defaultHomeDestinationLabel();
}

/** Drop a stale selected id if that workspace disappeared from the ordinary listing. */
export function resolveHomeWorkspaceSelection(
  selectedId: HomeWorkspaceDestinationId,
  workspaces: ListedHomeWorkspace[],
): HomeWorkspaceDestinationId {
  if (selectedId === null) return null;
  return workspaces.some((workspace) => workspace.id === selectedId) ? selectedId : null;
}
