import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import Event from '@/types/calendar/event'
import { Book, CalendarRange, ClipboardList, HandCoins, Package, Users } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

function EventIndexPage() {
    const router = useRouter()
    const [view, setView] = React.useState<'index' | 'timetable' | 'calculation' | 'equipment' | 'crew'>('index')
    const [eventData, setEventData] = useState<Event>();
    const [loading, setLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState<string | null>(null)

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

    return (
        <ProtectedPage pageTitle={eventData ? eventData.name : 'Event'} permission='accessCalendarEvent'>
                <div className="flex items-center justify-between mb-4">
                    <PageTitle title={eventData ? eventData.name : 'Event'} icon={Book} />
                    <div className="flex items-center gap-2">
                        <Navbar items={[
                            { id: 'index', name: 'Übersicht', onClick: () => handleViewChange('index'), icon: ClipboardList, requiredPermission: 'viewEventIndex'},
                            { id: 'timetable', name: 'Zeitplan', onClick: () => handleViewChange('timetable'), icon: CalendarRange, requiredPermission: 'viewEventTimetable'},
                            { id: 'calculation', name: 'Kalkulation', onClick: () => handleViewChange('calculation'), icon: HandCoins, requiredPermission: 'viewEventCalculation'},
                            { id: 'equipment', name: 'Equipment', onClick: () => handleViewChange('equipment'), icon: Package, requiredPermission: 'viewEventEquipment'},
                            { id: 'crew', name: 'Crew', onClick: () => handleViewChange('crew'), icon: Users, requiredPermission: 'viewEventCrew'}
                        ]} activeItemId={view} />
                    </div>
                </div>
                <div className="flex h-[calc(100vh-13.8rem)] gap-4">
                    <div className="min-w-1/5 border border-gray-300 rounded p-4 h-full">
                        <h2 className="text-lg font-semibold mb-2">Projekte</h2>
                        <div className="h-full overflow-y-auto">
                            {eventData?.projects.map((project) => (
                                <div onClick={() => handleSelectProject(project.uid)} key={project.uid} className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <h3 className="text-md font-medium">{project.name}</h3>
                                    {project.dates.map((date, index) => (
                                        <div key={index} className="text-sm text-gray-600">
                                            {new Date(date.start).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(date.end).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                        </div>
                    </div>
                    <div className="w-full">
                        {!selectedProject && (<div className="h-full flex items-center justify-center"><h2>Wähle ein Projekt aus, um die Details anzuzeigen</h2></div>)}
                    </div>
                </div>
        </ProtectedPage>
    )
}

export default EventIndexPage