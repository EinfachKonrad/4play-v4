import { addDays, addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Cake } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Button from './Button'

  type CalendarEntry = {
    type: 'event' | 'appointment' | 'birthday' | 'holiday' | 'cancelled' | 'archived' | 'equipment'
    title: React.ReactNode
    label?: string
    start: string
    end: string
    uuid?: string
  }


export default function Calendar() {
  const [events, setEvents] = useState([])
  const [appointments, setAppointments] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), i))

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
    appointments.forEach((a: any) => {
      const apptStart = new Date(a.start)
      if (isSameDay(apptStart, day)) {
        entries.push({
          type: 'appointment',
          title: (<div className='inline-flex items-center gap-1'>{a.title}</div>),
          label: a.title,
          start: a.start,
          end: a.end,
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




  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Button onClick={() => setCurrentMonth((prev => addMonths(prev, -1)))}><ChevronLeft className='h-6 w-6' /></Button>
        <div className="flex items-center gap-4">
          <section className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: de })}</section>
          <Button className={` ${isSameMonth(currentMonth, new Date()) ? 'bg-gray-600' : ''}`} onClick={() => setCurrentMonth(new Date())}>Heute</Button>
        </div>
        <Button onClick={() => setCurrentMonth((prev => addMonths(prev, 1)))}><ChevronRight className='h-6 w-6' /></Button>
      </div>
      <div className="grid grid-cols-7 gap-px">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, i) => (
          <div key={i} className="text-sm text-center py-2 text-white font-semibold border-x border-b border-gray-900">{day}</div>
        ))}

        {days.map((day, i) => (
          <div key={i} className={`min-h-[100px] p-1 text-sm border flex flex-col ${day.getMonth() === currentMonth.getMonth() ? 'bg-neutral-900 text-gray-200 border-neutral-800' : 'text-gray-500 border-neutral-900'}`}>
            <div className="text-right text-xs">
              <span className={`px-1 rounded ${isSameDay(day, new Date()) && day.getMonth() === new Date().getMonth() ? 'bg-gray-600 text-white' : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
            {/* {getEntriesForDay(day).map((entry, idx) => (
              <div
                key={idx}
                className={classNames(
                  'mt-1 px-1 py-0.5 rounded text-xs truncate text-white cursor-pointer',
                  typeColors[entry.type],
                  (entry.type === 'holiday' || entry.type === 'birthday') && 'opacity-90',
                  entry.type === 'holiday' && 'cursor-default pointer-events-none',
                )}
                title={getEntryTitleForDay(entry, day)}
                onContextMenu={(e) => openContextMenu(e, entry)}
                onClick={() => {
                  if (entry.type === 'birthday' && entry.birthdayPerson) {
                    setSelectedBirthday(entry)
                    setShowBirthdayModal(true)
                  } else if (entry.type !== 'holiday') {
                    onSelect?.(entry)
                  }
                }}
                onDoubleClick={() => {
                  if (entry.type === 'event' || entry.type === 'cancelled' || entry.type === 'archived' || entry.type === 'equipment') {
                    router.push(`/events/${entry.uuid}`)
                  }
                }}
              >
                {getEntryTitleForDay(entry, day)}
              </div>
            ))} */}

             {mapEntriesForDay(day).map((entry, idx) => (
              <div
                key={idx}
                className={`mt-1 px-1 py-0.5 rounded text-xs truncate text-white cursor-pointer ${
                                  entry.type === 'birthday' ? 'bg-green-700' :
                                  entry.type === 'cancelled' ? 'bg-red-600 line-through' :
                                  entry.type === 'event' ? 'bg-blue-600' :
                                  entry.type === 'appointment' ? 'bg-yellow-600' : ''
                                }`}
                title={entry.label}
                onClick={() => {
                  if (entry.type === 'birthday') {
                    // show birthday details
                  } else if (entry.type === 'event' || entry.type === 'appointment') {
                    // navigate to event/appointment details
                  }
                }}
              >
                {entry.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
