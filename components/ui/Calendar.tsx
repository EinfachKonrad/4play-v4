import { addDays, addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useState } from 'react'
import Button from './Button'

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), i))

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
          <div key={i} className={`min-h-[100px] p-1 text-sm border flex flex-col ${day.getMonth() === currentMonth.getMonth() ? 'bg-gray-900 text-gray-200 border-gray-800' : 'text-gray-500 border-gray-900'}`}>
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
          </div>
        ))}
      </div>
    </div>
  )
}
