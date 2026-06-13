import Navbar from '@/components/ui/Navbar'
import PageTitle from '@/components/utility/PageTitle'
import ProtectedPage from '@/components/utility/ProtectedPage'
import { Book, CalendarRange, ClipboardList, HandCoins, Package, Users } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

function EventIndexPage() {
        const router = useRouter()
    const [view, setView] = React.useState<'index' | 'timetable' | 'calculation' | 'equipment' | 'crew'>('index')

    useEffect(() => {
        setView((router.query.view as typeof view) || 'index')
    }, [router.query.view])

    const handleViewChange = (newView: typeof view) => {
        setView(newView)
        router.push({
            pathname: router.pathname,
            query: { ...router.query, view: newView }
        }, undefined, { shallow: true })
    }

    return (
        <ProtectedPage pageTitle="Event Details" permission='accessCalendarEvent'>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <PageTitle title="Event Details" icon={Book} />
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

            </div>
        </ProtectedPage>
    )
}

export default EventIndexPage