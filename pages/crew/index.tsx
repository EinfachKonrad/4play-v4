import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { UsersRound } from 'lucide-react'
import React from 'react'

function CrewPage() {
  return (
    <ProtectedPage permission="accessCrew" pageTitle='Crew'>
      <PageTitle title="Crew" icon={UsersRound} />
    </ProtectedPage>
  )
}

export default CrewPage