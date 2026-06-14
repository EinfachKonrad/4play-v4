import { addDays, addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import Button from './Button'

  export type CalendarContextMenuOption = {
    id: string
    label: string
    icon: LucideIcon
    onClick: (entry: CalendarEntry) => void
    disabled?: boolean
    danger?: boolean
  }

  export type CalendarEntry = {
    type: 'event' | 'appointment' | 'birthday' | 'holiday' | 'cancelled' | 'archived' | 'equipment'
    title: React.ReactNode
    label?: string
    start: string
    end: string
    uid?: string
    contextMenuOptions?: CalendarContextMenuOption[]
  }

  interface CalendarProps {
    data: CalendarEntry[] | ((day: Date) => CalendarEntry[])
    onSelect?: (entry: CalendarEntry) => void
  }


export default function Calendar({ data, onSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    entry: CalendarEntry
    options: CalendarContextMenuOption[]
  } | null>(null)
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), i))

  useEffect(() => {
    if (!contextMenu) {
      return
    }

    const closeMenu = () => setContextMenu(null)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null)
      }
    }

    window.addEventListener('click', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [contextMenu])

  const getColorClass = (type: CalendarEntry['type']) => {
    if (type === 'birthday') return 'bg-green-700'
    if (type === 'cancelled') return 'bg-red-600 line-through'
    if (type === 'event') return 'bg-blue-600'
    if (type === 'appointment') return 'bg-yellow-600'
    return ''
  }

  const startOfDayDate = (date: Date) => {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  const endOfDayDate = (date: Date) => {
    const normalized = new Date(date)
    normalized.setHours(23, 59, 59, 999)
    return normalized
  }

  const doesEntryOverlapDay = (entry: CalendarEntry, day: Date): boolean => {
    const dayStart = startOfDayDate(day)
    const dayEnd = endOfDayDate(day)
    const entryStart = new Date(entry.start)
    const entryEnd = new Date(entry.end)

    if (Number.isNaN(entryStart.getTime()) || Number.isNaN(entryEnd.getTime())) {
      return false
    }

    return entryStart <= dayEnd && entryEnd >= dayStart
  }

  const getEntrySegmentState = (entry: CalendarEntry, day: Date) => {
    const dayStart = startOfDayDate(day)
    const entryStart = new Date(entry.start)
    const entryEnd = new Date(entry.end)
    const entryStartDay = startOfDayDate(entryStart)
    const entryEndDay = startOfDayDate(entryEnd)
    const firstVisibleDay = startOfDayDate(days[0])
    const lastVisibleDay = startOfDayDate(days[days.length - 1])

    const isMultiDay = entryStartDay.getTime() !== entryEndDay.getTime()
    const isStartSegment = dayStart.getTime() === entryStartDay.getTime() || (entryStartDay < firstVisibleDay && dayStart.getTime() === firstVisibleDay.getTime())
    const isEndSegment = dayStart.getTime() === entryEndDay.getTime() || (entryEndDay > lastVisibleDay && dayStart.getTime() === lastVisibleDay.getTime())

    return {
      isMultiDay,
      isStartSegment,
      isEndSegment,
    }
  }

  const getEntryStableKey = (entry: CalendarEntry) => {
    if (entry.uid) {
      return `${entry.type}:${entry.uid}`
    }

    return `${entry.type}:${entry.start}:${entry.end}:${entry.label ?? ''}`
  }

  const getDayKey = (day: Date) => format(day, 'yyyy-MM-dd')

  const getSegmentClass = (entry: CalendarEntry, day: Date) => {
    const segment = getEntrySegmentState(entry, day)

    if (!segment.isMultiDay) {
      return {
        shapeClass: 'rounded',
        showLabel: true,
      }
    }

    if (segment.isStartSegment && segment.isEndSegment) {
      return {
        shapeClass: 'rounded',
        showLabel: true,
      }
    }

    if (segment.isStartSegment) {
      return {
        shapeClass: 'rounded-l -mr-[9px] pr-[10px]',
        showLabel: true,
      }
    }

    if (segment.isEndSegment) {
      return {
        shapeClass: 'rounded-r -ml-[9px] pl-[10px]',
        showLabel: false,
      }
    }

    return {
      shapeClass: 'rounded-none -mx-[9px] px-[10px]',
      showLabel: false,
    }
  }

  const getEntriesForDay = (day: Date): CalendarEntry[] => {
    if (typeof data === 'function') {
      return data(day).filter(entry => doesEntryOverlapDay(entry, day))
    }

    return data.filter(entry => doesEntryOverlapDay(entry, day))
  }

  const laneLayoutByDay = useMemo(() => {
    const layoutByDay = new Map<string, Array<CalendarEntry | null>>()

    for (let weekStartIndex = 0; weekStartIndex < days.length; weekStartIndex += 7) {
      const weekDays = days.slice(weekStartIndex, weekStartIndex + 7)
      const weekEntriesByKey = new Map<string, CalendarEntry>()

      weekDays.forEach((weekDay) => {
        const dayEntries = typeof data === 'function'
          ? data(weekDay).filter(entry => doesEntryOverlapDay(entry, weekDay))
          : data.filter(entry => doesEntryOverlapDay(entry, weekDay))

        dayEntries.forEach((entry) => {
          const entryKey = getEntryStableKey(entry)
          if (!weekEntriesByKey.has(entryKey)) {
            weekEntriesByKey.set(entryKey, entry)
          }
        })
      })

      const typePriority: Record<CalendarEntry['type'], number> = {
        event: 1,
        cancelled: 2,
        equipment: 3,
        appointment: 4,
        birthday: 5,
        holiday: 6,
        archived: 7,
      }

      const sortedWeekEntries = Array.from(weekEntriesByKey.values()).sort((left, right) => {
        const leftStart = new Date(left.start).getTime()
        const rightStart = new Date(right.start).getTime()
        const leftDuration = new Date(left.end).getTime() - leftStart
        const rightDuration = new Date(right.end).getTime() - rightStart

        // Higher duration first keeps long-running entries in top lanes.
        if (leftDuration !== rightDuration) {
          return rightDuration - leftDuration
        }

        if (leftStart !== rightStart) {
          return leftStart - rightStart
        }

        const leftTypePriority = typePriority[left.type] ?? Number.MAX_SAFE_INTEGER
        const rightTypePriority = typePriority[right.type] ?? Number.MAX_SAFE_INTEGER

        if (leftTypePriority !== rightTypePriority) {
          return leftTypePriority - rightTypePriority
        }

        return (left.label ?? '').localeCompare(right.label ?? '')
      })

      const laneEndByIndex: number[] = []
      const laneByEntryKey = new Map<string, number>()

      sortedWeekEntries.forEach((entry) => {
        const entryKey = getEntryStableKey(entry)
        const entryStartDayTs = startOfDayDate(new Date(entry.start)).getTime()
        const entryEndDayTs = startOfDayDate(new Date(entry.end)).getTime()

        let assignedLane = laneEndByIndex.findIndex((laneEndTs) => entryStartDayTs > laneEndTs)

        if (assignedLane === -1) {
          assignedLane = laneEndByIndex.length
        }

        laneEndByIndex[assignedLane] = Math.max(laneEndByIndex[assignedLane] ?? Number.NEGATIVE_INFINITY, entryEndDayTs)
        laneByEntryKey.set(entryKey, assignedLane)
      })

      const weekLaneCount = laneEndByIndex.length

      weekDays.forEach((weekDay) => {
        const dayLanes: Array<CalendarEntry | null> = Array.from({ length: weekLaneCount }, () => null)

        weekEntriesByKey.forEach((entry, entryKey) => {
          if (!doesEntryOverlapDay(entry, weekDay)) {
            return
          }

          const laneIndex = laneByEntryKey.get(entryKey)
          if (laneIndex === undefined) {
            return
          }

          dayLanes[laneIndex] = entry
        })

        layoutByDay.set(getDayKey(weekDay), dayLanes)
      })
    }

    return layoutByDay
  }, [data, days])


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
          <div key={i} className={`min-h-[100px] p-1 text-sm border flex flex-col overflow-visible ${day.getMonth() === currentMonth.getMonth() ? 'bg-neutral-900 text-gray-200 border-neutral-800' : 'text-gray-500 border-neutral-900'}`}>
            <div className="text-right text-xs">
              <span className={`px-1 rounded select-none ${isSameDay(day, new Date()) && day.getMonth() === new Date().getMonth() ? 'bg-gray-600 text-white' : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
            {(laneLayoutByDay.get(getDayKey(day)) ?? getEntriesForDay(day).map(entry => entry)).map((entry, laneIndex) => {
              if (!entry) {
                return <div key={`empty-${laneIndex}`} className="mt-1 h-[22px]" />
              }

              const segmentStyle = getSegmentClass(entry, day)

              return (
                <div
                  key={`${getEntryStableKey(entry)}-${laneIndex}`}
                  className={`mt-1 px-1 py-0.5 text-xs text-white cursor-pointer relative z-10 ${getColorClass(entry.type)} ${segmentStyle.shapeClass}`}
                  title={entry.label}
                  onContextMenu={(event) => {
                    if (!entry.contextMenuOptions || entry.contextMenuOptions.length === 0) {
                      return
                    }

                    event.preventDefault()
                    event.stopPropagation()

                    setContextMenu({
                      x: event.clientX,
                      y: event.clientY,
                      entry,
                      options: entry.contextMenuOptions,
                    })
                  }}
                  onClick={() => {
                    if (entry.type === 'birthday') {
                        // show birthday details
                    } else if (entry.type === 'event' || entry.type === 'appointment') {
                      onSelect?.(entry)
                    }
                  }}
                >
                  <span className={segmentStyle.showLabel ? 'truncate block' : 'opacity-0 block truncate select-none'}>{entry.title}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-2xl"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          {contextMenu.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              className={`text-xs h-full cursor-pointer inline-flex w-full px-2 py-1.5 text-left text-sm transition-colors ${option.disabled ? 'cursor-not-allowed text-neutral-500' : option.danger ? 'text-red-400 hover:bg-red-950/40' : 'text-gray-200 hover:bg-neutral-800'}`}
              onClick={() => {
                if (option.disabled) {
                  return
                }

                option.onClick(contextMenu.entry)
                setContextMenu(null)
              }}
            >
              <option.icon className='h-3 w-3 mr-2 my-auto' />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
