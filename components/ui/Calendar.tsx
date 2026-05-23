import { addDays, addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Cake } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Button from './Button'

  export type CalendarEntry = {
    type: 'event' | 'appointment' | 'birthday' | 'holiday' | 'cancelled' | 'archived' | 'equipment'
    title: React.ReactNode
    label?: string
    start: string
    end: string
    uuid?: string
  }

  interface CalendarProps {
    data: CalendarEntry[] | ((day: Date) => CalendarEntry[])
    onSelect?: (entry: CalendarEntry) => void
  }


export default function Calendar({ data, onSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), i))

  const getEntriesForDay = (day: Date): CalendarEntry[] => {
    if (typeof data === 'function') {
      return data(day)
    }

    return data.filter(entry => isSameDay(new Date(entry.start), day))
  }


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
          <div key={i} className="text-sm text-center py-2 text-white font-semibold border-x border-b border-gray-900 select-none">{day}</div>
        ))}

        {days.map((day, i) => (
          <div key={i} className={`min-h-[100px] p-1 text-sm border flex flex-col ${day.getMonth() === currentMonth.getMonth() ? 'bg-neutral-900 text-gray-200 border-neutral-800' : 'text-gray-500 border-neutral-900'}`}>
            <div className="text-right text-xs">
              <span className={`px-1 rounded select-none ${isSameDay(day, new Date()) && day.getMonth() === new Date().getMonth() ? 'bg-gray-600 text-white' : ''}`}>
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

             {getEntriesForDay(day).map((entry, idx) => (
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
                    onSelect?.(entry)
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
