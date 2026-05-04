import PageTitle from '@/components/PageTitle'
import { Calendar } from 'lucide-react'
import CalendarComponent from '@/components/ui/Calendar'
import React from 'react'

function CalendarPage() {
  return (
    <div>
      <PageTitle title="Kalender" icon={Calendar} />
      <CalendarComponent />
    </div>
  )
}

export default CalendarPage