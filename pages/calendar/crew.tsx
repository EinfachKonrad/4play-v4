import PageTitle from '@/components/utility/PageTitle'
import { ProtectedPage } from '@/components/utility/ProtectedPage'
import { UsersRound } from 'lucide-react'
import React from 'react'

function CrewCalendarPage() {
  return (
    <ProtectedPage permission="accessCrewCalendar" pageTitle="Dispo-Ansicht">
      <PageTitle title="Dispo-Ansicht" icon={UsersRound} />
    </ProtectedPage>
  )
}

export default CrewCalendarPage