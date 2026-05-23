import React, { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { Balloon, BriefcaseBusiness, CalendarPlus, Search, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Appointment from '@/types/calendar/appointment'
import CrewMember from '@/types/crewMember'

interface CreateCalendarEntryModalProps {
  onClose: () => void
}

type CrewPickerMember = Pick<CrewMember, 'uuid' | 'firstName' | 'lastName' | 'type'>

type Entry = {
  name: string
  eventUuid?: string
  description: string
  location: string
  date: {
    start: Date | null
    end: Date | null
  }
  repeat?: {
    interval: number
    unit: NonNullable<Appointment['repeat']>['unit']
    iterations?: number
    endDate?: Date | null
  }
  crew?: Array<{
    uuid: string
  }>
}

function formatDateTimeLocal(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function CreateCalendarEntryModal({ onClose }: CreateCalendarEntryModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [entryType, setEntryType] = useState<'event' | 'appointment'>('event')
  const [repeatAppointment, setRepeatAppointment] = useState(false)
  const [crewMembers, setCrewMembers] = useState<CrewPickerMember[]>([])
  const [crewSearch, setCrewSearch] = useState('')
  const [crewLoading, setCrewLoading] = useState(false)
  const [displayPreviousButton, setDisplayPreviousButton] = useState(false)
  const [entryData, setEntryData] = useState<Entry>({
    name: '',
    eventUuid: '',
    description: '',
    location: '',
    date: {
      start: null,
      end: null,
    },
    repeat: {
      interval: 1,
      unit: 'week',
      endDate: null,
    },
    crew: [],
  })

  useEffect(() => {
    let ignore = false

    async function fetchCrewMembers() {
      setCrewLoading(true)

      try {
        const response = await fetch('/api/crew')
        if (!response.ok) {
          throw new Error('Failed to fetch crew members')
        }

        const data = await response.json()
        if (!ignore) {
          setCrewMembers(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error fetching crew members:', error)
      } finally {
        if (!ignore) {
          setCrewLoading(false)
        }
      }
    }

    fetchCrewMembers()

    return () => {
      ignore = true
    }
  }, [])

  const selectedCrew = crewMembers.filter((member) =>
    entryData.crew?.some((selected) => selected.uuid === member.uuid)
  )

  const filteredCrew = crewMembers.filter((member) => {
    if (!crewSearch.trim()) {
      return true
    }

    const query = crewSearch.trim().toLowerCase()
    return `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) || member.uuid.toLowerCase().includes(query)
  })

  function toggleCrewMember(uuid: string) {
    const currentCrew = entryData.crew ?? []
    const exists = currentCrew.some((member) => member.uuid === uuid)

    setEntryData({
      ...entryData,
      crew: exists
        ? currentCrew.filter((member) => member.uuid !== uuid)
        : [...currentCrew, { uuid }],
    })
  }

  async function handleNextStep() {
    setCurrentStep(currentStep + 1)
    setDisplayPreviousButton(true)
  }

  async function handlePreviousStep() {
    setCurrentStep(currentStep - 1)
    if (currentStep - 1 === 1) {
      setDisplayPreviousButton(false)
    }
  }

  async function handleSubmitAppointment(e: React.FormEvent) {
    e.preventDefault()

    // Validate input
    if (!entryData.name || !entryData.date.start || !entryData.date.end) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    if (repeatAppointment && entryData.repeat && entryData.repeat.interval <= 0) {
      alert('Bitte geben Sie ein gültiges Wiederholungsintervall an.')
      return
    }

    const appointmentPayload: Omit<Appointment, 'uuid'> = {
      ...(entryData.eventUuid?.trim() ? { eventUuid: entryData.eventUuid.trim() } : {}),
      name: entryData.name.trim(),
      description: entryData.description,
      location: entryData.location,
      date: {
        start: entryData.date.start,
        end: entryData.date.end,
      },
      ...(repeatAppointment && entryData.repeat
        ? {
            repeat: {
              interval: entryData.repeat.interval,
              unit: entryData.repeat.unit,
              ...(entryData.repeat.iterations ? { iterations: entryData.repeat.iterations } : {}),
              ...(entryData.repeat.endDate ? { endDate: entryData.repeat.endDate } : {}),
            },
          }
        : {}),
      ...(entryData.crew && entryData.crew.length > 0 ? { crew: entryData.crew } : {}),
    }

    try {
      const res = await fetch('/api/calendar/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentPayload),
      })

      if (!res.ok) {
        throw new Error('Fehler beim Erstellen des Termins')
      }

      onClose()
    } catch (error) {
      console.error(error)
      alert('Fehler beim Erstellen des Termins')
    }
  }

  return (
    <Modal
      title={currentStep === 1 ? 'Kalender-Eintrag erstellen' : entryType === 'event' ? 'Veranstaltung erstellen' : 'Termin erstellen'}
      onClose={onClose}
      icon={CalendarPlus}
      onBack={displayPreviousButton ? handlePreviousStep : undefined}
    >
      {currentStep === 1 && (
        <>
          <h2 className='text-lg font-semibold'>Was möchten Sie erstellen?</h2>
          <div className='flex flex-col gap-2 mt-4 h-full'>
            <Button onClick={() => { setEntryType('event'); handleNextStep() }} className='text-2xl cursor-pointer h-full rounded-md border border-gray-700 hover:bg-gray-700 transition-colors duration-300'>
              <Balloon size={32} className='inline mr-2' />
              Veranstaltung
            </Button>
            <Button onClick={() => { setEntryType('appointment'); handleNextStep() }} className='text-2xl cursor-pointer h-full rounded-md border border-gray-700 hover:bg-gray-700 transition-colors duration-300'>
              <BriefcaseBusiness size={32} className='inline mr-2' />
              Termin
            </Button>
          </div>
        </>
      )}

      {currentStep === 2 && entryType === 'appointment' && (
        <>
          <div className='flex flex-col gap-2 mt-4 h-full'>
            <h2 className='text-lg font-semibold'>Was, wann, wo?</h2>
            <div>
              <form onSubmit={handleSubmitAppointment} className='flex flex-col gap-4'>
                <div>
                  <label className='text-sm text-gray-400'>Name</label>
                  <Input value={entryData.name} onChange={(e) => setEntryData({ ...entryData, name: e.target.value })} placeholder='Projektbesprechung' />
                </div>

                <div>
                  <label className='text-sm text-gray-400'>Verknüpfte Event-UUID</label>
                  <Input value={entryData.eventUuid ?? ''} onChange={(e) => setEntryData({ ...entryData, eventUuid: e.target.value })} placeholder='e-...' />
                </div>

                <div>
                  <label className='text-sm text-gray-400'>Beschreibung</label>
                  <textarea
                    value={entryData.description}
                    onChange={(e) => setEntryData({ ...entryData, description: e.target.value })}
                    placeholder='Optionaler Beschreibungstext'
                    className='border-b w-full m-2 bg-transparent resize-y min-h-24'
                  />
                </div>

                <div className='w-full'>
                  <label className='text-sm text-gray-400'>Datum & Uhrzeit</label>
                  <div className='flex gap-2'>
                    <Input
                      value={formatDateTimeLocal(entryData.date.start)}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setEntryData({ ...entryData, date: { ...entryData.date, start: null, end: null } })
                          return
                        }
                        const start = new Date(e.target.value)
                        if (Number.isNaN(start.getTime())) return
                        setEntryData({
                          ...entryData,
                          date: {
                            ...entryData.date,
                            start,
                            end: entryData.date.end ?? new Date(start.getTime() + 60 * 60 * 1000),
                          },
                        })
                      }}
                      type='datetime-local'
                    />
                    <p>-</p>
                    <Input
                      value={formatDateTimeLocal(entryData.date.end)}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setEntryData({ ...entryData, date: { ...entryData.date, end: null } })
                          return
                        }
                        const end = new Date(e.target.value)
                        if (Number.isNaN(end.getTime())) return
                        setEntryData({ ...entryData, date: { ...entryData.date, end } })
                      }}
                      type='datetime-local'
                    />
                  </div>
                </div>

                <div>
                  <label className='text-sm text-gray-400'>Wiederholen?</label>
                  <Input
                    type='checkbox'
                    checked={repeatAppointment}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setRepeatAppointment(checked)
                      if (!checked) {
                        setEntryData({ ...entryData, repeat: undefined })
                        return
                      }

                      setEntryData({
                        ...entryData,
                        repeat: entryData.repeat ?? {
                          interval: 1,
                          unit: 'week',
                          endDate: null,
                        },
                      })
                    }}
                  />
                </div>

                {repeatAppointment && entryData.repeat && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    <div>
                      <label className='text-sm text-gray-400'>Intervall</label>
                      <input
                        type='number'
                        min='1'
                        value={entryData.repeat.interval}
                        onChange={(e) => setEntryData({
                          ...entryData,
                          repeat: {
                            ...entryData.repeat!,
                            interval: Math.max(1, Number(e.target.value) || 1),
                          },
                        })}
                        className='border-b w-full m-2 bg-transparent'
                      />
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>Einheit</label>
                      <select
                        value={entryData.repeat.unit}
                        onChange={(e) => setEntryData({
                          ...entryData,
                          repeat: {
                            ...entryData.repeat!,
                            unit: e.target.value as NonNullable<Appointment['repeat']>['unit'],
                          },
                        })}
                        className='border-b w-full m-2 bg-neutral-900'
                      >
                        <option value='day'>Tag</option>
                        <option value='week'>Woche</option>
                        <option value='month'>Monat</option>
                        <option value='year'>Jahr</option>
                      </select>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>Anzahl Wiederholungen</label>
                      <input
                        type='number'
                        min='1'
                        value={entryData.repeat.iterations ?? ''}
                        onChange={(e) => setEntryData({
                          ...entryData,
                          repeat: {
                            ...entryData.repeat!,
                            iterations: e.target.value ? Math.max(1, Number(e.target.value) || 1) : undefined,
                          },
                        })}
                        className='border-b w-full m-2 bg-transparent'
                      />
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>Wiederholen bis</label>
                      <Input
                        type='datetime-local'
                        value={formatDateTimeLocal(entryData.repeat.endDate ?? null)}
                        onChange={(e) => setEntryData({
                          ...entryData,
                          repeat: {
                            ...entryData.repeat!,
                            endDate: e.target.value ? new Date(e.target.value) : null,
                          },
                        })}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className='text-sm text-gray-400'>Ort</label>
                  <Input value={entryData.location} onChange={(e) => setEntryData({ ...entryData, location: e.target.value })} placeholder='Behstraße 4' />
                </div>

                <div>
                  <label className='text-sm text-gray-400'>Crew</label>

                  <div className='m-2 border border-gray-800 rounded-md p-3 space-y-3'>
                    <div className='flex items-center gap-2 border-b border-gray-800 pb-2'>
                      <Search className='h-4 w-4 text-gray-400' />
                      <input
                        value={crewSearch}
                        onChange={(e) => setCrewSearch(e.target.value)}
                        placeholder='Crew suchen nach Name oder UUID'
                        className='w-full bg-transparent outline-none'
                      />
                    </div>

                    {selectedCrew.length > 0 && (
                      <div className='flex flex-wrap gap-2'>
                        {selectedCrew.map((member) => (
                          <button
                            key={member.uuid}
                            type='button'
                            onClick={() => toggleCrewMember(member.uuid)}
                            className='inline-flex items-center gap-2 rounded-full border border-gray-700 px-3 py-1 text-xs hover:bg-gray-800'
                          >
                            <span>{member.firstName} {member.lastName}</span>
                            <X className='h-3 w-3' />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className='max-h-44 overflow-y-auto space-y-1'>
                      {crewLoading && <p className='text-sm text-gray-400'>Crew wird geladen...</p>}
                      {!crewLoading && filteredCrew.length === 0 && (
                        <p className='text-sm text-gray-400'>Keine Crew-Mitglieder gefunden.</p>
                      )}
                      {!crewLoading && filteredCrew.map((member) => {
                        const selected = entryData.crew?.some((crewMember) => crewMember.uuid === member.uuid) ?? false

                        return (
                          <button
                            key={member.uuid}
                            type='button'
                            onClick={() => toggleCrewMember(member.uuid)}
                            className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-all duration-200 ${selected ? 'border-yellow-600 bg-yellow-950/40' : 'border-gray-800 hover:bg-gray-800'}`}
                          >
                            <div>
                              <p className='text-sm'>{member.firstName} {member.lastName}</p>
                              <p className='text-xs text-gray-400'>{member.uuid} · {member.type}</p>
                            </div>
                            <span className='text-xs text-gray-400'>{selected ? 'Ausgewählt' : 'Hinzufügen'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <Button type='submit'>Erstellen</Button>
              </form>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}