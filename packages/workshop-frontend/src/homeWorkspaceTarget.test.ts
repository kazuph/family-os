import { describe, expect, it } from "vitest";
import { familyLabel, familyUi } from "./familyUi";
import {
  defaultHomeDestinationLabel,
  homeWorkspaceMenuDefaultLabel,
  homeWorkspaceSelectorValueLabel,
  resolveHomeWorkspaceSelection,
} from "./homeWorkspaceTarget";

const gameDev = { id: "ws-game", title: "Game Development" };

describe("home workspace destination", () => {
  it("labels the default destination as Home, distinct from a selected workspace", () => {
    expect(defaultHomeDestinationLabel()).toBe(familyLabel("Home", familyUi.homeDestination));
    expect(homeWorkspaceMenuDefaultLabel()).toBe(
      familyLabel("Home (default)", familyUi.homeDestinationDefault),
    );
    expect(homeWorkspaceSelectorValueLabel(null, [gameDev])).toBe(defaultHomeDestinationLabel());
    expect(homeWorkspaceSelectorValueLabel(gameDev.id, [gameDev])).toBe("Game Development");
    expect(homeWorkspaceSelectorValueLabel(null, [gameDev])).not.toBe(
      homeWorkspaceSelectorValueLabel(gameDev.id, [gameDev]),
    );
  });

  it("keeps an existing workspace selection and falls back to default if it vanishes", () => {
    expect(resolveHomeWorkspaceSelection(gameDev.id, [gameDev])).toBe(gameDev.id);
    expect(resolveHomeWorkspaceSelection(gameDev.id, [])).toBeNull();
    expect(resolveHomeWorkspaceSelection(null, [gameDev])).toBeNull();
  });
});
