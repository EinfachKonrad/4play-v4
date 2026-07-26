import React, { useMemo, useState } from 'react'
import { Folder, type LucideIcon } from 'lucide-react'
import ContextMenu from './ContextMenu'
import { type ContextMenuState } from './ContextMenu'

export type Item = {
    id: string
    path: string
    name: string
    displayName?: string
    icon: LucideIcon
    iconColor?: string
    children?: Item[]
    options?: Array<{
        icon?: LucideIcon
        name?: string
        title: string
        onClick: () => void
    }>
    contextMenu?: {
        options: Array<{
            id: string;
            label: string;
            onSelect: () => void;
            icon?: LucideIcon;
            disabled?: boolean;
            danger?: boolean;
        }>
    }
}

interface FolderStructureProps {
    items: Item[]
    expandAllFolders?: boolean
}

type FolderNode = {
    name: string
    path: string
    folders: Record<string, FolderNode>
    items: Item[]
}

function normalizePath(path: string): string {
    // Normalize separators and collapse duplicate slashes.
    const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/').trim()

    if (!normalized || normalized === '/') {
        return '/'
    }

    const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
    return withLeadingSlash.replace(/\/$/, '')
}

function createFolderNode(name: string, path: string): FolderNode {
    return {
        name,
        path,
        folders: {},
        items: []
    }
}

function buildFolderTree(items: Item[]): FolderNode {
    const root = createFolderNode('Root', '/')

    items.forEach(item => {
        const normalizedPath = normalizePath(item.path)
        const folderPath = normalizedPath

        const segments = folderPath === '/' ? [] : folderPath.split('/').filter(Boolean)
        let current = root
        let currentPath = ''

        segments.forEach(segment => {
            currentPath += `/${segment}`
            if (!current.folders[segment]) {
                current.folders[segment] = createFolderNode(segment, currentPath)
            }
            current = current.folders[segment]
        })

        current.items.push(item)
    })

    return root
}

function renderFolder(
    node: FolderNode,
    expandedFolders: Set<string>,
    expandAllFolders: boolean,
    onToggle: (path: string) => void,
    onItemContextMenu: (event: React.MouseEvent, item: Item) => void,
    depth = 0
): React.ReactNode {
    const sortedFolders = Object.values(node.folders).sort((a, b) => a.name.localeCompare(b.name))
    const sortedItems = [...node.items].sort((a, b) => a.name.localeCompare(b.name))
    const isExpanded = depth === 0 || expandAllFolders || expandedFolders.has(node.path)
    const rowClassName = 'flex flex-col gap-1 pl-2'
    const folderHeaderClassName = 'cursor-pointer flex items-center gap-1 mb-1 rounded px-1 py-0.5 text-left hover:bg-neutral-800 hover:text-gray-100 transition-colors'
    const folderBlockClassName = depth > 1
        ? 'ml-4 flex flex-col gap-1 border-l border-neutral-800 pl-2'
        : 'flex flex-col gap-1'

    return (
        // <div key={node.path} className={depth > 0 ? 'mb-4' : ''}>
        <div key={node.path}>
            <div className={folderBlockClassName}>
                {depth > 0 && (
                    <button
                        type='button'
                        className={folderHeaderClassName}
                        onClick={() => onToggle(node.path)}
                        aria-expanded={isExpanded}
                    >
                        {/* <ChevronRight
                            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${hasChildren ? 'opacity-100' : 'opacity-30'}`}
                        /> */}
                        <Folder className='h-4 w-4' />
                        <span className='text-sm font-medium'>{node.name}</span>
                    </button>
                )}

                {isExpanded && (
                    <>
                        {sortedItems.map(item => (
                        <div
                            key={item.id}
                            className={rowClassName}
                            onContextMenu={item.contextMenu ? (event) => onItemContextMenu(event, item) : undefined}
                        >
                            <div className='flex items-center gap-1 rounded px-1 py-0.5 hover:bg-neutral-800'>
                                <item.icon className={`h-4 w-4 ${item.iconColor ?? ''}`.trim()} />
                                <span className='text-sm'>{item.displayName ?? item.name}</span>
                                {item.options && (
                                    <div className='flex gap-2 ml-auto'>
                                        {item.options.map((option, index) => (
                                            <button
                                                key={index}
                                                type='button'
                                                className='flex items-center gap-1 text-sm text-gray-400 hover:text-gray-100 transition-opacity'
                                                onClick={option.onClick}
                                                title={option.title}
                                            >
                                                {option.icon && <option.icon />}
                                                {option.name && <span>{option.name}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {item.children && item.children.length > 0 && (
                                <div className='ml-4 flex flex-col gap-1'>
                                    {item.children.map((child) => (
                                        <div key={child.id} className={rowClassName}>
                                            <div className='flex items-center gap-1 rounded px-1 py-0.5 hover:bg-neutral-800'>
                                                <child.icon className={`h-4 w-4 ${child.iconColor ?? ''}`.trim()} />
                                                <span className='text-sm'>{child.displayName ?? child.name}</span>
                                            </div>
                                            {child.options && (
                                                <div className='flex gap-2 ml-auto'>
                                                    {child.options.map((option, index) => (
                                                        <button
                                                            key={index}
                                                            type='button'
                                                            className='flex items-center gap-1 text-sm text-gray-400 hover:text-gray-100 transition-opacity'
                                                            onClick={option.onClick}
                                                            title={option.title}
                                                        >
                                                            {option.icon && <option.icon />}
                                                            {option.name && <span>{option.name}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        ))}
                        {sortedFolders.map(folder => renderFolder(folder, expandedFolders, expandAllFolders, onToggle, onItemContextMenu, depth + 1))}
                    </>
                )}
            </div>
        </div>
    )
}

export default function FolderStructure(props: FolderStructureProps) {
    const folderTree = useMemo(() => buildFolderTree(props.items), [props.items])
    const expandAllFolders = props.expandAllFolders ?? false
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [menu, setMenu] = useState<ContextMenuState<Item> | null>(null)

    const toggleFolder = (path: string): void => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }
            return next
        })
    }

    const handleItemContextMenu = (event: React.MouseEvent, item: Item): void => {
        if (!item.contextMenu || item.contextMenu.options.length === 0) {
            return
        }

        event.preventDefault()

        setMenu({
            x: event.clientX,
            y: event.clientY,
            payload: item,
            items: item.contextMenu.options.map(option => ({
                id: option.id,
                label: option.label,
                onSelect: (_payload: Item) => option.onSelect(),
                icon: option.icon,
                disabled: option.disabled,
                danger: option.danger
            }))
        })
    }

    return (
        <div>
            {renderFolder(folderTree, expandedFolders, expandAllFolders, toggleFolder, handleItemContextMenu)}
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    )
}
