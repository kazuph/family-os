import { Link } from '@tanstack/react-router'
import { Clock, ArrowRight } from '@phosphor-icons/react'
import { useAuthenticatedApi } from '../AuthContext'
import { useState, useEffect } from 'react'
import { GadgetMetadataWithTimestamps } from '@gadgets/workshop-shared/api'
import { familyLabel, familyRelativeTime, familyUi, isFamilyMode, workspaceTitle } from '../familyUi'

// A simple deterministic gradient based on the gadget ID
function getGradient(id: string): string {
  const gradients = [
    'from-[#4A154B] to-[#7C3085]',
    'from-[#0052CC] to-[#2684FF]',
    'from-[#5865F2] to-[#7983F5]',
    'from-[#34A853] to-[#4285F4]',
    'from-[#24292e] to-[#555]',
    'from-[#E01E5A] to-[#ECB22E]',
    'from-orange-600 to-red-600',
    'from-emerald-600 to-teal-600',
  ]
  const idx = id.charCodeAt(0) % gradients.length
  return gradients[idx]
}

function AppRow({ gadget }: { gadget: GadgetMetadataWithTimestamps }) {
  const gradient = getGradient(gadget.id)

  return (
    <Link
      to="/workspace/$id"
      params={{ id: gadget.id }}
      className="group flex items-center gap-4 p-3 rounded-xl border border-kumo-line bg-kumo-base hover:border-kumo-fill transition-all cursor-pointer"
    >
      {/* Gradient swatch */}
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0`}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-kumo-default truncate">
          {workspaceTitle(gadget.title)}
        </h3>
        {gadget.owner && (
          <p className="text-xs text-kumo-subtle truncate mt-0.5">
            {familyLabel(`Shared by ${gadget.owner.name}`, familyUi.sharedBy(gadget.owner.name))}
          </p>
        )}
      </div>

      {/* Status + time */}
      <div className="flex items-center gap-3 flex-shrink-0">

        <span className="hidden md:flex items-center gap-1 text-xs text-kumo-inactive">
          <Clock size={10} />
          {familyRelativeTime(gadget.lastActive)}
        </span>
      </div>
    </Link>
  )
}

export default function RecentApps() {
  const { authenticatedApi } = useAuthenticatedApi()
  const [gadgets, setGadgets] = useState<GadgetMetadataWithTimestamps[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    authenticatedApi.listGadgets().then((list) => {
      if (cancelled) return
      const sorted = [...list].toSorted((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
      setGadgets(sorted.slice(0, 4))
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to load recent gadgets:', err)
      if (!cancelled) { setLoading(false); setLoadError(true) }
    })
    return () => { cancelled = true }
  }, [authenticatedApi])

  if (loading) {
    return (
      <section className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-kumo-default">
            {familyLabel('Recent workspaces', familyUi.recentWorkspaces)}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-[64px] rounded-xl border border-kumo-line bg-kumo-elevated animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="w-full max-w-2xl mx-auto">
        <div className="text-center py-8 text-sm text-kumo-danger">
          {familyLabel(
            'Unable to load your workspaces. Check your connection and try refreshing.',
            familyUi.unableToLoadWorkspaces,
          )}
        </div>
      </section>
    )
  }

  if (gadgets.length === 0) {
    return (
      <section className="w-full max-w-2xl mx-auto">
        <div className="text-center py-8 text-kumo-inactive text-sm">
          {isFamilyMode
            ? familyUi.noWorkspacesYetCreate
            : 'No workspaces yet. Create your first one above!'}
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-kumo-default">
          {isFamilyMode ? familyUi.recentWorkspaces : 'Recent workspaces'}
        </h2>
        <Link
          to="/"
          className="flex items-center gap-1 text-xs text-kumo-subtle hover:text-kumo-brand transition-colors"
        >
          {familyLabel('View all', familyUi.viewAll)}
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {gadgets.map((gadget) => (
          <AppRow key={gadget.id} gadget={gadget} />
        ))}
      </div>
    </section>
  )
}
