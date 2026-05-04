'use client'

import useInstanceConfig from '@/hooks/useInstanceConfig'
import type { LucideIcon } from 'lucide-react'
import { Award, Book, BookUser, Building2, Calendar, ChevronDown, ChevronRight, ClipboardType, Home, Package, PowerCircle, Scroll, Settings, ShieldUser, SquareUser, User, Users, UsersRound, Warehouse } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

type NavigationItem = {
    name: string
    href: string
    icon: LucideIcon
    requiredPermission?: string
    children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Kalender', href: '/calendar', icon: Calendar, children: [
        { name: 'Dispo-Ansicht', href: '/calendar/crew', icon: UsersRound, requiredPermission: 'viewCrewCalendar' },
    ] },
    { name: 'Equipment', href: '/equipment', icon: Package, requiredPermission: 'viewEquipment' },
    { name: 'Kontakte', href: '/contacts', icon: Book, requiredPermission: 'viewContacts', children: [
        { name: 'Dienstleister', href: '/contacts/suppliers', icon: Building2, requiredPermission: 'viewSuppliers' },
        { name: 'Kunden', href: '/contacts/clients', icon: BookUser, requiredPermission: 'viewClients' },
    ] },
    { name: 'Einstellungen', href: '/settings', icon: Settings, requiredPermission: 'viewSettings', children: [
        { name: 'Brandings', href: '/settings/brandings', icon: Building2, requiredPermission: 'viewBrandings', children: [
            { name: 'Briefpapier', href: '/settings/brandings/stationery', icon: Scroll, requiredPermission: 'viewStationery' },
            { name: 'Textbausteine', href: '/settings/textblocks', icon: ClipboardType, requiredPermission: 'viewTextblocks' },
        ] },
        { name: 'Standorte', href: '/settings/warehouses', icon: Warehouse, requiredPermission: 'viewWarehouses' },
        { name: 'Positionen', href: '/settings/positions', icon: Award, requiredPermission: 'viewPositions' },
        { name: 'Crew', href: '/settings/crew', icon: Users, requiredPermission: 'viewCrew' },
        { name: 'Rollen', href: '/settings/roles', icon: ShieldUser, requiredPermission: 'viewRoles' },
    ] },
]

function Item({ item, extendSidebar }: { item: NavigationItem; extendSidebar: boolean }) {
    const router = useRouter()

    return (
        <>
        <Link
            href={router.pathname === item.href ? '#' : item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900 ${router.pathname === item.href || (router.pathname.startsWith(item.href) && item.children != null) ? 'bg-gray-700' : ''}   `}
        >
            <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200 ${extendSidebar ? '' : 'w-full'}`}> 
                <item.icon />
            </span>
            {extendSidebar ? <span className="truncate">{item.name}</span> : null}
        </Link>
        {item.children && (extendSidebar || router.pathname.startsWith(item.href)) ? (
            <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => (
                    <Item key={child.name} item={child} extendSidebar={extendSidebar} />
                ))}
            </div>
        ) : null}
        </>
    )
}

export default function Sidebar() {
    const instanceConfig = useInstanceConfig()
    const [extendSidebar, setExtendSidebar] = useState(true)
    const { data: session } = useSession()
    const [extendProfile, setExtendProfile] = useState(false)
    const [extendCalendar, setExtendCalendar] = useState(false)

    return (
        <nav
            className={`select-none flex h-screen overflow-hidden sticky top-0 flex-col border-r border-gray-800 p-3 transition-all duration-200 ${extendSidebar ? 'w-64' : 'w-20'}`}
            aria-label="Sidebar"
        >
            {/* <div className={`mb-4 ${extendSidebar ? 'flex items-center justify-between' : ''}`}> */}
                <div className={`mb-4 flex items-center justify-between`}>

                {extendSidebar ? 
                    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors">
                        <img src={instanceConfig?.design.logoUrl ?? '/vercel.svg'} alt="4play Logo" width={32} height={32} className='inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200' />
                        <span className="truncate">{instanceConfig?.name ?? '4play'}</span>
                    </div> : null
                }
                
                <button
                    type="button"
                    onClick={() => setExtendSidebar((current) => !current)}
                    className={`cursor-pointer flex items-center ${extendSidebar ? '' : 'w-full'} gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900`}
                    aria-label={extendSidebar ? 'Sidebar einklappen' : 'Sidebar ausklappen'}
                >
                    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200 ${extendSidebar ? '' : 'w-full'}`}> 
                        <ChevronRight className={`transition-transform duration-300 ${extendSidebar ? 'rotate-180' : ''}`} />
                    </span>
                </button>
            </div>

            <div className="space-y-1">
                {navigationItems.map((item) => (
                    <Item key={item.name} item={item} extendSidebar={extendSidebar} />
                ))}
            </div>


            {/* <div className={`mt-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 ${extendSidebar ? '' : 'hidden'}`}>
                <p className="font-medium">Beta-Version</p>
                <p className="mt-1">Diese Version von 4play befindet sich noch in der Entwicklung. Es können Fehler auftreten und Funktionen können sich ändern.</p>
            </div> */}


            <div className={`mt-auto transition-all duration-300 relative ${extendSidebar ? '' : 'absolute bottom-0'} ${extendProfile && extendSidebar ? '-bottom-2' : '-bottom-23'}`}>
                <button className={` cursor-pointer flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 transition-all duration-300`} onClick={() => setExtendProfile((current) => !current)}>
                    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200 ${extendSidebar ? '' : 'w-full'}`}> 
                        <User className='h-5 w-5' />
                    </span>
                    {extendSidebar ? 
                        <>
                            <span className="truncate">{session?.user?.firstName + " " + session?.user?.lastName}</span>
                            <ChevronDown className={`transition-transform duration-300 ${extendProfile ? 'rotate-180' : ''}`} />
                        </> : null
                    }
                </button>

                <div className={`mt-1 space-y-1 rounded-md ml-8 transition-all duration-300 ${extendSidebar ? '' : 'hidden'}`}>
                    <Link href="/profile" className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900">
                        <SquareUser className='h-5 w-5 inline-flex mr-2' />
                        Profil
                    </Link>
                    <button onClick={()=>signOut()} className="w-full text-left cursor-pointer block rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900">
                        <PowerCircle className='h-5 w-5 inline-flex mr-2' />
                        Abmelden
                    </button>
                </div>

            </div>
        </nav>
    )
}
