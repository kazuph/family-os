import { Link } from '@tanstack/react-router'
import { Clock, MagnifyingGlass, Hexagon, DotsThreeVertical, ShareNetwork, Trash, Info, Star, Pencil, ArrowRight } from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
import { DropdownMenu, Dialog, Button, useKumoToastManager } from '@cloudflare/kumo'
import { RpcStub } from 'capnweb'
import { useAuthenticatedApi } from '../AuthContext'
import { GadgetMetadataWithTimestamps, BlueprintPublicInfo, Overseer, AiChatAuthorInfo } from '@gadgets/workshop-shared/api'
import ShareModal from '../ShareModal'
import { BindingBadge, getGradient as getBlueprintGradient, uniqueBindingBadges } from './BlueprintCard'
import { MENU_CONTENT, MENU_ITEM, MENU_ITEM_DANGER } from './menuStyles'
import { BlueprintPreviewImage } from './BlueprintPreviewImage'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import { familyLabel, familyRelativeTime, familyUi, isFamilyMode, workspaceTitle } from '../familyUi'

// Neutral monogram for a workspace — matches the sidebar treatment (no per-item color noise).
function initials(title: string | undefined): string {
  const t = workspaceTitle(title).trim()
  if (!t) return isFamilyMode ? '無' : 'UG'
  // Prefer Latin initials when present; otherwise first 1–2 characters (works for Japanese titles).
  const latin = t.match(/[A-Za-z0-9]+/g)?.slice(0, 2) ?? []
  if (latin.length > 0) {
    return latin.map((p) => p[0]?.toUpperCase() ?? '').join('')
  }
  return t.slice(0, 2)
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}

function AppRow({
  gadget,
  onDelete,
  onShare,
  onInfo,
  onTogglePin,
  onRename,
  canShare,
}: {
  gadget: GadgetMetadataWithTimestamps
  onDelete: (gadget: GadgetMetadataWithTimestamps) => void
  onShare: (gadget: GadgetMetadataWithTimestamps) => void
  onInfo: (gadget: GadgetMetadataWithTimestamps) => void
  onTogglePin: (gadget: GadgetMetadataWithTimestamps) => void
  onRename: (gadget: GadgetMetadataWithTimestamps, newTitle: string) => void
  canShare: boolean
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(gadget.title || '')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.focus()
  }, [isRenaming])

  const commitRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== gadget.title) {
      onRename(gadget, trimmed)
    }
    setIsRenaming(false)
  }

  const startRenaming = () => {
    setRenameValue(gadget.title || '')
    setIsRenaming(true)
  }

  return (
    <Link
      to="/workspace/$id"
      params={{ id: gadget.id }}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-kumo-tint"
      onClick={(e) => {
        // Prevent navigation when renaming or clicking the menu
        if (isRenaming) e.preventDefault()
      }}
    >
      {/* Neutral monogram */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-kumo-fill text-[12px] font-medium text-kumo-subtle">
        {initials(gadget.title)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {gadget.pinned && <Star size={12} weight="fill" className="text-kumo-brand flex-shrink-0" />}
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setIsRenaming(false)
              }}
              className="text-sm font-medium text-kumo-default bg-transparent border-b border-kumo-brand outline-none w-full min-w-0"
              onClick={(e) => e.preventDefault()}
            />
          ) : (
            <h3 className="text-sm font-medium text-kumo-default truncate">
              {workspaceTitle(gadget.title)}
            </h3>
          )}
        </div>
        {gadget.owner && (
          <p className="text-xs text-kumo-subtle truncate mt-0.5">
            {familyLabel(`Shared by ${gadget.owner.name}`, familyUi.sharedBy(gadget.owner.name))}
          </p>
        )}
      </div>

      {/* Time */}
      <span className="hidden lg:flex items-center gap-1 text-xs text-kumo-inactive flex-shrink-0">
        <Clock size={10} />
        {familyRelativeTime(gadget.lastActive)}
      </span>

      {/* Overflow menu — wrapper stops clicks from reaching the parent Link */}
      <div onClick={(e) => { e.stopPropagation(); e.preventDefault() }}>
      <DropdownMenu>
        <DropdownMenu.Trigger
          render={
            <button
              type="button"
              aria-label={familyLabel('Workspace actions', familyUi.workspaceActions)}
              className="p-1.5 text-kumo-subtle hover:text-kumo-default rounded-md hover:bg-kumo-fill transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <DotsThreeVertical size={16} />
            </button>
          }
        />
        <DropdownMenu.Content className={MENU_CONTENT}>
          <DropdownMenu.Item onClick={startRenaming} className={MENU_ITEM}>
            <Pencil size={13} className="mr-2" />
            {familyLabel('Rename', familyUi.rename)}
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => onTogglePin(gadget)} className={MENU_ITEM}>
            <Star size={13} className="mr-2" weight={gadget.pinned ? 'fill' : 'regular'} />
            {gadget.pinned
              ? familyLabel('Unfavorite', familyUi.unfavorite)
              : familyLabel('Favorite', familyUi.favorite)}
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => onInfo(gadget)} className={MENU_ITEM}>
            <Info size={13} className="mr-2" />
            {familyLabel('Information', '情報')}
          </DropdownMenu.Item>
          {canShare && (
            <DropdownMenu.Item onClick={() => onShare(gadget)} className={MENU_ITEM}>
              <ShareNetwork size={13} className="mr-2" />
              {familyLabel('Share', familyUi.share)}
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            variant="danger"
            onClick={() => onDelete(gadget)}
            className={MENU_ITEM_DANGER}
          >
            <Trash size={13} className="mr-2" />
            {gadget.owner
              ? familyLabel('Dismiss', familyUi.dismiss)
              : familyLabel('Delete', familyUi.delete)}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
      </div>
    </Link>
  )
}

