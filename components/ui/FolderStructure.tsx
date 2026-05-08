import React, { useMemo, useState } from 'react'
import { ChevronRight, Folder, type LucideIcon } from 'lucide-react'

export type Item = {
    uuid: string
    path: string
    name: string
    icon: LucideIcon
}

interface FolderStructureProps {
    items: Item[]
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

function getParentFolderPath(path: string): string {
    if (path === '/') {
        return '/'
    }

    const parts = path.split('/').filter(Boolean)
    if (parts.length <= 1) {
        return '/'
    }

    return `/${parts.slice(0, -1).join('/')}`
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
        const folderPath = item.path.trim().endsWith('/')
            ? normalizedPath
            : getParentFolderPath(normalizedPath)

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
    onToggle: (path: string) => void,
    depth = 0
): React.ReactNode {
    const sortedFolders = Object.values(node.folders).sort((a, b) => a.name.localeCompare(b.name))
    const sortedItems = [...node.items].sort((a, b) => a.name.localeCompare(b.name))
    const isExpanded = depth === 0 || expandedFolders.has(node.path)
    const hasChildren = sortedFolders.length > 0 || sortedItems.length > 0

    return (
        // <div key={node.path} className={depth > 0 ? 'mb-4' : ''}>
        <div key={node.path}>
            {depth > 0 && (
                <button
                    type='button'
                    className='cursor-pointer flex items-center gap-2 mb-2 text-left hover:text-gray-100 transition-opacity'
                    onClick={() => onToggle(node.path)}
                    aria-expanded={isExpanded}
                >
                    {/* <ChevronRight
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${hasChildren ? 'opacity-100' : 'opacity-30'}`}
                    /> */}
                    <Folder className='h-5 w-5' />
                    <span className='font-semibold'>{node.name}</span>
                </button>
            )}

            {isExpanded && (
                <div className={depth > 0 ? 'ml-6 flex flex-col gap-2' : 'flex flex-col gap-2'}>
                    {sortedItems.map(item => (
                        <div key={item.uuid} className='flex items-center gap-2'>
                            <item.icon className='h-4 w-4' />
                            <span>{item.name}</span>
                        </div>
                    ))}

                    {sortedFolders.map(folder => renderFolder(folder, expandedFolders, onToggle, depth + 1))}
                </div>
            )}
        </div>
    )
}

export default function FolderStructure(props: FolderStructureProps) {
    const folderTree = useMemo(() => buildFolderTree(props.items), [props.items])
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

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

    return (
        <div>
            {renderFolder(folderTree, expandedFolders, toggleFolder)}
        </div>
    )
}
