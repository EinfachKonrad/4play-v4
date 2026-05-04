import { addDays, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns'
import React from 'react'

export default function Calendar() {
    const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(startOfMonth(new Date()), { weekStartsOn: 1 }), i))


  return (
    <div className="grid grid-cols-7 gap-px bg-gray-700">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, i) => (
                <div key={i} className="text-sm text-center py-2 bg-base text-white font-semibold">{day}</div>
              ))}

              {days.map((day, i) => (
                <div key={i} className={`min-h-[100px] p-1 text-sm border border-gray-800 flex flex-col ${day.getMonth() === new Date().getMonth() ? 'bg-gray-900 text-gray-200' : 'bg-gray-800 text-gray-500'}`}>
                  <div className="text-right text-xs">
                    <span className={`px-1 rounded ${isSameDay(day, new Date()) && day.getMonth() === new Date().getMonth() ? 'bg-blue-500 text-white' : ''}`}>
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
  )
}
