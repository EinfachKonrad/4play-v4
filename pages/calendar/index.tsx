import PageTitle from '@/components/ui/PageTitle'
import { Calendar, CalendarRange, Table } from 'lucide-react'
import CalendarComponent from '@/components/ui/Calendar'
import React from 'react'
import Navbar from '@/components/ui/Navbar'
import useInstanceConfig from '@/hooks/useInstanceConfig'
import Head from 'next/head'

function CalendarPage() {
  const [view, setView] = React.useState<'calendar' | 'list'>('calendar')
  const instanceConfig = useInstanceConfig()
  return (
    <div>
      <Head>
        <title>Kalender &bull; {instanceConfig?.name ?? "4play"}</title>
      </Head>
      <div className="flex items-center justify-between mb-4">
        <PageTitle title="Kalender" icon={Calendar} />
        <Navbar items={[
          { id: 'calendar', name: 'Kalender', onClick: () => setView('calendar'), icon: CalendarRange},
          { id: 'list', name: 'Liste', onClick: () => setView('list'), icon: Table},
        ]} activeItemId={view} />
      </div>
      {view === 'calendar' ? <CalendarComponent /> : <div>Liste</div>}
    </div>
  )
}

export default CalendarPage