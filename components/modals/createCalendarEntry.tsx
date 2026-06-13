import React, { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { Balloon, BriefcaseBusiness, CalendarPlus, Trash, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Appointment from '@/types/calendar/appointment'
import Event from '@/types/calendar/event'
import CrewMember from '@/types/crewMember'
import Dropdown from '../ui/Dropdown'

interface CreateCalendarEntryModalProps {
  onClose: () => void
}

type CrewPickerMember = Pick<CrewMember, 'uid' | 'firstName' | 'lastName' | 'type'>
type Option = {
  uid: string
  name: string
}

type Entry = {
  name: string
  eventUid?: string
  description: string
  location: string
  companyUid: string
  date?: {
    start: Date | null
    end: Date | null
  }

  clientUid: string
  venue: {
    name: string
    uid: string
  }

  repeat?: {
    interval: number
    unit: NonNullable<Appointment['repeat']>['unit']
    iterations?: number
    endDate?: Date | null
  }
  crew?: Array<{
    uid: string
  }>
  projects?: Array<{
    uid: string
    name: string
    companyUid?: string
    clientUid?: string
    dates: Array<{
      start: Date | null
      end: Date | null
    }>
    timetable: Array<{
      name: string
      description: string
      start: Date | null
      end: Date | null
    }>
    calculation: {
      importEquipment: boolean
      importCrew: boolean
    }
  }>
}

function formatDateTimeLocal(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateLocal(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function createEmptyProject() {
  return {
    uid: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    companyUid: '',
    clientUid: '',
    dates: [{ start: null, end: null }],
    timetable: [],
    calculation: {
      importEquipment: true,
      importCrew: true,
    },
  }
}

export default function CreateCalendarEntryModal({ onClose }: CreateCalendarEntryModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [entryType, setEntryType] = useState<'event' | 'appointment'>('event')
  const [repeatAppointment, setRepeatAppointment] = useState(false)
  const [crewMembers, setCrewMembers] = useState<CrewPickerMember[]>([])
  const [brandings, setBrandings] = useState<Option[]>([])
  const [crewSearch, setCrewSearch] = useState('')
  const [crewLoading, setCrewLoading] = useState(false)
  const [brandingsLoading, setBrandingsLoading] = useState(false)
  const [displayPreviousButton, setDisplayPreviousButton] = useState(false)
  const [projectDraft, setProjectDraft] = useState(createEmptyProject())
  const [clients, setClients] = useState<Option[]>([])
  const [entryData, setEntryData] = useState<Entry>({
    name: '',
    eventUid: '',
    description: '',
    location: '',
    companyUid: '',
    date: {
      start: null,
      end: null,
    },
    clientUid: '',
    venue: {
      name: '',
      uid: '',
    },
    repeat: {
      interval: 1,
      unit: 'week',
      endDate: null,
    },
    crew: [],
    projects: [],
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

  useEffect(() => {
    let ignore = false

    async function fetchBrandings() {
      setBrandingsLoading(true)

      try {
        const response = await fetch('/api/settings/brandings')
        if (!response.ok) {
          throw new Error('Failed to fetch brandings')
        }

        const data = await response.json()
        if (!ignore) {
          const options = Array.isArray(data)
            ? data
                .filter((item): item is Option => Boolean(item && typeof item.uid === 'string' && typeof item.name === 'string'))
                .map((item) => ({ uid: item.uid, name: item.name }))
            : []

          setBrandings(options)
        }
      } catch (error) {
        console.error('Error fetching brandings:', error)
      } finally {
        if (!ignore) {
          setBrandingsLoading(false)
        }
      }
    }

    async function fetchClients() {
      try {
        const response = await fetch('/api/contacts/clients')
        if (!response.ok) {
          throw new Error('Failed to fetch clients')
        }

        const data = await response.json()
        if (!ignore) {
          const options = Array.isArray(data)
            ? data
                .filter((item): item is Option => Boolean(item && typeof item.uid === 'string' && typeof item.name === 'string'))
                .map((item) => ({ uid: item.uid, name: item.name }))
            : []

          setClients(options)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    }

    fetchBrandings()
    fetchClients()

    return () => {
      ignore = true
    }
  }, [])

  const entryDate: NonNullable<Entry['date']> = entryData.date ?? {
    start: null,
    end: null,
  }

  const selectedCrew = crewMembers.filter((member) =>
    entryData.crew?.some((selected) => selected.uid === member.uid)
  )

  const filteredCrew = crewMembers.filter((member) => {
    if (!crewSearch.trim()) {
      return true
    }

    const query = crewSearch.trim().toLowerCase()
    return `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) || member.uid.toLowerCase().includes(query)
  })

  function toggleCrewMember(uid: string) {
    const currentCrew = entryData.crew ?? []
    const exists = currentCrew.some((member) => member.uid === uid)

    setEntryData({
      ...entryData,
      crew: exists
        ? currentCrew.filter((member) => member.uid !== uid)
        : [...currentCrew, { uid }],
    })
  }

  function updateProjectDraftDate(index: number, key: 'start' | 'end', value: string) {
    setProjectDraft((current) => ({
      ...current,
      dates: current.dates.map((dateRange, dateIndex) => {
        if (dateIndex !== index) return dateRange
        if (!value) {
          return { ...dateRange, [key]: null }
        }

        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) {
          return dateRange
        }

        return { ...dateRange, [key]: parsed }
      }),
    }))
  }

  function addProjectDateRange() {
    setProjectDraft((current) => ({
      ...current,
      dates: [...current.dates, { start: null, end: null }],
    }))
  }

  function removeProjectDateRange(index: number) {
    setProjectDraft((current) => ({
      ...current,
      dates: current.dates.length > 1 ? current.dates.filter((_, dateIndex) => dateIndex !== index) : current.dates,
    }))
  }

  function addProjectToEvent() {
    const trimmedName = projectDraft.name.trim()
    if (!trimmedName) {
      alert('Bitte geben Sie einen Projektnamen ein.')
      return
    }

    const projectDates = projectDraft.dates.filter((dateRange) => dateRange.start && dateRange.end)
    if (projectDates.length === 0) {
      alert('Bitte geben Sie mindestens einen gültigen Projektzeitraum an.')
      return
    }

    setEntryData((current) => ({
      ...current,
      projects: [
        ...(current.projects ?? []),
        {
          ...projectDraft,
          name: trimmedName,
          companyUid: projectDraft.companyUid.trim() || undefined,
          clientUid: projectDraft.clientUid.trim() || undefined,
          dates: projectDates,
        },
      ],
    }))

    setProjectDraft(createEmptyProject())
  }

  function removeProjectFromEvent(uid: string) {
    setEntryData((current) => ({
      ...current,
      projects: (current.projects ?? []).filter((project) => project.uid !== uid),
    }))
  }

  function buildProjectPayload() {
    return (entryData.projects ?? []).map((project) => ({
      uid: project.uid,
      name: project.name,
      ...(project.companyUid ? { companyUid: project.companyUid } : {}),
      ...(project.clientUid ? { clientUid: project.clientUid } : {}),
      dates: project.dates
        .filter((dateRange): dateRange is { start: Date; end: Date } => Boolean(dateRange.start && dateRange.end))
        .map((dateRange) => ({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        })),
      equipment: {
        groups: [],
      },
      crew: {
        positions: [],
        bookedCrew: [],
      },
      timetable: {
        events: project.timetable
          .filter((item): item is { name: string; description: string; start: Date; end: Date } => Boolean(item.start && item.end))
          .map((item) => ({
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
            start: item.start,
            end: item.end,
          })),
      },
      calculation: {
        importEquipment: project.calculation.importEquipment,
        importCrew: project.calculation.importCrew,
        positions: [],
      },
    })) satisfies Event['projects']
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
    if (!entryData.name || !entryDate.start || !entryDate.end) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    if (repeatAppointment && entryData.repeat && entryData.repeat.interval <= 0) {
      alert('Bitte geben Sie ein gültiges Wiederholungsintervall an.')
      return
    }

    const appointmentPayload: Omit<Appointment, 'uid'> = {
      ...(entryData.eventUid?.trim() ? { eventUid: entryData.eventUid.trim() } : {}),
      name: entryData.name.trim(),
      description: entryData.description,
      location: entryData.location,
      date: {
        start: entryDate.start,
        end: entryDate.end,
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

  async function handleSubmitEvent(e?: React.FormEvent) {
    e?.preventDefault()

    if (!entryData.name.trim()) {
      alert('Bitte geben Sie einen Veranstaltungsnamen ein.')
      return
    }

    if (!entryData.companyUid.trim()) {
      alert('Bitte geben Sie eine Firmenkennung für die Veranstaltung an.')
      return
    }

    const clientUid = (entryData.clientUid ?? '').trim()

    const eventPayload: Omit<Event, 'uid'> = {
      companyUid: entryData.companyUid.trim(),
      name: entryData.name.trim(),
      description: entryData.description.trim(),
      ...(clientUid ? { clientUid } : {}),
      ...(entryData.venue.name.trim() || entryData.venue.uid.trim()
        ? {
            venue: {
              ...(entryData.venue.name.trim() ? { name: entryData.venue.name.trim() } : {}),
              ...(entryData.venue.uid.trim() ? { uid: entryData.venue.uid.trim() } : {}),
            },
          }
        : {}),
      projects: buildProjectPayload(),
    }

    console.log('Event payload', eventPayload)

    await fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    })


    onClose()
  }

  return (
    <Modal
      title={currentStep === 1 ? 'Kalender-Eintrag hinzufügen' : entryType === 'event' ? 'Veranstaltung erstellen' : 'Termin erstellen'}
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
                      value={formatDateTimeLocal(entryDate.start)}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setEntryData({ ...entryData, date: { start: null, end: null } })
                          return
                        }
                        const start = new Date(e.target.value)
                        if (Number.isNaN(start.getTime())) return
                        setEntryData({
                          ...entryData,
                          date: {
                            start,
                            end: entryDate.end ?? new Date(start.getTime() + 60 * 60 * 1000),
                          },
                        })
                      }}
                      type='datetime-local'
                    />
                    <p>-</p>
                    <Input
                      value={formatDateTimeLocal(entryDate.end)}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setEntryData({ ...entryData, date: { start: entryDate.start, end: null } })
                          return
                        }
                        const end = new Date(e.target.value)
                        if (Number.isNaN(end.getTime())) return
                        setEntryData({ ...entryData, date: { start: entryDate.start, end } })
                      }}
                      type='datetime-local'
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-4 ml-2 cursor-pointer">
                  <span className="select-none text-sm font-medium text-heading">Wiederholen?</span>
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
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
                    }} />
                  <div className="relative w-9 h-5 bg-neutral-quaternary rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                </label>

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
                        type='date'
                        value={formatDateLocal(entryData.repeat.endDate ?? null)}
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
                <Button onClick={handleNextStep}>Weiter</Button>
              </form>
            </div>
          </div>
        </>
      )}

      {currentStep === 3 && entryType === 'appointment' && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Wer?</h2>
          <form onSubmit={handleSubmitAppointment} className='flex flex-col gap-4'>

          <div>
                  <label className='text-sm text-gray-400'>Crew</label>
                  <div>
                    <div className='flex flex-wrap gap-2 mb-2'>
                      {selectedCrew.map(member => (
                        <div key={member.uid} className='flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300'>
                          <span className='text-sm'>{member.firstName} {member.lastName}</span>
                          <button type='button' onClick={() => toggleCrewMember(member.uid)} className='text-sm text-red-500 cursor-pointer' aria-label={`Entferne ${member.firstName} ${member.lastName}`}>
                            <X className='h-3 w-3' />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className='relative'>
                      <Input
                        value={crewSearch}
                        onChange={(e) => setCrewSearch(e.target.value)}
                        placeholder='Crew-Mitglied suchen…'
                      />
                      {crewSearch.trim() && filteredCrew.filter(m => !entryData.crew?.some(s => s.uid === m.uid)).length > 0 && (
                        <div className='absolute z-20 left-0 right-0 bg-neutral-900 border border-neutral-700 mt-1 rounded-md max-h-40 overflow-auto'>
                          {filteredCrew
                            .filter(m => !entryData.crew?.some(s => s.uid === m.uid))
                            .map(m => (
                              <div
                                key={m.uid}
                                className='px-3 py-2 hover:bg-neutral-800 cursor-pointer'
                                onMouseDown={(ev) => { ev.preventDefault(); toggleCrewMember(m.uid); setCrewSearch('') }}
                              >
                                {m.firstName} {m.lastName}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button type='submit'>Termin erstellen</Button>
                </form>
        </div>  
      )}


      {currentStep === 2 && entryType === 'event' && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Veranstaltung</h2>
          <div>
            <form onSubmit={handleSubmitEvent} className='flex flex-col gap-4'>
              <div>
                <label className='text-sm text-gray-400'>Name</label>
                <Input value={entryData.name} onChange={(e) => setEntryData({ ...entryData, name: e.target.value })} placeholder='Produktvorstellung' />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                <div>
                  <label className='text-sm text-gray-400'>Firma</label>
                  <Dropdown
                    placeholder='Veranstaltungsfirma GmbH'
                    value={entryData.companyUid}
                    onSelect={(value) => setEntryData({ ...entryData, companyUid: value })}
                    options={brandings.map((branding) => ({ value: branding.uid, label: branding.name }))}
                    key={entryData.companyUid}
                  />
                </div>
                <div>
                  <label className='text-sm text-gray-400'>Kunde</label>
                  <Dropdown
                    placeholder='Kundenname'
                    value={entryData.clientUid}
                    onSelect={(value) => setEntryData({ ...entryData, clientUid: value })}
                    options={clients.map((client) => ({ value: client.uid, label: client.name }))}
                    key={entryData.clientUid}
                    searchable
                  />
                </div>
                <div>
                  <label className='text-sm text-gray-400'>Ort / Venue</label>
                  <Input value={entryData.venue.name} onChange={(e) => setEntryData({ ...entryData, venue: { ...entryData.venue, name: e.target.value } })} placeholder='Main Stage' />
                </div>
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
              <Button onClick={handleNextStep}>Weiter</Button>
            </form>
          </div>
        </div>
      )}


      {currentStep === 3 && entryType === 'event' && (
        <div className='flex flex-col gap-2 mt-4 h-full'>
          <h2 className='text-lg font-semibold'>Projekte</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addProjectToEvent()
            }}
            className='flex flex-col gap-4 rounded-md border border-gray-700 p-3'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              <div>
                <label className='text-sm text-gray-400'>Projektname</label>
                <Input value={projectDraft.name} onChange={(e) => setProjectDraft({ ...projectDraft, name: e.target.value })} placeholder='Projekt A' />
              </div>
              <div>
                <label className='text-sm text-gray-400'>Projekt-Firma</label>
                <Input value={projectDraft.companyUid} onChange={(e) => setProjectDraft({ ...projectDraft, companyUid: e.target.value })} placeholder='c-xxx' />
              </div>
              <div>
                <label className='text-sm text-gray-400'>Projekt-Kunde</label>
                <Input value={projectDraft.clientUid} onChange={(e) => setProjectDraft({ ...projectDraft, clientUid: e.target.value })} placeholder='cl-xxx' />
              </div>
            </div>

            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between gap-2'>
                <label className='text-sm text-gray-400'>Zeiträume</label>
                <button type='button' onClick={addProjectDateRange} className='text-xs rounded-md border border-gray-700 px-2 py-1 hover:bg-gray-800'>Zeitraum hinzufügen</button>
              </div>
              {projectDraft.dates.map((dateRange, index) => (
                <div key={index} className='grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center'>
                  <Input
                    type='date'
                    value={formatDateLocal(dateRange.start)}
                    onChange={(e) => updateProjectDraftDate(index, 'start', e.target.value)}
                  />
                  <span className='hidden md:block text-center text-gray-500'>-</span>
                  <Input
                    type='date'
                    value={formatDateLocal(dateRange.end)}
                    onChange={(e) => updateProjectDraftDate(index, 'end', e.target.value)}
                  />
                  <button
                    type='button'
                    onClick={() => removeProjectDateRange(index)}
                    disabled={projectDraft.dates.length === 1}
                    className='text-xs rounded-md border border-gray-700 px-2 py-1 hover:bg-gray-800 disabled:opacity-50'
                  >
                    <Trash className='h-3 w-3' />
                  </button>
                </div>
              ))}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              <label className='inline-flex items-center gap-2 text-sm text-gray-300'>
                <input
                  type='checkbox'
                  checked={projectDraft.calculation.importEquipment}
                  onChange={(e) => setProjectDraft({
                    ...projectDraft,
                    calculation: { ...projectDraft.calculation, importEquipment: e.target.checked },
                  })}
                />
                Equipment in Kalkulation übernehmen
              </label>
              <label className='inline-flex items-center gap-2 text-sm text-gray-300'>
                <input
                  type='checkbox'
                  checked={projectDraft.calculation.importCrew}
                  onChange={(e) => setProjectDraft({
                    ...projectDraft,
                    calculation: { ...projectDraft.calculation, importCrew: e.target.checked },
                  })}
                />
                Crew in Kalkulation übernehmen
              </label>
            </div>

            <div className='flex items-center justify-end gap-2'>
              <Button type='button' onClick={() => setProjectDraft(createEmptyProject())}>Zurücksetzen</Button>
              <Button type='submit'>Projekt hinzufügen</Button>
            </div>
          </form>

          <div className='flex flex-col gap-2'>
            {entryData.projects && entryData.projects.length > 0 ? (
              entryData.projects.map((project) => (
                <div key={project.uid} className='rounded-md border border-gray-700 p-3 flex flex-col gap-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <div>
                      <div className='font-medium'>{project.name}</div>
                      <div className='text-xs text-gray-400'>
                        {project.dates.map((dateRange) => `${formatDateTimeLocal(dateRange.start)} - ${formatDateTimeLocal(dateRange.end)}`).join(', ')}
                      </div>
                    </div>
                    <Button type='button' onClick={() => removeProjectFromEvent(project.uid)}>Entfernen</Button>
                  </div>
                  <div className='text-xs text-gray-400'>
                    Kalkulation: Equipment {project.calculation.importEquipment ? 'ja' : 'nein'}, Crew {project.calculation.importCrew ? 'ja' : 'nein'}
                  </div>
                </div>
              ))
            ) : (
              <div className='text-sm text-gray-400'>Noch keine Projekte angelegt.</div>
            )}
          </div>

          <Button type='button' onClick={() => { void handleSubmitEvent() }}>Veranstaltung erstellen</Button>
        </div>
      )}
    </Modal>
  )
}