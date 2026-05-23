import PageTitle from '@/components/utility/PageTitle'
import { Cake, Calendar, CalendarRange, Plus, Table } from 'lucide-react'
import CalendarComponent, { CalendarEntry } from '@/components/ui/Calendar'
import React, { useEffect, useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import { ProtectedPage } from '@/components/utility/ProtectedPage'
import CreateCalendarEntryModal from '@/components/modals/createCalendarEntry'
import { isSameDay } from 'date-fns'
import Appointment from '@/types/calendar/appointment'

function CalendarPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [displayCreateModal, setDisplayCreateModal] = useState(false)
  const [events, setEvents] = useState([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [birthdays, setBirthdays] = useState([])


  async function fetchBirthdays() {
    try {
      const res = await fetch('/api/crew/birthdays')
      if (!res.ok) return
      const data = await res.json()
      setBirthdays(data)
    } catch (error) {
      console.error('Error fetching birthdays:', error)
    }
  }

  async function fetchEvents() {
    try {
      const res = await fetch('/api/calendar/events')
      if (!res.ok) return
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  async function fetchAppointments() {
    try {
      const res = await fetch('/api/calendar/appointments')
      if (!res.ok) return
      const data = await res.json()
      setAppointments(data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  function mapEntriesForDay(day: Date): CalendarEntry[] {
    const entries: CalendarEntry[] = []

    // Birthdays
    birthdays.forEach((b: any) => {
      const bday = new Date(b.dateOfBirth)
      if (bday.getDate() === day.getDate() && bday.getMonth() === day.getMonth()) {
        entries.push({
          type: 'birthday',
          title: (<div className='inline-flex items-center gap-1'><Cake size={12} /> {`${b.firstName} ${b.lastName}`}</div>),
          label: `${b.firstName} ${b.lastName}`,
          start: b.dateOfBirth,
          end: b.dateOfBirth,
        })
      }
    })

    // Events
    events.forEach((e: any) => {
      const eventStart = new Date(e.start)
      const eventEnd = new Date(e.end)
      if (isSameDay(eventStart, day) || isSameDay(eventEnd, day) || (eventStart < day && eventEnd > day)) {
        entries.push({
          type: e.cancelled ? 'cancelled' : 'event',
          title: (<div className='inline-flex items-center gap-1'>{e.title}</div>),
          label: e.title,
          start: e.start,
          end: e.end,
          uuid: e.uuid,
        })
      }
    })

    // Appointments
    appointments.forEach((a) => {
      const apptStart = new Date(a.date?.start)
      if (isSameDay(apptStart, day)) {
        entries.push({
          type: 'appointment',
          title: (<div className='inline-flex items-center gap-1 truncate w-full'>{a.name} ({new Date(a.date.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</div>),
          label: a.name,
          start: new Date(a.date.start).toISOString(),
          end: new Date(a.date.end).toISOString(),
          uuid: a.uuid,
        })
      }
    })

    return entries
  }

  useEffect(() => {
    fetchBirthdays()
    fetchEvents()
    fetchAppointments()
  }, [])

  const handleCloseCreateModal = () => {
    setDisplayCreateModal(false)
    fetchEvents()
    fetchAppointments()
    fetchBirthdays()
  }



  return (
    <ProtectedPage permission="accessCalendar" pageTitle="Kalender">
      <div>
        <div className="flex items-center justify-between mb-4">
          <PageTitle title="Kalender" icon={Calendar} />
          <div className="flex items-center gap-2">
            <button className='text-sm rounded-md border border-gray-800 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-700' onClick={() => setDisplayCreateModal(true)}>
              <Plus className='inline h-4 w-4' />
              <span className='!p-0'>Neu</span>
            </button>
          <Navbar items={[
            { id: 'calendar', name: 'Kalender', onClick: () => setView('calendar'), icon: CalendarRange},
            { id: 'list', name: 'Liste', onClick: () => setView('list'), icon: Table},
          ]} activeItemId={view} />
          </div>
        </div>
        {view === 'calendar' ? <CalendarComponent data={mapEntriesForDay} /> : <div>Liste</div>}
      </div>

      {
        displayCreateModal && <CreateCalendarEntryModal onClose={handleCloseCreateModal} />
      }

    </ProtectedPage>
  )
}

export default CalendarPage