export default function GadgetList({ showHeader = true }: { showHeader?: boolean } = {}) {
  const { authenticatedApi, isFamilyChild } = useAuthenticatedApi()
  const toasts = useKumoToastManager()
  const [gadgets, setGadgets] = useState<GadgetMetadataWithTimestamps[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<GadgetMetadataWithTimestamps | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Info modal state
  const [infoTarget, setInfoTarget] = useState<GadgetMetadataWithTimestamps | null>(null)

  // Share modal state
  const [shareTarget, setShareTarget] = useState<GadgetMetadataWithTimestamps | null>(null)
  const [shareOverseer, setShareOverseer] = useState<{ stub: RpcStub<Overseer> } | null>(null)
  const [userInfo, setUserInfo] = useState<AiChatAuthorInfo | null>(null)

  useEffect(() => {
    authenticatedApi.whoami().then(setUserInfo).catch(() => {})
  }, [authenticatedApi])

  const loadGadgets = () => {
    setLoading(true)
    setLoadError(false)
    let cancelled = false
    authenticatedApi.listGadgets().then((list) => {
      if (cancelled) return
      const sorted = [...list].toSorted((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b.lastActive.getTime() - a.lastActive.getTime()
      })
      setGadgets(sorted)
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to load gadgets:', err)
      if (!cancelled) { setLoading(false); setLoadError(true) }
    })
    return () => { cancelled = true }
  }

  useEffect(() => loadGadgets(), [authenticatedApi])

  // Clean up share overseer when modal closes
  useEffect(() => {
    if (!shareTarget && shareOverseer) {
      shareOverseer.stub[Symbol.dispose]()
      setShareOverseer(null)
    }
  }, [shareTarget, shareOverseer])

  // Dispose share overseer on unmount if still open
  const shareOverseerRef = useRef(shareOverseer)
  shareOverseerRef.current = shareOverseer
  useEffect(() => {
    return () => { shareOverseerRef.current?.stub[Symbol.dispose]() }
  }, [])

  const handleDelete = (gadget: GadgetMetadataWithTimestamps) => {
    setDeleteTarget(gadget)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.owner) {
        await authenticatedApi.dismissSharedGadget(deleteTarget.id)
        toasts.add({
          title: familyLabel('Workspace removed from list', familyUi.workspaceRemovedFromList),
          variant: 'success',
        })
      } else {
        const overseer = await authenticatedApi.openGadget(deleteTarget.id)
        try {
          await overseer.deleteSelf()
        } finally {
          overseer[Symbol.dispose]()
        }
        toasts.add({
          title: familyLabel('Workspace deleted', familyUi.workspaceDeleted),
          variant: 'success',
        })
      }
      setGadgets(prev => prev.filter(g => g.id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete workspace:', err)
      toasts.add({
        title: familyLabel('Failed to delete workspace', familyUi.failedDeleteWorkspace),
        variant: 'error',
      })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleShare = async (gadget: GadgetMetadataWithTimestamps) => {
    let overseer: RpcStub<Overseer> | null = null
    try {
      overseer = authenticatedApi.openGadget(gadget.id)
      const metadata = await overseer.getMetadata()
      setShareOverseer({ stub: overseer })
      setShareTarget({ ...gadget, ...metadata })
      overseer = null
    } catch (err) {
      overseer?.[Symbol.dispose]()
      console.error('Failed to open workspace for sharing:', err)
      toasts.add({
        title: familyLabel('Failed to open share settings', familyUi.failedOpenShare),
        variant: 'error',
      })
    }
  }

  const handleTogglePin = async (gadget: GadgetMetadataWithTimestamps) => {
    const newPinned = !gadget.pinned
    // Optimistically update the list
    setGadgets(prev => {
      const updated = prev.map(g => g.id === gadget.id ? { ...g, pinned: newPinned } : g)
      return updated.toSorted((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b.lastActive.getTime() - a.lastActive.getTime()
      })
    })
    // Use promise pipelining — call setPinned without awaiting openGadget first
    const overseer = authenticatedApi.openGadget(gadget.id)
    try {
      await overseer.setPinned(newPinned)
    } catch (err) {
      console.error('Failed to pin workspace:', err)
      setGadgets(prev => {
        const reverted = prev.map(g => g.id === gadget.id ? { ...g, pinned: gadget.pinned } : g)
        return reverted.toSorted((a, b) => {
          if (a.pinned && !b.pinned) return -1
          if (!a.pinned && b.pinned) return 1
          return b.lastActive.getTime() - a.lastActive.getTime()
        })
      })
      toasts.add({
        title: familyLabel('Failed to update favorite status', familyUi.failedUpdateFavorite),
        variant: 'error',
      })
    } finally {
      (await overseer)[Symbol.dispose]()
    }
  }

  const handleRename = async (gadget: GadgetMetadataWithTimestamps, newTitle: string) => {
    // Optimistically update
    setGadgets(prev => prev.map(g => g.id === gadget.id ? { ...g, title: newTitle } : g))
    // Use promise pipelining — call setTitle without awaiting openGadget first
    const overseer = authenticatedApi.openGadget(gadget.id)
    try {
      await overseer.setTitle(newTitle)
    } catch (err) {
      console.error('Failed to rename workspace:', err)
      setGadgets(prev => prev.map(g => g.id === gadget.id ? { ...g, title: gadget.title } : g))
      toasts.add({
        title: familyLabel('Failed to rename workspace', familyUi.failedRenameWorkspace),
        variant: 'error',
      })
    } finally {
      (await overseer)[Symbol.dispose]()
    }
  }

  const handleShareClose = () => {
    setShareTarget(null)
  }

  const filtered = gadgets.filter((g) => {
    if (!search) return true
    return (g.title || '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {showHeader && (
        <div className="px-6 sm:px-10 lg:px-10 pt-10 lg:pt-10 mb-4">
          <h2 className="text-lg font-semibold text-kumo-default">
            {familyLabel('Your workspaces', familyUi.yourWorkspaces)}
          </h2>
          {!loading && gadgets.length === 0 && !loadError && (
            <p className="mt-1 text-sm text-kumo-inactive">
              {familyLabel(
                "You haven't created any workspaces yet",
                familyUi.noWorkspacesCreated,
              )}
            </p>
          )}
        </div>
      )}

      {/* Search — hidden when the user has no gadgets */}
      {!loading && gadgets.length > 0 && (
        <div className="mb-4 px-3">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-inactive"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={familyLabel('Search workspaces…', familyUi.searchWorkspaces)}
              className="h-9 w-full rounded-lg border border-kumo-line bg-kumo-base pl-9 pr-4 text-[13px] tracking-[-0.25px] text-kumo-default placeholder:text-kumo-inactive transition-[border-color,box-shadow] duration-150 ease-out focus:border-kumo-ring focus:outline-none focus:ring-[3px] focus:ring-kumo-ring/15"
            />
          </div>
        </div>
      )}

      {/* List. The page gutter lives on the route wrapper; header, search, and rows all share a
          uniform px-3 so their content lines up exactly. The scroll container itself carries no
          horizontal padding, so the scrollbar sits just past the aligned content (not far out). */}
      <div className="chat-panel flex flex-1 min-h-0 flex-col gap-0.5 overflow-y-auto pt-1">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[56px] rounded-xl bg-kumo-elevated animate-pulse" />
            ))}
          </>
        ) : loadError ? (
          <div className="text-center py-12 text-sm">
            <p className="text-kumo-danger">
              {familyLabel(
                'Something went wrong loading your workspaces.',
                familyUi.somethingWrongWorkspaces,
              )}
            </p>
            <button onClick={loadGadgets} className="text-kumo-brand mt-1 underline">
              {familyLabel('Try again', familyUi.tryAgain)}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          search ? (
            <div className="text-center py-12 text-kumo-inactive text-sm">
              {familyLabel('No workspaces found', familyUi.noWorkspacesFound)}
            </div>
          ) : isFamilyMode ? (
            <div className="px-3 py-12 text-center text-sm text-kumo-inactive">
              {familyLabel(
                "You haven't created any workspaces yet",
                familyUi.noWorkspacesCreated,
              )}
            </div>
          ) : (
            <FeaturedBlueprintsGallery />
          )
        ) : (
          filtered.map((gadget) => (
            <AppRow
              key={gadget.id}
              gadget={gadget}
              onDelete={handleDelete}
              onShare={handleShare}
              onInfo={setInfoTarget}
              onTogglePin={handleTogglePin}
              onRename={handleRename}
              canShare={!isFamilyChild}
            />
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        isDeleting={isDeleting}
        title={deleteTarget?.owner
          ? familyLabel('Remove workspace', familyUi.removeWorkspace)
          : familyLabel('Delete workspace', familyUi.deleteWorkspace)}
        description={
          deleteTarget?.owner
            ? familyLabel(
                `Remove "${deleteTarget?.title || 'Untitled Workspace'}" from your list? You can still access it via its link.`,
                familyUi.removeWorkspaceBody(
                  deleteTarget?.title || familyUi.untitledWorkspace,
                ),
              )
            : familyLabel(
                `Delete "${deleteTarget?.title || 'Untitled Workspace'}"? This cannot be undone.`,
                familyUi.deleteWorkspaceBody(
                  deleteTarget?.title || familyUi.untitledWorkspace,
                ),
              )
        }
        confirmLabel={
          deleteTarget?.owner
            ? familyLabel('Remove', familyUi.remove)
            : familyLabel('Delete', familyUi.delete)
        }
        confirmingLabel={
          deleteTarget?.owner
            ? familyLabel('Removing...', '外しています…')
            : familyLabel('Deleting...', '削除しています…')
        }
        onConfirm={handleDeleteConfirm}
      />

      {/* Information modal */}
      <Dialog.Root
        open={infoTarget !== null}
        onOpenChange={(open) => { if (!open) setInfoTarget(null) }}
      >
        <Dialog className="p-8" size="sm">
          <Dialog.Title className="text-lg font-semibold">
            {infoTarget?.title || familyLabel('Untitled Workspace', familyUi.untitledWorkspace)}
          </Dialog.Title>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-kumo-subtle">{familyLabel('Author', '作成者')}</span>
              <span className="text-kumo-default">
                {infoTarget?.owner
                  ? infoTarget.owner.name
                  : familyLabel('You', '自分')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">{familyLabel('Total cost', '合計コスト')}</span>
              <span className="text-kumo-default">
                {formatCost(infoTarget?.totalCost ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">{familyLabel('Created', '作成日時')}</span>
              <span className="text-kumo-default">
                {infoTarget?.created?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-kumo-subtle">{familyLabel('Last active', '最終利用')}</span>
              <span className="text-kumo-default">
                {infoTarget?.lastActive?.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close
              render={(props) => (
                <Button variant="secondary" {...props}>
                  {familyLabel('Close', '閉じる')}
                </Button>
              )}
            />
          </div>
        </Dialog>
      </Dialog.Root>

      {/* Share modal */}
      {shareOverseer && shareTarget && (
        <ShareModal
          open={true}
          onClose={handleShareClose}
          overseer={shareOverseer.stub}
          metadata={shareTarget}
          currentUser={userInfo}
          authenticatedApi={authenticatedApi}
        />
      )}
    </div>
  )
}

// ─── featured blueprints gallery (shown when gadget list is empty) ────────────

const MAX_FEATURED_SHOWN = 6

function HomeFeaturedBlueprintCard({
  blueprint,
}: {
  blueprint: BlueprintPublicInfo
}) {
  const badges = uniqueBindingBadges(blueprint.metadata.bindings).slice(0, 1)

  return (
    <div className="themed-card-hover-shadow group relative isolate flex min-h-[190px] flex-col overflow-hidden rounded-2xl border border-kumo-line bg-kumo-base text-left transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-kumo-fill active:scale-[0.995]">
      <Link
        to="/blueprint/$id"
        params={{ id: blueprint.id }}
        aria-label={familyLabel(
          `Open blueprint ${blueprint.metadata.title}`,
          familyUi.openBlueprint(blueprint.metadata.title),
        )}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kumo-brand"
      />
      <div className="pointer-events-none relative z-20 flex flex-1 flex-col p-2.5">
        <BlueprintPreviewImage
          blueprintId={blueprint.id}
          title={blueprint.metadata.title}
          screenshotUrl={blueprint.screenshotUrl}
          className="mb-3"
        />
        <div className="flex min-w-0 items-start gap-2 px-1 pb-1">
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${getBlueprintGradient(blueprint.id)}`}>
            <Hexagon size={13} className="text-white/75" weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[13px] leading-[18px] font-semibold tracking-[-0.25px] text-kumo-default">
              {blueprint.metadata.title}
            </p>
            <p className={`mt-0.5 line-clamp-2 min-h-8 text-[12px] leading-4 tracking-[-0.2px] ${blueprint.metadata.description ? 'text-kumo-subtle' : 'text-kumo-inactive italic'}`}>
              {blueprint.metadata.description || familyLabel('No description', familyUi.noDescription)}
            </p>
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {badges.map((badge) => (
                  <BindingBadge key={badge.vendorKey ?? badge.type} badge={badge} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedBlueprintsGallery() {
  const { authenticatedApi } = useAuthenticatedApi()
  const [blueprints, setBlueprints] = useState<BlueprintPublicInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    authenticatedApi
      .listFeaturedBlueprints()
      .then((list) => {
        if (!cancelled) setBlueprints(list)
      })
      .catch((err) => {
        console.error('Failed to load featured blueprints:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [authenticatedApi])

  if (loading) {
    return (
      <div className="px-2 py-8">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[108px] rounded-xl bg-kumo-base animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (blueprints.length === 0) {
    return null
  }

  const shown = blueprints.slice(0, MAX_FEATURED_SHOWN)
  const hasMore = blueprints.length > MAX_FEATURED_SHOWN

  return (
    <div className="py-4 pr-4 sm:pr-6">
      <div className="mb-5">
        <h3 className="text-[13px] leading-[18px] font-medium tracking-[-0.25px] text-kumo-default">
          {familyLabel('Start from a featured blueprint.', familyUi.startFromFeatured)}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shown.map((bp) => (
          <HomeFeaturedBlueprintCard
            key={bp.id}
            blueprint={bp}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-kumo-brand hover:text-kumo-brand-hover transition-colors"
          >
            {familyLabel('Browse all blueprints', familyUi.browseAllBlueprints)}
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      )}
    </div>
  )
}
