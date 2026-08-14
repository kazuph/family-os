import { FAMILY_MONSTER_AVATAR_IDS, type FamilyMonsterAvatarId } from '@gadgets/workshop-shared/api'
import { familyUi } from '../familyUi'

type FamilyMonsterPickerProps = {
  selectedId?: FamilyMonsterAvatarId | null
  onSelect: (id: FamilyMonsterAvatarId) => void
  columns?: number
  className?: string
  'aria-label'?: string
}

/** Shared 32-monster avatar grid (8 shapes × 4 color phases) for Family OS profile surfaces. */
export default function FamilyMonsterPicker({
  selectedId,
  onSelect,
  columns = 8,
  className = '',
  'aria-label': ariaLabel = familyUi.chooseMonster,
}: FamilyMonsterPickerProps) {
  return (
    <div
      className={`grid gap-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-label={ariaLabel}
    >
      {FAMILY_MONSTER_AVATAR_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`h-8 w-8 rounded ${selectedId === id ? 'ring-2 ring-kumo-brand' : ''}`}
          aria-label={familyUi.useMonster(id)}
          onClick={() => onSelect(id)}
        >
          <img src={`/family-avatars/${id}.png`} alt="" className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  )
}
