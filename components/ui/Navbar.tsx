import React from 'react'
import type { LucideIcon } from 'lucide-react'

type NavigationItem = {
    id: string
    name: string
    href?: string
    onClick?: () => void
    icon: LucideIcon
    requiredPermission?: string
}

interface NavbarProps {
    items: NavigationItem[]
    activeItemId?: string
}

export default function Navbar(props: NavbarProps) {
  return (
    <nav className='select-none'>
        <ul className="flex gap-4">
            {props.items.map(item => (
                <li key={item.id}>
                    <a id={item.id} href={item.href} onClick={item.onClick} className={`cursor-pointer flex items-center gap-1 text-sm font-medium transition-all duration-200 ${props.activeItemId === item.id ? 'underline' : 'text-gray-100 hover:text-blue-400'}`}>
                        <item.icon className="h-4 w-4" />
                        {item.name}
                    </a>
                </li>
            ))}
        </ul>
    </nav>
  )
}
