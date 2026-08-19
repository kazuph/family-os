import { useEffect, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { DropdownMenu } from "@cloudflare/kumo";
import type { GadgetMetadataWithTimestamps } from "@gadgets/workshop-shared/api";
import { useAuthenticatedApi } from "../AuthContext";
import { familyLabel, familyUi, workspaceTitle } from "../familyUi";
import {
  homeWorkspaceMenuDefaultLabel,
  homeWorkspaceSelectorValueLabel,
  resolveHomeWorkspaceSelection,
  type HomeWorkspaceDestinationId,
} from "../homeWorkspaceTarget";
import { logRpcFailure } from "../rpcErrors";

export default function HomeWorkspaceSelector({
  selectedId,
  onChange,
}: {
  selectedId: HomeWorkspaceDestinationId;
  onChange: (id: HomeWorkspaceDestinationId) => void;
}) {
  const { authenticatedApi } = useAuthenticatedApi();
  const [workspaces, setWorkspaces] = useState<GadgetMetadataWithTimestamps[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authenticatedApi.listGadgets()
      .then((list) => {
        if (cancelled) return;
        const sorted = [...list].toSorted(
          (a, b) => b.lastActive.getTime() - a.lastActive.getTime(),
        );
        setWorkspaces(sorted);
        setLoaded(true);
      })
      .catch((err) => {
        logRpcFailure("Failed to load workspaces for home selector:", err);
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticatedApi]);

  const resolved = loaded ? resolveHomeWorkspaceSelection(selectedId, workspaces) : selectedId;
  useEffect(() => {
    if (resolved !== selectedId) onChange(resolved);
  }, [onChange, resolved, selectedId]);

  const valueLabel = homeWorkspaceSelectorValueLabel(resolved, workspaces);
  const isDefault = resolved === null;

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <button
            type="button"
            className={`group inline-flex h-8 min-w-0 max-w-[180px] flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[13px] leading-5 tracking-[-0.25px] transition-[background-color,color,transform] duration-150 ease-out hover:bg-kumo-tint focus-visible:bg-kumo-tint focus-visible:outline-none active:scale-[0.97] data-[popup-open]:bg-kumo-tint ${
              isDefault
                ? "text-kumo-inactive hover:text-kumo-subtle focus-visible:text-kumo-subtle data-[popup-open]:text-kumo-subtle"
                : "text-kumo-default hover:text-kumo-default focus-visible:text-kumo-default data-[popup-open]:text-kumo-default"
            }`}
            aria-label={familyLabel("Choose workspace", familyUi.chooseWorkspace)}
          >
            <span className="min-w-0 truncate">{valueLabel}</span>
            <CaretDown
              size={12}
              weight="bold"
              className="flex-shrink-0 text-kumo-inactive transition-transform duration-150 ease-out group-data-[popup-open]:rotate-180"
            />
          </button>
        }
      />
      <DropdownMenu.Content className="themed-floating-shadow-lg !z-[1100] !min-w-[190px] rounded-2xl border border-kumo-line bg-kumo-base p-1">
        <DropdownMenu.Item
          onClick={() => onChange(null)}
          className="!h-auto rounded-xl !px-2 !py-1.5 text-[12px] leading-4 font-normal tracking-[-0.15px] text-kumo-subtle transition-colors data-highlighted:bg-kumo-tint/70 data-highlighted:text-kumo-default"
        >
          <span className="min-w-0 flex-1 truncate">{homeWorkspaceMenuDefaultLabel()}</span>
          {isDefault && (
            <Check size={12} weight="bold" className="ml-3 flex-shrink-0 text-kumo-inactive" />
          )}
        </DropdownMenu.Item>
        {workspaces.map((workspace) => {
          const active = resolved === workspace.id;
          return (
            <DropdownMenu.Item
              key={workspace.id}
              onClick={() => onChange(workspace.id)}
              className="!h-auto rounded-xl !px-2 !py-1.5 text-[12px] leading-4 font-normal tracking-[-0.15px] text-kumo-subtle transition-colors data-highlighted:bg-kumo-tint/70 data-highlighted:text-kumo-default"
            >
              <span className="min-w-0 flex-1 truncate">{workspaceTitle(workspace.title)}</span>
              {active && (
                <Check size={12} weight="bold" className="ml-3 flex-shrink-0 text-kumo-inactive" />
              )}
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
