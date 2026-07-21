import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import useSoftwareTab from '@/hooks/useSoftwareTab'
import Event from '@/types/calendar/event'
import { Book, CalendarRange, ClipboardList, HandCoins, Package, Plus, Save, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

function EventIndexPage() {
    const router = useRouter()
    const { setCurrentTabTitle } = useSoftwareTab()
    const [view, setView] = React.useState<'index' | 'timetable' | 'calculation' | 'equipment' | 'crew'>('index')
    const [eventData, setEventData] = useState<Event>();
    const [loading, setLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [savedEventData, setSavedEventData] = useState<Event>();

    const formatDateForDisplay = (value: string) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) {
            return value
        }

        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const formatDateForInput = (value: string) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) {
            return ''
        }

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    useEffect(() => {
        setView((router.query.view as typeof view) || 'index')
    }, [router.query.view])

        useEffect(() => {
        setSelectedProject((router.query.project as string) || null)
    }, [router.query.project])

    const handleViewChange = (newView: typeof view) => {
        setView(newView)
        router.push({
            pathname: router.pathname,
            query: { ...router.query, view: newView }
        }, undefined, { shallow: true })
    }

    const eventUid = typeof router.query.id === 'string' ? router.query.id : undefined

    async function fetchDataFromSessionStorage(uid: string) {
        const storedEvent = sessionStorage.getItem('selectedEvent')
        if (storedEvent) {
            const parsedEvent = JSON.parse(storedEvent)
            if (parsedEvent.uid !== uid) {
                sessionStorage.removeItem('selectedEvent')
                return
            }
            setEventData(parsedEvent)
        }
    }

    async function fetchDataFromDb(uid: string) {
        try {
            const response = await fetch(`/api/calendar/events?uid=${uid}`)
            if (response.ok) {
                const data = await response.json()
                setEventData(data)
            } else {
                console.error('Failed to fetch event data from DB')
            }
        } catch (error) {
            console.error('Error fetching event data from DB:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectProject = (projectUid: string) => {
        if (selectedProject === projectUid) return
        setSelectedProject(projectUid)
        router.push({
            pathname: router.pathname,
            query: { ...router.query, project: projectUid }
        }, undefined, { shallow: true })
    }

    const handleSelectProjectTab = (tab: 'index' | 'timetable' | 'calculation' | 'equipment' | 'crew', projectUid: string) => {
        if (selectedProject !== projectUid) {
            setSelectedProject(projectUid)
        }
        if (view !== tab) {
            setView(tab)
        }
        router.push({
            pathname: router.pathname,
            query: { ...router.query, project: projectUid, view: tab }
        }, undefined, { shallow: true })
     }

    useEffect(() => {
        if (!router.isReady || !eventUid) {
            return
        }

        fetchDataFromSessionStorage(eventUid)
        fetchDataFromDb(eventUid)
    }, [router.isReady, eventUid])

    useEffect(() => {
        if (!eventData?.name) return
        setCurrentTabTitle(eventData.name)
    }, [eventData?.name, setCurrentTabTitle])

    async function handleInputChange(event: React.ChangeEvent<HTMLInputElement>, field: string, projectUid?: string) {
        if (!eventData) return

        const updatedEventData = { ...eventData }

        if (projectUid) {
            const projectIndex = updatedEventData.projects.findIndex(p => p.uid === projectUid)
            if (projectIndex !== -1) {
                updatedEventData.projects[projectIndex] = { ...updatedEventData.projects[projectIndex], [field]: event.target.value }
            }
        } else {
            (updatedEventData as Record<string, unknown>)[field] = event.target.value
        }

        setEventData(updatedEventData)
    }

    function handleProjectDateChange(projectUid: string, dateIndex: number, key: 'start' | 'end', value: string) {
        if (!eventData) return

        setEventData((current) => {
            if (!current) return current

            return {
                ...current,
                projects: current.projects.map((project) => {
                    if (project.uid !== projectUid) return project

                    return {
                        ...project,
                        dates: project.dates.map((dateRange, index) =>
                            index === dateIndex ? { ...dateRange, [key]: value } : dateRange
                        ),
                    }
                }),
            }
        })
    }

    function handleAddProjectDateRange(projectUid: string) {
        if (!eventData) return

        const now = new Date().toISOString()

        setEventData((current) => {
            if (!current) return current

            return {
                ...current,
                projects: current.projects.map((project) =>
                    project.uid === projectUid
                        ? {
                            ...project,
                            dates: [...project.dates, { start: now, end: now }],
                        }
                        : project
                ),
            }
        })
    }

    function handleRemoveProjectDateRange(projectUid: string, dateIndex: number) {
        if (!eventData) return

        setEventData((current) => {
            if (!current) return current

            return {
                ...current,
                projects: current.projects.map((project) => {
                    if (project.uid !== projectUid) return project

                    return {
                        ...project,
                        dates: project.dates.filter((_, index) => index !== dateIndex),
                    }
                }),
            }
        })
    }

    async function handleSave() {
        if (!eventData) return
        if (saving) return
        setSaving(true)
        try {
            const response = await fetch(`/api/calendar/events?uid=${eventData.uid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            })
            if (response.ok) {
                const updatedEvent = await response.json()
                setEventData(updatedEvent)
                sessionStorage.setItem('selectedEvent', JSON.stringify(updatedEvent))
            } else {
                console.error('Failed to save event data')
                alert('Fehler beim Speichern des Events.')
            }
        } catch (error) {
            console.error('Error saving event data:', error)
            alert('Fehler beim Speichern des Events.')
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.altKey && event.key.toLowerCase() === 's') {
                event.preventDefault()
                void handleSave()
            }
        }

        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [eventData, saving])

    return (
        <ProtectedPage pageTitle={eventData ? eventData.name : 'Event'} permission='accessCalendarEvent'>
                <div className="flex items-center justify-between mb-4">
                    <PageTitle title={eventData ? eventData.name : 'Event'} icon={Book} />
                    <div className="flex items-center gap-2">
                        <Button className='text-sm rounded-md border border-gray-800 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-700' onClick={() => handleSave()} disabled={saving}>
                            <Save className='inline h-4 w-4' />
                            <span className='!p-0'>{saving ? 'Speichern...' : 'Speichern'}</span>
                        </Button>
                        <Navbar items={[
                            { id: 'index', name: 'Übersicht', onClick: () => handleViewChange('index'), icon: ClipboardList, requiredPermission: 'viewEventIndex'},
                            { id: 'timetable', name: 'Zeitplan', onClick: () => handleViewChange('timetable'), icon: CalendarRange, requiredPermission: 'viewEventTimetable'},
                            { id: 'calculation', name: 'Kalkulation', onClick: () => handleViewChange('calculation'), icon: HandCoins, requiredPermission: 'viewEventCalculation'},
                            { id: 'equipment', name: 'Equipment', onClick: () => handleViewChange('equipment'), icon: Package, requiredPermission: 'viewEventEquipment'},
                            { id: 'crew', name: 'Crew', onClick: () => handleViewChange('crew'), icon: Users, requiredPermission: 'viewEventCrew'}
                        ]} activeItemId={view} />
                    </div>
                </div>
                <div className="flex h-[calc(100vh-17.2rem)] divide-x gap-4">
                    <div className="min-w-1/6 p-4 h-full ">
                        <h2 className="text-lg font-semibold mb-2">Projekte</h2>
                        <div className="mx-2 h-full overflow-y-auto divide-y">
                            {eventData?.projects.map((project) => (
                                <div onClick={() => handleSelectProject(project.uid)} key={project.uid} className="py-2 cursor-pointer hover:underline transition-colors">
                                    <h3 className="text-md font-medium">{project.name}</h3>
                                    {project.dates.map((date, index) => (
                                        <div key={index} className="text-sm text-gray-600">
                                            {formatDateForDisplay(date.start)} - {formatDateForDisplay(date.end)}
                                        </div>
                                    ))}
                                    {project.equipment && project.equipment.groups.length > 0 && (
                                        <div onClick={() => handleSelectProjectTab('equipment', project.uid)} className="text-sm text-gray-600">
                                            Equipment
                                        </div>
                                    )}
                                    {project.calculation && project.calculation.positions && project.calculation.positions.length > 0 && (
                                        <div onClick={() => handleSelectProjectTab('calculation', project.uid)} className="text-sm text-gray-600">
                                            Kalkulation
                                        </div>
                                    )}
                                    {project.crew?.positions && project.crew?.positions.length > 0 && (
                                        <div onClick={() => handleSelectProjectTab('crew', project.uid)} className="text-sm text-gray-600">
                                            Crew
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="h-7">&nbsp;</div>
                        </div>
                        <div className="relative -top-8 bg-neutral-900 text-white p-2 rounded-md cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => {
                            const newProject = {
                                uid: uuidv4(),
                                name: 'Neues Projekt',
                                dates: [{ start: new Date().toISOString(), end: new Date().toISOString() }],
                                equipment: { groups: [] },
                                crew: { positions: [], bookedCrew: [] },
                                timetable: { events: [] },
                                calculation: { positions: [] }
                            }
                            setEventData((current) => {
                                if (!current) return current
                                return {
                                    ...current,
                                    projects: [...current.projects, newProject]
                                }
                            })
                            handleSelectProject(newProject.uid)
                        }}>
                            Neu
                        </div>
                    </div>
                    <div className="w-full">
                        {!selectedProject && (<div className="h-full flex items-center justify-center"><h2 className='select-none'>Wähle ein Projekt aus, um die Details anzuzeigen</h2></div>)}
                        {selectedProject && view === 'index' && (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Projektübersicht</h2>
                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Projektname</label>
                                        <Input type="text" onChange={(e) => handleInputChange(e, 'name', selectedProject)} value={eventData?.projects.find(p => p.uid === selectedProject)?.name || ''}  />
                                    </div>
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="block text-sm font-medium text-gray-700">Zeiträume</label>
                                            <Button
                                                type="button"
                                                className="rounded border border-gray-800 p-1 text-sm transition-all duration-200 hover:bg-gray-700"
                                                onClick={() => handleAddProjectDateRange(selectedProject)}
                                            >
                                                <Plus className="inline h-4 w-4" />
                                                <span className="!p-0">Zeitraum hinzufügen</span>
                                            </Button>
                                        </div>
                                        {eventData?.projects.find(p => p.uid === selectedProject)?.dates.map((date, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    type="date"
                                                    onChange={(e) => handleProjectDateChange(selectedProject, index, 'start', e.target.value)}
                                                    value={formatDateForInput(date.start)}
                                                />
                                                <span> - </span>
                                                <Input
                                                    type="date"
                                                    onChange={(e) => handleProjectDateChange(selectedProject, index, 'end', e.target.value)}
                                                    value={formatDateForInput(date.end)}
                                                />
                                                {eventData?.projects.find(p => p.uid === selectedProject)?.dates.length! > 1 && (
                                                    <Button
                                                        type="button"
                                                        design='danger'
                                                        onClick={() => handleRemoveProjectDateRange(selectedProject, index)}
                                                    >
                                                        <Trash2 className="inline h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
        </ProtectedPage>
    )
}

export default EventIndexPage