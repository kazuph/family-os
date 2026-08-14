import { createFileRoute } from '@tanstack/react-router'
import BlueprintsPage from '../BlueprintsPage'
import { familyLabel, familyUi } from '../familyUi'
import { useDocumentTitle } from '../useDocumentTitle'

export const Route = createFileRoute('/explore')({
  component: ExplorePage,
})

function ExplorePage() {
  useDocumentTitle(familyLabel('Explore', familyUi.exploreTitle))

  return <BlueprintsPage />
}
