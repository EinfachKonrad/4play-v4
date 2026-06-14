import PageTitle from '@/components/utility/PageTitle'
import { Cake, Calendar, CalendarRange, Plus, Table } from 'lucide-react'
import CalendarComponent, { CalendarEntry } from '@/components/ui/Calendar'
import React, { useEffect, useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import { ProtectedPage } from '@/components/utility/ProtectedPage'
import CreateCalendarEntryModal from '@/components/modals/createCalendarEntry'
import { isSameDay, addDays, addWeeks, addMonths, addYears } from 'date-fns'
import Appointment from '@/types/calendar/appointment'
import { useRouter } from 'next/router'
import { saveToSessionStorage } from '@/lib/sessionStorage'

function addInterval(date: Date, interval: number, unit: 'day' | 'week' | 'month' | 'year'): Date {
  switch (unit) {
    case 'day': return addDays(date, interval)
    case 'week': return addWeeks(date, interval)
    case 'month': return addMonths(date, interval)
    case 'year': return addYears(date, interval)
    default: return date
  }
}

function isAppointmentOnDay(a: Appointment, day: Date): boolean {
  const start = new Date(a.date.start)
  if (isSameDay(start, day)) return true
  if (!a.repeat) return false

  const endDate = a.repeat.endDate ? new Date(a.repeat.endDate) : null
  let current = addInterval(start, a.repeat.interval, a.repeat.unit)
  let count = 1

  while (true) {
    if (endDate && current > endDate) break
    if (a.repeat.iterations !== undefined && count >= a.repeat.iterations) break
    if (isSameDay(current, day)) return true
    if (current > day) break
    current = addInterval(current, a.repeat.interval, a.repeat.unit)
    count++
  }
  return false
}

function getOccurrenceStart(a: Appointment, day: Date): Date {
  const start = new Date(a.date.start)
  if (isSameDay(start, day)) return start
  if (!a.repeat) return start

  const endDate = a.repeat.endDate ? new Date(a.repeat.endDate) : null
  let current = addInterval(start, a.repeat.interval, a.repeat.unit)
  let count = 1

  while (true) {
    if (endDate && current > endDate) break
    if (a.repeat.iterations !== undefined && count >= a.repeat.iterations) break
    if (isSameDay(current, day)) return current
    if (current > day) break
    current = addInterval(current, a.repeat.interval, a.repeat.unit)
    count++
  }
  return start
}

function isValidDateRange(start: unknown, end: unknown): start is string {
  const startDate = new Date(start as string)
  const endDate = new Date(end as string)
  return !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
}

function getEventDateRanges(event: any): Array<{ start: string; end: string }> {
  const ranges: Array<{ start: string; end: string }> = []

  if (isValidDateRange(event?.start, event?.end)) {
    ranges.push({ start: event.start, end: event.end })
  }

  if (Array.isArray(event?.projects)) {
    event.projects.forEach((project: any) => {
      if (Array.isArray(project?.dates)) {
        project.dates.forEach((dateRange: any) => {
          if (isValidDateRange(dateRange?.start, dateRange?.end)) {
            ranges.push({ start: dateRange.start, end: dateRange.end })
          }
        })
      }
    })
  }

  return ranges
}

function isRangeOnDay(start: Date, end: Date, day: Date): boolean {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  return start < dayEnd && end >= dayStart
}

function CalendarPage() {
  const router = useRouter()
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
      const res = await fetch('/api/calendar/events?scope=calendar')
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
      const dateRanges = getEventDateRanges(e)
      const isEventOnDay = dateRanges.some((range) => {
        const rangeStart = new Date(range.start)
        const rangeEnd = new Date(range.end)
        return isRangeOnDay(rangeStart, rangeEnd, day)
      })

      if (!isEventOnDay || dateRanges.length === 0) {
        return
      }

      const sortedRanges = [...dateRanges].sort((left, right) => left.start.localeCompare(right.start))
      const firstRange = sortedRanges[0]
      const lastRange = sortedRanges[sortedRanges.length - 1]

      if (firstRange && lastRange) {
        entries.push({
          type: e.cancelled ? 'cancelled' : 'event',
          title: (<div className='inline-flex items-center gap-1'>{e.name}</div>),
          label: e.name,
          start: firstRange.start,
          end: lastRange.end,
          uid: e.uuid,
          contextMenuOptions: [
            { id: 'view',
              label: 'Ansehen',
              icon: Calendar,
              onClick: () => {handleRedirect('event', e.uid)}
            }
          ]
      })
    }
    })

    // Appointments
    appointments.forEach((a) => {
      const apptStart = new Date(a.date?.start)
      if (!isAppointmentOnDay(a, day)) return
      const occurrenceStart = getOccurrenceStart(a, day)
      entries.push({
        type: 'appointment',
        title: (<div className='inline-flex items-center gap-1 truncate w-full'>{a.name} ({occurrenceStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</div>),
        label: a.name,
        start: occurrenceStart.toISOString(),
        end: new Date(occurrenceStart.getTime() + (new Date(a.date.end).getTime() - new Date(a.date.start).getTime())).toISOString(),
        uid: a.uid,
        contextMenuOptions: [
          { id: 'view',
            label: 'Ansehen', 
            icon: Calendar,
            onClick: () => {handleRedirect('appointment', a.uid)}
          }
        ]
      })
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

  const handleRedirect = (type: 'event' | 'appointment', uid: string) => {
    switch (type) {
      case 'event':
        saveToSessionStorage('selectedEvent', events.find((e: any) => e.uid === uid))
        router.push(`/calendar/event/${uid}`)
        break
      case 'appointment':
        saveToSessionStorage('selectedAppointment', appointments.find((a) => a.uid === uid))
        router.push(`/calendar/appointment/${uid}`)
        break
      default:
        break
    }
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