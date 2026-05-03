'use client'

import useInstanceConfig from '@/hooks/useInstanceConfig'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

type NavigationItem = {
    name: string
    href: string
    icon: 'home' | 'settings'
    requiredPermission?: string
    children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: 'home' },
    { name: 'Einstellungen', href: '/settings', icon: 'settings', requiredPermission: 'viewSettings' },
]

function HomeIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v10h14V10" />
        </svg>
    )
}

function SettingsIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z"
            />
        </svg>
    )
}

function Item({ item, extended }: { item: NavigationItem; extended: boolean }) {
    return (
        <Link
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
            <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200 ${extended ? '' : 'w-full'}`}> 
                {item.icon === 'home' ? <HomeIcon /> : <SettingsIcon />}
                {/* <{...item.icon} /> */}
            </span>
            {extended ? <span className="truncate">{item.name}</span> : null}
        </Link>
    )
}

export default function Sidebar() {
    const instanceConfig = useInstanceConfig()
    const [extended, setExtended] = useState(false)

    return (
        <nav
            className={`select-none flex h-screen sticky top-0 flex-col border-r border-gray-200 p-3 transition-all duration-200 ${extended ? 'w-64' : 'w-20'}`}
            aria-label="Sidebar"
        >
            {/* <div className={`mb-4 ${extended ? 'flex items-center justify-between' : ''}`}> */}
                <div className={`mb-4 flex items-center justify-between`}>

                {extended ? 
                    <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors">
                        <img src={instanceConfig?.design.logoUrl ?? '/vercel.svg'} alt="4play Logo" width={32} height={32} className='inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200' />
                        <span className="truncate">{instanceConfig?.name ?? '4play'}</span>
                    </div> : null
                }
                
                <button
                    type="button"
                    onClick={() => setExtended((current) => !current)}
                    className={`flex items-center ${extended ? '' : 'w-full'} gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900`}
                    aria-label={extended ? 'Sidebar einklappen' : 'Sidebar ausklappen'}
                >
                    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200 ${extended ? '' : 'w-full'}`}> 
                        <ChevronRight className={`transition-transform duration-300 ${extended ? 'rotate-180' : ''}`} />
                    </span>
                </button>
            </div>

            <div className="space-y-1">
                {navigationItems.map((item) => (
                    <Item key={item.name} item={item} extended={extended} />
                ))}
            </div>
        </nav>
    )
}
